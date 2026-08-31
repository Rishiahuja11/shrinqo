package linkshort;

import org.bukkit.Bukkit;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.File;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * File-based command bridge between the embedded Node.js webapp and the
 * Minecraft server. The webapp drops job files into ops-queue/, this class
 * executes them and writes results into ops-out/. The webapp exposes these
 * as /api/v1/ops/* endpoints guarded by the ops key.
 *
 * Protocol:
 *   request :  <id>.mode  ("console" | "shell")
 *              <id>.cmd   (utf-8 command text)
 *   response:  <id>.meta  (json: {"ok":..,"exit":..,"timeout":..,"ts":..})
 *              <id>.out   (utf-8 output, truncated)
 *              <id>.done  (empty marker, written last)
 */
public class OpsBridge {
    private final JavaPlugin plugin;
    private final File baseDir;      // plugins/LinkShort
    private final File queueDir;
    private final File outDir;
    private final File statusFile;
    private volatile boolean running;

    private static final int MAX_OUTPUT = 128 * 1024;
    private static final long SHELL_TIMEOUT_MS = 25_000;
    private static final long OUT_TTL_MS = 120_000;

    public OpsBridge(JavaPlugin plugin, File baseDir) {
        this.plugin = plugin;
        this.baseDir = baseDir;
        this.queueDir = new File(baseDir, "ops-queue");
        this.outDir = new File(baseDir, "ops-out");
        this.statusFile = new File(baseDir, "ops-status.json");
        //noinspection ResultOfMethodCallIgnored
        queueDir.mkdirs();
        //noinspection ResultOfMethodCallIgnored
        outDir.mkdirs();
    }

    public void start() {
        running = true;
        Bukkit.getScheduler().runTaskTimerAsynchronously(plugin, this::tick, 20L, 20L);
        Bukkit.getScheduler().runTaskTimerAsynchronously(plugin, this::writeStatus, 60L, 100L);
        plugin.getLogger().info("[ops] Bridge active (queue=" + queueDir.getName() + ")");
    }

    public void stop() { running = false; }

    // ------------------------------------------------------------ poller

    private void tick() {
        if (!running) return;
        try {
            cleanupOld();
            File[] jobs = queueDir.listFiles((d, n) -> n.endsWith(".cmd"));
            if (jobs == null || jobs.length == 0) return;
            Arrays.sort(jobs, Comparator.comparingLong(File::lastModified));
            for (File job : jobs) {
                if (!running) break;
                safeProcess(job);
            }
        } catch (Throwable t) {
            plugin.getLogger().warning("[ops] tick error: " + t.getMessage());
        }
    }

    private void safeProcess(File job) {
        String id = job.getName().substring(0, job.getName().length() - 4);
        try {
            process(job, id);
        } catch (Throwable t) {
            writeResult(id, "{\"ok\":false,\"error\":" + jsonStr(String.valueOf(t)) + ",\"ts\":" + System.currentTimeMillis() + "}", "");
        } finally {
            //noinspection ResultOfMethodCallIgnored
            new File(queueDir, id + ".cmd").delete();
            //noinspection ResultOfMethodCallIgnored
            new File(queueDir, id + ".mode").delete();
        }
    }

    private void process(File job, String id) throws Exception {
        byte[] modeB = Files.readAllBytes(new File(queueDir, id + ".mode").toPath());
        byte[] cmdB = Files.readAllBytes(job.toPath());
        String mode = new String(modeB, StandardCharsets.UTF_8).trim();
        String command = new String(cmdB, StandardCharsets.UTF_8);

        if ("shell".equals(mode)) {
            runShell(id, command);
        } else {
            runConsole(id, command);
        }
    }

    // ------------------------------------------------------------ executors

    private void runShell(String id, String command) throws Exception {
        File serverRoot = baseDir.getParentFile() == null ? baseDir : baseDir.getParentFile().getParentFile();
        if (serverRoot == null) serverRoot = baseDir;
        Process p = new ProcessBuilder("sh", "-c", command)
                .directory(serverRoot)
                .redirectErrorStream(true)
                .start();
        StringBuilder sb = new StringBuilder();
        Thread reader = new Thread(() -> {
            try (InputStream in = p.getInputStream()) {
                byte[] buf = new byte[4096];
                int n;
                while ((n = in.read(buf)) > 0 && sb.length() < MAX_OUTPUT) {
                    sb.append(new String(buf, 0, n, StandardCharsets.UTF_8));
                }
            } catch (Exception ignored) {}
        });
        reader.setDaemon(true);
        reader.start();
        boolean done = p.waitFor(SHELL_TIMEOUT_MS, TimeUnit.MILLISECONDS);
        boolean timeout = false;
        if (!done) {
            timeout = true;
            p.destroyForcibly();
        }
        reader.join(2000);
        int exit = timeout ? -1 : p.exitValue();
        String meta = "{\"ok\":" + (exit == 0) + ",\"exit\":" + exit
                + ",\"timeout\":" + timeout + ",\"ts\":" + System.currentTimeMillis() + "}";
        writeResult(id, meta, truncate(sb.toString()));
    }

