package linkshort;

import java.io.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.*;
import java.time.Duration;
import java.util.logging.Logger;
import java.util.zip.ZipInputStream;

public class NodeInstaller {
    private final Logger log;
    private final File dataFolder;
    private String nodeBinary;
    private String npmBinary;

    public NodeInstaller(Logger log, File dataFolder) {
        this.log = log;
        this.dataFolder = dataFolder;
    }

    public String getNodeBinary() { return nodeBinary; }
    public String getNpmBinary() { return npmBinary; }

    public boolean ensureInstalled() {
        String os = System.getProperty("os.name", "").toLowerCase();
        String arch = System.getProperty("os.arch", "").toLowerCase();

        log.info("[node-install] OS: " + os + " | Arch: " + arch);

        if (isNodeInstalled()) {
            log.info("[node-install] Node.js already available at: " + nodeBinary);
            return true;
        }

        log.info("[node-install] Node.js not found, attempting install...");

        if (os.contains("linux")) {
            return installLinux(os, arch);
        } else if (os.contains("mac") || os.contains("darwin")) {
            return installMac(arch);
        } else if (os.contains("win")) {
            return installWindows(arch);
        } else {
            log.warning("[node-install] Unknown OS: " + os);
            return false;
        }
    }

    private boolean isNodeInstalled() {
        String os = System.getProperty("os.name", "").toLowerCase();
        String binName = os.contains("win") ? "node.exe" : "node";

        File nodeDir = new File(dataFolder, "node-install");

        File nodeFile = new File(nodeDir, "bin/" + binName);
        if (nodeFile.exists() && canExecute(nodeFile)) {
            nodeBinary = nodeFile.getAbsolutePath();
            File npmFile = new File(nodeDir, "bin/npm");
            if (canExecute(npmFile)) {
                npmBinary = npmFile.getAbsolutePath();
            } else {
                findNpm(nodeDir);
            }
            log.info("[node-install] Found node at: " + nodeBinary);
            return true;
        }

        File[] children = nodeDir.listFiles();
        if (children != null) {
            for (File c : children) {
                if (c.isDirectory() && c.getName().startsWith("node-")) {
                    File nFile = new File(c, "bin/" + binName);
                    if (nFile.exists() && canExecute(nFile)) {
                        nodeBinary = nFile.getAbsolutePath();
                        findNpm(c);
                        log.info("[node-install] Found node at: " + nodeBinary);
                        return true;
                    }
                }
            }
        }

        File localBin = new File(dataFolder, binName);
        if (localBin.exists() && canExecute(localBin)) {
            nodeBinary = localBin.getAbsolutePath();
            findNpm(dataFolder);
            log.info("[node-install] Found node at: " + nodeBinary);
            return true;
        }

        try {
            Process p = new ProcessBuilder(binName, "--version").redirectErrorStream(true).start();
            p.getInputStream().readAllBytes();
            if (p.waitFor() == 0) {
                nodeBinary = binName;
                npmBinary = "npm";
                return true;
            }
        } catch (Exception ignored) {}

        try {
            Process p = new ProcessBuilder("nodejs", "--version").redirectErrorStream(true).start();
            p.getInputStream().readAllBytes();
            if (p.waitFor() == 0) {
                nodeBinary = "nodejs";
                npmBinary = "npm";
                return true;
            }
        } catch (Exception ignored) {}

        return false;
    }

    private void findNpm(File baseDir) {
        File binNpm = new File(baseDir, "bin/npm");
        if (canExecute(binNpm)) {
            npmBinary = binNpm.getAbsolutePath();
            log.info("[node-install] npm found at: " + npmBinary);
            return;
        }

        File npxFile = new File(baseDir, "bin/npx");
        File libNpm = new File(baseDir, "lib/node_modules/npm/bin/npm-cli.js");

        if (libNpm.exists() && nodeBinary != null) {
            File wrapper = new File(baseDir, "bin/npm-wrapper");
            try {
                String content = "#!/bin/sh\nexec \"" + nodeBinary + "\" \"" + libNpm.getAbsolutePath() + "\" \"$@\"\n";
                Files.writeString(wrapper.toPath(), content);
                wrapper.setExecutable(true, false);
                npmBinary = wrapper.getAbsolutePath();
                log.info("[node-install] Created npm wrapper at: " + npmBinary);
                return;
            } catch (Exception e) {
                log.warning("[node-install] Failed to create npm wrapper: " + e.getMessage());
            }
        }

        npmBinary = "npm";
        log.info("[node-install] Using system npm fallback: " + npmBinary);
    }

