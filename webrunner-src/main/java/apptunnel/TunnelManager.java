package apptunnel;

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
    private Process process;
    private volatile boolean running;
    private Thread watcher;
    private Thread logThread;
    private String quickTunnelUrl;
    private volatile boolean urlSpamActive;

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

    public void start(int port) {
        if (port <= 0 && !hasToken() && !hasNamedUrl()) {
            log.info("[tunnel] Waiting for port before starting quick tunnel...");
            return;
        }
        try {
            File binary = downloadBinary();
            if (binary == null) { log.warning("Failed to get cloudflared binary"); return; }

            running = true;

            if (hasNamedUrl()) {
                startNamedTunnel(binary);
                log.info("[tunnel] Named tunnel started -> " + namedTunnelUrl);
            } else if (hasToken()) {
                startTokenTunnel(binary);
                log.info("[tunnel] Token tunnel started");
            } else {
                startQuickTunnel(binary, port);
                log.info("[tunnel] Quick tunnel started -> localhost:" + port);
                startUrlSpam();
            }
        } catch (Exception e) {
            log.warning("Tunnel start failed: " + e.getMessage());
        }
    }

    public void stop() {
        running = false;
        urlSpamActive = false;
        if (watcher != null) watcher.interrupt();
        if (logThread != null) logThread.interrupt();
        if (process != null) {
            process.destroyForcibly();
            try { process.waitFor(3, java.util.concurrent.TimeUnit.SECONDS); } catch (InterruptedException ignored) {}
        }
        process = null;
        log.info("[tunnel] Stopped");
    }

    private void startTokenTunnel(File binary) throws IOException {
        ProcessBuilder pb = new ProcessBuilder(
            binary.getAbsolutePath(),
            "tunnel", "run", "--token", tunnelToken
        );
        pb.redirectErrorStream(true);
        pb.environment().put("NO_COLOR", "1");
        process = pb.start();
        startLogReader();
        startWatcher(-1);
    }

    private void startNamedTunnel(File binary) throws IOException {
        ProcessBuilder pb = new ProcessBuilder(
            binary.getAbsolutePath(),
            "tunnel", "run", "--url", "http://localhost:0"
        );
        pb.redirectErrorStream(true);
        pb.environment().put("NO_COLOR", "1");
        process = pb.start();

        logThread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.contains("trycloudflare.com") || line.contains("argotunnel.com")) {
                        String url = extractUrl(line);
                        if (url != null) {
                            quickTunnelUrl = url;
                            log.info("[tunnel] ====== NAMED URL: " + url + " ======");
                        }
                    }
                    if (line.contains("error") || line.contains("ERR")) {
                        log.warning("[tunnel] " + line);
                    } else if (line.contains("Registered") || line.contains("connected") || line.contains("INF")) {
                        log.info("[tunnel] " + line);
                    }
                }
            } catch (IOException ignored) {}
        }, "WebRunner-Tunnel-Log");
        logThread.setDaemon(true);
        logThread.start();

        startWatcher(-1);
    }

    private void startQuickTunnel(File binary, int port) throws IOException {
        ProcessBuilder pb = new ProcessBuilder(
            binary.getAbsolutePath(),
            "tunnel", "--url", "http://localhost:" + port
        );
        pb.redirectErrorStream(true);
        pb.environment().put("NO_COLOR", "1");
        process = pb.start();

        logThread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.contains("trycloudflare.com")) {
                        String url = extractUrl(line);
                        if (url != null) {
                            quickTunnelUrl = url;
                            log.info("[tunnel] ====== YOUR URL: " + url + " ======");
                        }
                    }
                    if (line.contains("error") || line.contains("ERR")) {
                        log.warning("[tunnel] " + line);
                    }
                }
            } catch (IOException ignored) {}
        }, "WebRunner-Tunnel-Log");
        logThread.setDaemon(true);
        logThread.start();

        startWatcher(port);
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
        }, "WebRunner-URL-Spam");
        spam.setDaemon(true);
        spam.start();
    }

    private void startLogReader() {
        logThread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.contains("error") || line.contains("fail") || line.contains("ERR")) {
                        log.warning("[tunnel] " + line);
                    } else if (line.contains("Registered") || line.contains("connected") || line.contains("INF")) {
                        log.info("[tunnel] " + line);
                    }
                }
            } catch (IOException ignored) {}
        }, "WebRunner-Tunnel-Log");
        logThread.setDaemon(true);
        logThread.start();
    }

    private void startWatcher(int port) {
        watcher = new Thread(() -> {
            int backoff = 2000;
            while (running) {
                try {
                    if (process != null && !process.isAlive()) {
                        int exit = process.exitValue();
                        if (running) {
                            log.warning("[tunnel] Exited (" + exit + "), restarting in " + (backoff / 1000) + "s...");
                            Thread.sleep(backoff);
                            backoff = Math.min(backoff * 2, 30000);
                            File binary = downloadBinary();
                            if (binary != null && running) {
                                if (hasNamedUrl()) startNamedTunnel(binary);
                                else if (hasToken()) startTokenTunnel(binary);
                                else if (port > 0) startQuickTunnel(binary, port);
                            }
                        }
                    } else {
                        backoff = 2000;
                        Thread.sleep(2000);
                    }
                } catch (InterruptedException e) { break; }
                catch (Exception e) {
                    try { Thread.sleep(5000); } catch (InterruptedException ie) { break; }
                }
            }
        }, "WebRunner-Tunnel-Watcher");
        watcher.setDaemon(true);
        watcher.start();
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
            } else if (arch.contains("amd64") || arch.contains("x86_64")) {
                fileName = "cloudflared-amd64";
                archLabel = "amd64";
            } else {
                fileName = "cloudflared-amd64";
                archLabel = "amd64";
            }

            File cacheDir = new File(System.getProperty("java.io.tmpdir"), "webrunner");
            cacheDir.mkdirs();
            File binary = new File(cacheDir, fileName);

            if (binary.exists() && binary.canExecute() && binary.length() > 1_000_000) {
                log.info("[tunnel] Using cached cloudflared (" + archLabel + ")");
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

            try (InputStream in = response.body()) {
                Files.copy(in, binary.toPath(), StandardCopyOption.REPLACE_EXISTING);
            }

            binary.setExecutable(true, false);
            log.info("[tunnel] Downloaded cloudflared (" + archLabel + ", " + (binary.length() / 1024 / 1024) + " MB)");
            return binary;
        } catch (Exception e) {
            log.warning("[tunnel] Download failed: " + e.getMessage());
            return null;
        }
    }
}