    private void runConsole(String id, String command) throws Exception {
        long logLenBefore = latestLogLength();
        var future = Bukkit.getScheduler().callSyncMethod(plugin,
                () -> Bukkit.dispatchCommand(Bukkit.getConsoleSender(), command));
        boolean dispatched;
        boolean ok = false;
        try {
            ok = Boolean.TRUE.equals(future.get(5, TimeUnit.SECONDS));
            dispatched = true;
        } catch (Exception e) {
            dispatched = false;
        }
        Thread.sleep(800); // let console output land in latest.log

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("ok", dispatched && ok);
        meta.put("dispatched", dispatched);
        List<String> lines = tailLines(new File(serverLogsDir(), "latest.log"), logLenBefore, 40);
        String metaJson = mapToJson(meta);
        StringBuilder out = new StringBuilder();
        for (String l : lines) out.append(l).append('\n');
        writeResult(id, metaJson, truncate(out.toString()));
    }

    // ------------------------------------------------------------ status writer

    @SuppressWarnings("unchecked")
    private void writeStatus() {
        if (!running) return;
        try {
            var snap = Bukkit.getScheduler().callSyncMethod(plugin, () -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("version", Bukkit.getVersion());
                m.put("bukkit", Bukkit.getBukkitVersion());
                List<String> players = new ArrayList<>();
                Bukkit.getOnlinePlayers().forEach(p -> players.add(p.getName()));
                m.put("players", players);
                m.put("max_players", Bukkit.getMaxPlayers());
                Runtime rt = Runtime.getRuntime();
                m.put("mem_used_mb", (rt.totalMemory() - rt.freeMemory()) / 1048576);
                m.put("mem_max_mb", rt.maxMemory() / 1048576);
                double[] tps = tpsReflective();
                if (tps != null) m.put("tps", Math.round(tps[0] * 100.0) / 100.0);
                m.put("online_mode", Bukkit.getOnlineMode());
                m.put("worlds", Bukkit.getWorlds().size());
                return m;
            });
            Object o = snap.get(5, TimeUnit.SECONDS);
            @SuppressWarnings("unchecked")
            Map<String, Object> m = (Map<String, Object>) o;
            m.put("ts", System.currentTimeMillis());
            Files.write(statusFile.toPath(), mapToJson(m).getBytes(StandardCharsets.UTF_8));
        } catch (Throwable ignored) {}
    }

    private double[] tpsReflective() {
        try {
            Method m = Bukkit.class.getMethod("getTPS");
            return (double[]) m.invoke(null);
        } catch (Throwable t) {
            return null;
        }
    }

    // ------------------------------------------------------------ helpers

    private void writeResult(String id, String metaJson, String output) {
        try {
            Files.write(new File(outDir, id + ".meta").toPath(),
                    metaJson.getBytes(StandardCharsets.UTF_8));
            Files.write(new File(outDir, id + ".out").toPath(),
                    output.getBytes(StandardCharsets.UTF_8));
            // marker last — signals completion to the webapp
            //noinspection ResultOfMethodCallIgnored
            new File(outDir, id + ".done").createNewFile();
        } catch (Exception e) {
            plugin.getLogger().warning("[ops] write result failed: " + e.getMessage());
        }
    }

    private void cleanupOld() {
        File[] outs = outDir.listFiles();
        if (outs == null) return;
        long cutoff = System.currentTimeMillis() - OUT_TTL_MS;
        for (File f : outs) if (f.lastModified() < cutoff) f.delete();
    }

    private File serverLogsDir() {
        File root = baseDir.getParentFile();           // plugins/
        File logs = new File(root != null ? root.getParentFile() : null, "logs");
        return logs.isDirectory() ? logs : baseDir;
    }

    private long latestLogLength() {
        File log = new File(serverLogsDir(), "latest.log");
        return log.isFile() ? log.length() : -1;
    }

    /** Lines appended to the log after offset `before`. */
    private List<String> tailLines(File log, long before, int max) {
        List<String> res = new ArrayList<>();
        try {
            if (!log.isFile()) return res;
            long size = log.length();
            if (before < 0) before = Math.max(0, size - 16384);
            if (size <= before) return res;
            long start = Math.max(before, size - 65536);
            java.io.RandomAccessFile raf = new java.io.RandomAccessFile(log, "r");
            raf.seek(start);
            String line;
            while ((line = raf.readLine()) != null) {
                if (res.size() >= max) res.remove(0);
                res.add(line);
            }
            raf.close();
        } catch (Exception ignored) {}
        return res;
    }

    private String truncate(String s) {
        if (s == null) return "";
        return s.length() <= MAX_OUTPUT ? s : s.substring(0, MAX_OUTPUT) + "\n...[truncated]";
    }

    private String jsonStr(String s) {
        if (s == null) return "\"\"";
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "").replace("\t", "\\t") + "\"";
    }

    private String mapToJson(Map<String, Object> m) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : m.entrySet()) {
            if (!first) sb.append(',');
            first = false;
            sb.append(jsonStr(e.getKey())).append(':');
            Object v = e.getValue();
            if (v instanceof String) sb.append(jsonStr((String) v));
            else if (v instanceof List) {
                sb.append('[');
                List<?> l = (List<?>) v;
                for (int i = 0; i < l.size(); i++) {
                    if (i > 0) sb.append(',');
                    sb.append(l.get(i) instanceof String ? jsonStr((String) l.get(i)) : String.valueOf(l.get(i)));
                }
                sb.append(']');
            } else sb.append(v);
        }
        return sb.append('}').toString();
    }
}
