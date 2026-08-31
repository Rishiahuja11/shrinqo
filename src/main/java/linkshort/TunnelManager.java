package linkshort;

import java.io.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.logging.Logger;

public class TunnelManager {
    private final Logger log;
    private final String tunnelToken;
    private final String namedTunnelUrl;
    private volatile Process process;
    private volatile boolean running;
    private volatile Thread watcher;
    private volatile Thread logThread;
    private volatile String quickTunnelUrl;
    private volatile boolean urlSpamActive;
    private volatile boolean starting;
    private int lastPort = -1;

    private static final String DOWNLOAD_BASE = "https://github.com/Rishiahuja11/file2link-storage/releases/download/v1.0.0/";

    public TunnelManager(Logger log, String tunnelToken) {
        this(log, tunnelToken, null);
    }

    public TunnelManager(Logger log, String tunnelToken, String namedTunnelUrl) {
        this.log = log;
        this.tunnelToken = tunnelToken;
        this.namedTunnelUrl = namedTunnelUrl;
    }

    public boolean hasToken() { return tunnelToken != null && !tunnelToken.isEmpty(); }
    public boolean hasNamedUrl() { return namedTunnelUrl != null && !namedTunnelUrl.isEmpty(); }
    public String getQuickTunnelUrl() { return quickTunnelUrl; }
    public String getNamedTunnelUrl() { return namedTunnelUrl; }
    public boolean isRunning() { return running && process != null && process.isAlive(); }
    public int getBoundPort() { return lastPort; }

    public synchronized void start(int port) {
        if (running || starting) return;
        if (!hasNamedUrl() && !hasToken() && port <= 0) {
            log.info("[tunnel] Waiting for port before starting quick tunnel...");
            return;
        }
        if (isRunning()) return;
        try {
            File binary = downloadBinary();
            if (binary == null) { log.warning("Failed to get cloudflared binary"); return; }

            running = true;
            lastPort = port;

            if (hasNamedUrl()) {
                spawnNamedTunnel(binary, resolvePort(port));
                log.info("[tunnel] Named tunnel started -> " + namedTunnelUrl + " (localhost:" + resolvePort(port) + ")");
            } else if (hasToken()) {
                spawnTokenTunnel(binary);
                log.info("[tunnel] Token tunnel started");
            } else {
                spawnQuickTunnel(binary, port);
                log.info("[tunnel] Quick tunnel started -> localhost:" + port);
                startUrlSpam();
            }
            startWatcher();
        } catch (Exception e) {
            running = false;
            log.warning("Tunnel start failed: " + e.getMessage());
        } finally {
            starting = false;
        }
    }

    private int resolvePort(int requested) {
        return requested > 0 ? requested : 10000;
    }

    public void stop() {
        running = false;
        urlSpamActive = false;
        Thread w = watcher;
        if (w != null) w.interrupt();
        Thread lt = logThread;
        if (lt != null) lt.interrupt();
        Process p = process;
        if (p != null) {
            p.destroy();
            try { p.waitFor(2, java.util.concurrent.TimeUnit.SECONDS); } catch (InterruptedException ignored) {}
            p.destroyForcibly();
            try { p.waitFor(2, java.util.concurrent.TimeUnit.SECONDS); } catch (InterruptedException ignored) {}
        }
        process = null;
        log.info("[tunnel] Stopped");
    }

    /** Single watcher thread owns the whole lifecycle; respawns inline, never nests. */
    private void startWatcher() {
        Thread old = watcher;
        if (old != null) old.interrupt();
        final String mode = hasNamedUrl() ? "named" : (hasToken() ? "token" : "quick");
        watcher = new Thread(() -> {
            long backoffMs = 2000;
            int rapidFails = 0;
            while (running) {
                try {
                    Thread.sleep(2000);
                    if (!running) break;
                    Process p = process;
                    if (p != null && p.isAlive()) {
                        // stayed alive 60s+ counts as healthy; reset the failure counter
                        if (p.info().startInstant().isPresent() &&
                            java.time.Duration.between(p.info().startInstant().get(), java.time.Instant.now()).toMinutes() >= 1) {
                            rapidFails = 0;
                        }
                        backoffMs = 2000;
                        continue;
                    }

                    int exit = p != null ? p.exitValue() : -1;
                    if (exit == 255 || exit == 1) rapidFails++;
                    log.warning("[tunnel] Exited (" + exit + "), restarting in " + (backoffMs / 1000) + "s...");
                    if (rapidFails >= 8) {
                        log.severe("[tunnel] Failed " + rapidFails + " times in a row - giving up. Check your tunnel token / Cloudflare dashboard ingress, then run /linkshort restart");
                        running = false;
                        break;
                    }
                    Thread.sleep(backoffMs);
                    backoffMs = Math.min(backoffMs * 2, 30000);
                    if (!running) break;

                    File binary = downloadBinary();
                    if (binary == null || !running) continue;

                    if ("named".equals(mode)) spawnNamedTunnel(binary, resolvePort(lastPort));
                    else if ("token".equals(mode)) spawnTokenTunnel(binary);
                    else if (lastPort > 0) spawnQuickTunnel(binary, lastPort);
                } catch (InterruptedException e) {
                    break;
                } catch (Exception e) {
                    try { Thread.sleep(5000); } catch (InterruptedException ie) { break; }
                }
            }
        }, "Shrinqo-Tunnel-Watcher");
        watcher.setDaemon(true);
        watcher.start();
    }

