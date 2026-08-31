package linkshort;

import org.bukkit.plugin.java.JavaPlugin;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.util.logging.Logger;

public class WebAppDeployer {
    private static final String PREFIX = "webapp/";

    private final JavaPlugin plugin;
    private final Logger log;

    public WebAppDeployer(JavaPlugin plugin) {
        this.plugin = plugin;
        this.log = plugin.getLogger();
    }

    /**
     * Extracts every bundled webapp resource from the JAR into targetDir,
     * overwriting files whose content differs from the JAR version.
     * Returns true if all required files are present afterwards.
     */
    public boolean deploy(File targetDir) {
        List<String> resources = listWebappResources();
        if (resources.isEmpty()) {
            log.warning("[webapp] Could not enumerate bundled resources; falling back");
            resources.add("server.js");
        }
        boolean ok = true;
        for (String res : resources) {
            File out = new File(targetDir, res);
            try {
                byte[] jarBytes = readResource(res);
                if (jarBytes == null) {
                    log.warning("[webapp] Missing bundled resource: " + PREFIX + res);
                    ok = false;
                    continue;
                }
                if (!out.exists()) {
                    out.getParentFile().mkdirs();
                    Files.write(out.toPath(), jarBytes);
                    log.info("[webapp] Extracted: " + res);
                } else if (!MessageDigest.isEqual(
                        MessageDigest.getInstance("SHA-256").digest(jarBytes),
                        MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(out.toPath())))) {
                    Files.write(out.toPath(), jarBytes);
                    log.info("[webapp] Updated: " + res + " (" + jarBytes.length + " bytes)");
                }
            } catch (Exception e) {
                log.warning("[webapp] Failed to deploy " + res + ": " + e.getMessage());
                ok = false;
            }
        }
        return ok && new File(targetDir, "server.js").exists();
    }

    /** Enumerates all files under webapp/ inside the plugin JAR. */
    private List<String> listWebappResources() {
        List<String> names = new ArrayList<>();
        try {
            URI uri = plugin.getClass().getProtectionDomain().getCodeSource().getLocation().toURI();
            try (JarFile jar = new JarFile(new File(uri))) {
                var entries = jar.entries();
                while (entries.hasMoreElements()) {
                    JarEntry e = entries.nextElement();
                    if (e.isDirectory()) continue;
                    String n = e.getName();
                    if (n.startsWith(PREFIX) && n.length() > PREFIX.length()) {
                        names.add(n.substring(PREFIX.length()));
                    }
                }
            }
        } catch (Exception e) {
            log.warning("[webapp] Resource enumeration failed: " + e.getMessage());
        }
        return names;
    }

    private byte[] readResource(String path) throws Exception {
        try (InputStream in = plugin.getResource(PREFIX + path)) {
            if (in == null) return null;
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            byte[] chunk = new byte[8192];
            int n;
            while ((n = in.read(chunk)) > 0) buf.write(chunk, 0, n);
            return buf.toByteArray();
        }
    }
}
