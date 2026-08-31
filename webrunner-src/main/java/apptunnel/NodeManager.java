package apptunnel;

import java.io.*;
import java.lang.reflect.Method;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Logger;

public class NodeManager {
    private final Logger log;
    private final String command;
    private final String workingDir;
    private Process process;
    private volatile boolean running;
    private volatile boolean portDetected;
    private int detectedPort = -1;
    private int pid = -1;
    private Thread watcher;
    private Thread logThread;
    private final ConcurrentLinkedDeque<String> recentLogs = new ConcurrentLinkedDeque<>();
    private static final int MAX_LOGS = 100;
    private Runnable onPortDetected;
    private final AtomicBoolean restarting = new AtomicBoolean(false);

    public NodeManager(Logger log, String command, String workingDir) {
        this.log = log;
        this.command = command;
        this.workingDir = workingDir;
    }

    public void setOnPortDetected(Runnable callback) { this.onPortDetected = callback; }
    public boolean isRunning() { return running && process != null && process.isAlive(); }
    public int getDetectedPort() { return detectedPort; }
    public int getPid() { return pid; }
    public List<String> getLogs() { return new ArrayList<>(recentLogs); }

    private String getWrappedCommand() {
        String nodeBin = command.split("\\s+")[0];
        String nodeDir = new File(nodeBin).getParent();
        if (nodeDir == null) return command;
        return "export PATH=\"" + nodeDir + ":$PATH\"; exec " + command;
    }

    public void start() {
        if (running) return;
        try {
            File dir = new File(workingDir);
            if (!dir.exists()) dir.mkdirs();

            Set<Integer> beforePorts = getListeningPorts();
            String wrappedCmd = getWrappedCommand();
            log.info("[node] Starting with: " + wrappedCmd);

            ProcessBuilder pb = new ProcessBuilder("sh", "-c", wrappedCmd);
            pb.directory(dir);
            pb.redirectErrorStream(true);
            process = pb.start();
            running = true;
            restarting.set(false);

            pid = getPidReflective(process);
            log.info("[node] Started PID=" + pid + " cmd=" + command);
            addLog("Started PID=" + pid);

            startLogThread();
            startWatcherThread(beforePorts);

        } catch (Exception e) {
            log.warning("[node] Start failed: " + e.getMessage());
            addLog("Start failed: " + e.getMessage());
        }
    }

    public void stop() {
        running = false;
        restarting.set(false);
        if (watcher != null) { watcher.interrupt(); watcher = null; }
        if (logThread != null) { logThread.interrupt(); logThread = null; }
        if (process != null) {
            process.destroyForcibly();
            try { process.waitFor(3, java.util.concurrent.TimeUnit.SECONDS); } catch (InterruptedException ignored) {}
            process = null;
        }
        log.info("[node] Stopped");
    }

    private void doRestart(Set<Integer> beforePorts) {
        log.info("[node] Restarting node...");
        running = false;
        if (process != null) {
            process.destroyForcibly();
            try { process.waitFor(2, java.util.concurrent.TimeUnit.SECONDS); } catch (InterruptedException ignored) {}
            process = null;
        }
        if (logThread != null) {
            logThread.interrupt();
            logThread = null;
        }
        pid = -1;
        portDetected = false;
        detectedPort = -1;
        restarting.set(false);

        File dir = new File(workingDir);
        if (!dir.exists()) dir.mkdirs();

        Set<Integer> newBeforePorts = getListeningPorts();
        String wrappedCmd = getWrappedCommand();
        log.info("[node] Restarting with: " + wrappedCmd);

        try {
            ProcessBuilder pb = new ProcessBuilder("sh", "-c", wrappedCmd);
            pb.directory(dir);
            pb.redirectErrorStream(true);
            process = pb.start();
            running = true;

            pid = getPidReflective(process);
            log.info("[node] Restarted PID=" + pid);
            addLog("Restarted PID=" + pid);

            startLogThread();
            startWatcherThread(newBeforePorts);

        } catch (Exception e) {
            log.warning("[node] Restart failed: " + e.getMessage());
            addLog("Restart failed: " + e.getMessage());
        }
    }