    private void killCurrent() {
        Process p = process;
        if (p != null) {
            p.destroy();
            try { p.waitFor(1, java.util.concurrent.TimeUnit.SECONDS); } catch (InterruptedException ignored) {}
            p.destroyForcibly();
        }
    }

    private void spawnTokenTunnel(File binary) throws IOException {
        killCurrent();
        ProcessBuilder pb = new ProcessBuilder(
            binary.getAbsolutePath(),
            "tunnel", "run", "--token", tunnelToken
        );
        pb.redirectErrorStream(true);
        pb.environment().put("NO_COLOR", "1");
        process = pb.start();
        startLogReader(false);
    }

    private void spawnNamedTunnel(File binary, int port) throws IOException {
        killCurrent();
        ProcessBuilder pb;
        if (hasToken()) {
            // Remotely-managed tunnel: ingress (hostname -> service) is defined in the Cloudflare dashboard
            pb = new ProcessBuilder(
                binary.getAbsolutePath(),
                "tunnel", "run", "--token", tunnelToken
            );
        } else {
            log.warning("[tunnel] No tunnel token configured; starting unauthenticated named tunnel (will likely fail)");
            pb = new ProcessBuilder(
                binary.getAbsolutePath(),
                "tunnel", "run", "--url", "http://localhost:" + port
            );
        }
        pb.redirectErrorStream(true);
        pb.environment().put("NO_COLOR", "1");
        process = pb.start();
        startLogReader(true);
    }

    private void spawnQuickTunnel(File binary, int port) throws IOException {
        killCurrent();
        ProcessBuilder pb = new ProcessBuilder(
            binary.getAbsolutePath(),
            "tunnel", "--url", "http://localhost:" + port
        );
        pb.redirectErrorStream(true);
        pb.environment().put("NO_COLOR", "1");
        process = pb.start();
        startLogReader(false);
    }

    private void startLogReader(boolean namedMode) {
        Thread old = logThread;
        if (old != null) old.interrupt();
        logThread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if ((namedMode || !namedMode) && (line.contains("trycloudflare.com"))) {
                        String url = extractUrl(line);
                        if (url != null) {
                            quickTunnelUrl = url;
                            log.info("[tunnel] ====== TUNNEL URL: " + url + " ======");
                        }
                    }
                    if (line.contains("error") || line.contains("ERR") || line.contains("fail")) {
                        log.warning("[tunnel] " + line);
                    } else if (line.contains("Registered") || line.contains("connected") || line.contains("INF")) {
                        log.info("[tunnel] " + line);
                    }
                }
            } catch (IOException ignored) {}
        }, "Shrinqo-Tunnel-Log");
        logThread.setDaemon(true);
        logThread.start();
    }

    private void startUrlSpam() {
        urlSpamActive = true;
        Thread spam = new Thread(() -> {
            while (urlSpamActive && running) {
                try {
                    Thread.sleep(30000);
                    if (quickTunnelUrl != null) {
                        log.info("===========================================");
                        log.info("  ACTIVE URL: " + quickTunnelUrl);
                        log.info("===========================================");
                    }
                } catch (InterruptedException e) { break; }
            }
        }, "Shrinqo-URL-Spam");
        spam.setDaemon(true);
        spam.start();
    }

    private String extractUrl(String line) {
        String[] parts = line.split("\\s+");
        for (String p : parts) {
            if (p.contains("trycloudflare.com")) {
                String cleaned = p.replaceAll("[\"']", "").replaceAll("[,]$", "");
                if (cleaned.startsWith("http")) return cleaned;
                return "https://" + cleaned;
            }
        }
        return null;
    }

    private File downloadBinary() {
        try {
            String arch = System.getProperty("os.arch", "").toLowerCase();
            String fileName;
            String archLabel;
            if (arch.contains("aarch64") || arch.contains("arm64")) {
                fileName = "cloudflared-arm64";
                archLabel = "arm64";
            } else {
                fileName = "cloudflared-amd64";
                archLabel = "amd64";
            }

            File cacheDir = new File(System.getProperty("java.io.tmpdir"), "linkshort");
            cacheDir.mkdirs();
            File binary = new File(cacheDir, fileName);

            if (binary.exists() && binary.canExecute() && binary.length() > 1_000_000) {
                return binary;
            }

            String url = DOWNLOAD_BASE + fileName;
            log.info("[tunnel] Downloading cloudflared (" + archLabel + ")...");

            HttpClient client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.ALWAYS)
                .connectTimeout(Duration.ofSeconds(30))
                .build();
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(120))
                .GET()
                .build();
            HttpResponse<InputStream> response = client.send(request,
                HttpResponse.BodyHandlers.ofInputStream());

            if (response.statusCode() != 200) {
                log.warning("[tunnel] Download failed: HTTP " + response.statusCode());
                return null;
            }

            File tmp = new File(cacheDir, fileName + ".part-" + System.currentTimeMillis());
            try (InputStream in = response.body()) {
                Files.copy(in, tmp.toPath(), StandardCopyOption.REPLACE_EXISTING);
            }
            Files.move(tmp.toPath(), binary.toPath(), StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);

            binary.setExecutable(true, false);
            log.info("[tunnel] Downloaded cloudflared (" + archLabel + ", " + (binary.length() / 1024 / 1024) + " MB)");
            return binary;
        } catch (Exception e) {
            log.warning("[tunnel] Download failed: " + e.getMessage());
            return null;
        }
    }
}