    private boolean canExecute(File f) {
        if (!f.exists()) return false;
        try {
            Path link = f.toPath();
            if (Files.isSymbolicLink(link)) {
                Path target = Files.readSymbolicLink(link);
                if (!target.isAbsolute()) {
                    target = f.toPath().getParent().resolve(target).normalize();
                }
                return Files.exists(target) && Files.isExecutable(target);
            }
            return f.canExecute();
        } catch (Exception e) {
            return false;
        }
    }

    private boolean installLinux(String os, String arch) {
        String distro = detectDistro();

        if (distro.equals("termux")) {
            return runCommand("pkg", "install", "-y", "nodejs");
        }

        if (distro.equals("ubuntu") || distro.equals("debian") || distro.equals("kali") || distro.equals("linuxmint")) {
            if (runCommand("apt-get", "update", "-qq")) {
                return runCommand("apt-get", "install", "-y", "nodejs", "npm");
            }
        }

        if (distro.equals("fedora")) {
            return runCommand("dnf", "install", "-y", "nodejs", "npm");
        }

        if (distro.equals("centos") || distro.equals("rhel") || distro.equals("rocky") || distro.equals("alma")) {
            return runCommand("yum", "install", "-y", "nodejs", "npm");
        }

        if (distro.equals("arch") || distro.equals("manjaro")) {
            return runCommand("pacman", "-Sy", "--noconfirm", "nodejs", "npm");
        }

        if (distro.equals("alpine")) {
            return runCommand("apk", "add", "nodejs", "npm");
        }

        if (distro.equals("opensuse") || distro.equals("suse")) {
            return runCommand("zypper", "install", "-y", "nodejs", "npm");
        }

        log.info("[node-install] Unknown distro, downloading prebuilt binary...");
        String nodeArch = mapArch(arch);
        String nodeId = "linux-" + nodeArch;
        boolean ok = downloadPrebuilt(nodeId, "linux", nodeArch);
        return ok;
    }

    private boolean installMac(String arch) {
        if (runCommand("brew", "--version")) {
            return runCommand("brew", "install", "node");
        }

        String nodeArch = arch.contains("aarch64") || arch.contains("arm") ? "arm64" : "x64";
        return downloadPrebuilt("darwin-" + nodeArch, "darwin", nodeArch);
    }

    private boolean installWindows(String arch) {
        String nodeArch = arch.contains("amd64") || arch.contains("x86_64") ? "x64" : arch.contains("aarch64") ? "arm64" : "x86";
        return downloadPrebuilt("win-" + nodeArch + "-zip", "win32", nodeArch);
    }