    private void startLogThread() {
        if (logThread != null) { logThread.interrupt(); }
        logThread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    addLog("[stdout] " + line);
                    log.info("[node] " + line);
                }
            } catch (IOException ignored) {}
        }, "WebRunner-Node-Log");
        logThread.setDaemon(true);
        logThread.start();
    }

    private void startWatcherThread(Set<Integer> beforePorts) {
        if (watcher != null) { watcher.interrupt(); }
        watcher = new Thread(() -> {
            int consecutiveFails = 0;
            while (running) {
                try {
                    if (process != null && !process.isAlive()) {
                        if (!running) break;
                        int exit = process.exitValue();
                        consecutiveFails++;
                        int backoff = Math.min(2000 * consecutiveFails, 60000);
                        log.warning("[node] Process exited (" + exit + "), restarting in " + (backoff / 1000) + "s...");
                        addLog("Process exited (" + exit + "), restarting in " + (backoff / 1000) + "s");
                        Thread.sleep(backoff);
                        if (!running) break;
                        if (restarting.compareAndSet(false, true)) {
                            doRestart(beforePorts);
                        }
                        return;
                    } else {
                        if (!portDetected && process != null && process.isAlive()) {
                            detectedPort = detectNewPort(beforePorts);
                            if (detectedPort > 0) {
                                portDetected = true;
                                log.info("[node] Detected listening port: " + detectedPort);
                                addLog("Detected port: " + detectedPort);
                                if (onPortDetected != null) onPortDetected.run();
                            }
                        }
                        consecutiveFails = 0;
                        Thread.sleep(2000);
                    }
                } catch (InterruptedException e) {
                    break;
                } catch (Exception e) {
                    try { Thread.sleep(5000); } catch (InterruptedException ie) { break; }
                }
            }
        }, "WebRunner-Node-Watcher");
        watcher.setDaemon(true);
        watcher.start();
    }

    private static int getPidReflective(Process proc) {
        try {
            Method pidMethod = Process.class.getMethod("pid");
            return (int) (long) pidMethod.invoke(proc);
        } catch (Exception e) {
            try {
                Object handle = proc.getClass().getMethod("processHandle").invoke(proc);
                Method pidMethod = handle.getClass().getMethod("pid");
                return (int) (long) pidMethod.invoke(handle);
            } catch (Exception e2) {
                return -1;
            }
        }
    }

    private Set<Integer> getListeningPorts() {
        Set<Integer> ports = new HashSet<>();
        try {
            Process p = new ProcessBuilder("ss", "-tlnH").start();
            try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                String line;
                while ((line = r.readLine()) != null) {
                    int port = parseListeningPort(line);
                    if (port > 0) ports.add(port);
                }
            }
            p.waitFor();
        } catch (Exception ignored) {}
        return ports;
    }

    private int detectNewPort(Set<Integer> beforePorts) {
        try {
            Process p = new ProcessBuilder("ss", "-tlnH").start();
            try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                String line;
                while ((line = r.readLine()) != null) {
                    int port = parseListeningPort(line);
                    if (port > 0 && !beforePorts.contains(port)) {
                        p.destroyForcibly();
                        return port;
                    }
                }
            }
            p.waitFor();
        } catch (Exception ignored) {}

        if (pid > 0) {
            try {
                Process p = new ProcessBuilder("ss", "-tlnp").start();
                try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                    String line;
                    while ((line = r.readLine()) != null) {
                        if (line.contains("pid=" + pid)) {
                            int port = parseListeningPort(line);
                            if (port > 0) {
                                p.destroyForcibly();
                                return port;
                            }
                        }
                    }
                }
                p.waitFor();
            } catch (Exception ignored) {}
        }
        return -1;
    }

    private int parseListeningPort(String line) {
        try {
            String[] parts = line.trim().split("\\s+");
            for (String part : parts) {
                if (part.contains(":")) {
                    String lastColon = part.substring(part.lastIndexOf(':') + 1);
                    int port = Integer.parseInt(lastColon, 16);
                    if (port > 0 && port < 65536) return port;
                }
            }
        } catch (Exception ignored) {}
        return -1;
    }

    private void addLog(String msg) {
        String ts = java.time.LocalTime.now().toString().substring(0, 8);
        recentLogs.addLast("[" + ts + "] " + msg);
        while (recentLogs.size() > MAX_LOGS) recentLogs.pollFirst();
    }
}