    private boolean downloadPrebuilt(String nodeId, String osName, String archName) {
        String version = "v22.16.0";
        String ext = osName.equals("win32") ? "zip" : "tar.gz";
        String fileName = "node-" + version + "-" + nodeId + "." + ext;
        String url = "https://nodejs.org/dist/" + version + "/" + fileName;

        try {
            File installDir = new File(dataFolder, "node-install");
            installDir.mkdirs();

            File downloaded = new File(installDir, fileName);
            log.info("[node-install] Downloading " + url);

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
                log.warning("[node-install] Download failed: HTTP " + response.statusCode());
                return false;
            }

            try (InputStream in = response.body()) {
                Files.copy(in, downloaded.toPath(), StandardCopyOption.REPLACE_EXISTING);
            }
            log.info("[node-install] Downloaded " + (downloaded.length() / 1024 / 1024) + " MB");

            if (ext.equals("zip")) {
                extractZip(downloaded, installDir);
            } else {
                extractTarGz(downloaded, installDir);
            }

            File binDir = new File(installDir, "node-" + version + "-" + nodeId);
            if (!binDir.exists()) {
                File[] children = installDir.listFiles();
                if (children != null) {
                    for (File c : children) {
                        if (c.isDirectory() && c.getName().startsWith("node-")) {
                            binDir = c;
                            break;
                        }
                    }
                }
            }

            String binName = osName.equals("win32") ? "node.exe" : "node";
            File nodeFile = new File(binDir, binName);
            if (osName.equals("linux") || osName.equals("darwin")) {
                nodeFile = new File(binDir, "bin/" + binName);
            }

            if (nodeFile.exists()) {
                if (!osName.equals("win32")) {
                    nodeFile.setExecutable(true, false);
                    File npxFile = new File(nodeFile.getParentFile(), "npx");
                    if (npxFile.exists()) npxFile.setExecutable(true, false);
                }
                nodeBinary = nodeFile.getAbsolutePath();
                log.info("[node-install] Installed: " + nodeBinary);

                findNpm(binDir);
                return true;
            }

            log.warning("[node-install] node binary not found after extraction");
            return false;

        } catch (Exception e) {
            log.warning("[node-install] Install failed: " + e.getMessage());
            return false;
        }
    }

    private String detectDistro() {
        String os = System.getProperty("os.name", "").toLowerCase();
        if (os.contains("termux") || System.getenv("TERMUX_VERSION") != null) return "termux";

        try {
            File osRelease = new File("/etc/os-release");
            if (osRelease.exists()) {
                String content = Files.readString(osRelease.toPath()).toLowerCase();
                if (content.contains("ubuntu")) return "ubuntu";
                if (content.contains("debian")) return "debian";
                if (content.contains("kali")) return "kali";
                if (content.contains("linuxmint")) return "linuxmint";
                if (content.contains("fedora")) return "fedora";
                if (content.contains("centos")) return "centos";
                if (content.contains("rhel") || content.contains("red hat")) return "rhel";
                if (content.contains("rocky")) return "rocky";
                if (content.contains("alma")) return "alma";
                if (content.contains("arch")) return "arch";
                if (content.contains("manjaro")) return "manjaro";
                if (content.contains("alpine")) return "alpine";
                if (content.contains("opensuse") || content.contains("suse")) return "opensuse";
            }
        } catch (Exception ignored) {}

        try {
            Process p = new ProcessBuilder("cat", "/etc/*release").redirectErrorStream(true).start();
            String out = new String(p.getInputStream().readAllBytes()).toLowerCase();
            if (out.contains("termux")) return "termux";
        } catch (Exception ignored) {}

        return "unknown";
    }

    private String mapArch(String arch) {
        if (arch.contains("aarch64") || arch.contains("arm64")) return "arm64";
        if (arch.contains("arm")) return "armv7l";
        if (arch.contains("x86_64") || arch.contains("amd64")) return "x64";
        if (arch.contains("x86") || arch.contains("i386") || arch.contains("i686")) return "x86";
        if (arch.contains("ppc64")) return "ppc64le";
        if (arch.contains("s390")) return "s390x";
        return "x64";
    }

    private boolean runCommand(String... cmd) {
        try {
            log.info("[node-install] Running: " + String.join(" ", cmd));
            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);
            Process p = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.fine("[node-install] " + line);
                }
            }

            int exit = p.waitFor();
            if (exit == 0) {
                log.info("[node-install] Command succeeded");
                return true;
            } else {
                log.warning("[node-install] Command exited " + exit);
                return false;
            }
        } catch (Exception e) {
            log.warning("[node-install] Command failed: " + e.getMessage());
            return false;
        }
    }

    private void extractTarGz(File archive, File targetDir) throws IOException {
        ProcessBuilder pb = new ProcessBuilder("tar", "xzf", archive.getAbsolutePath(), "-C", targetDir.getAbsolutePath());
        pb.redirectErrorStream(true);
        Process p = pb.start();
        try {
            p.getInputStream().readAllBytes();
            p.waitFor();
        } catch (Exception ignored) {}
    }

    private void extractZip(File archive, File targetDir) throws IOException {
        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(archive))) {
            java.util.zip.ZipEntry entry;
            byte[] buffer = new byte[8192];
            String canonicalTarget = targetDir.getCanonicalPath() + File.separator;
            while ((entry = zis.getNextEntry()) != null) {
                File out = new File(targetDir, entry.getName());
                if (!out.getCanonicalPath().startsWith(canonicalTarget) && !out.getCanonicalPath().equals(targetDir.getCanonicalPath())) {
                    throw new IOException("Blocked zip-slip entry: " + entry.getName());
                }
                if (entry.isDirectory()) {
                    out.mkdirs();
                } else {
                    out.getParentFile().mkdirs();
                    try (FileOutputStream fos = new FileOutputStream(out)) {
                        int len;
                        while ((len = zis.read(buffer)) > 0) fos.write(buffer, 0, len);
                    }
                }
            }
        }
    }
}
