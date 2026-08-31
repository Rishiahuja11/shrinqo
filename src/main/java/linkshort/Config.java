package linkshort;

import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.configuration.file.FileConfiguration;

import java.util.*;

public class Config {
    public String tunnelToken;
    public boolean opsEnabled = true;
    public String opsKey = "";
    public boolean botEnabled;
    public int botMax = 2;
    public List<String> botNames = new ArrayList<>();
    public List<ProjectConfig> projects = new ArrayList<>();

    public Config(FileConfiguration cfg) {
        tunnelToken = cfg.getString("tunnel.token", "");

        opsEnabled = cfg.getBoolean("ops.enabled", true);
        opsKey = cfg.getString("ops.key", "");
        if (opsKey == null) opsKey = "";

        botEnabled = cfg.getBoolean("bot.enabled", true);
        botMax = Math.max(0, cfg.getInt("bot.max", 2));
        ConfigurationSection botSection = cfg.getConfigurationSection("bot");
        if (botSection != null) {
            List<String> names = botSection.getStringList("names");
            if (names != null && !names.isEmpty()) {
                botNames.addAll(names);
            } else {
                String singleName = botSection.getString("name", "Steve_42");
                botNames.add(singleName);
            }
        }
        if (botNames.isEmpty()) botNames.add("Steve_42");

        ConfigurationSection projectsSection = cfg.getConfigurationSection("projects");
        if (projectsSection != null) {
            for (String name : projectsSection.getKeys(false)) {
                ConfigurationSection ps = projectsSection.getConfigurationSection(name);
                if (ps == null) continue;
                String folder = ps.getString("folder", "app");
                String command = ps.getString("command", "");
                String token = ps.getString("token", "");
                String namedUrl = ps.getString("named-url", "");
                int port = ps.getInt("port", 0);
                projects.add(new ProjectConfig(name, folder, command, token, namedUrl, port));
            }
        }

        if (projects.isEmpty()) {
            String appCmd = cfg.getString("app.command", "");
            String appFolder = cfg.getString("app.folder", "app");
            if (!appCmd.isEmpty() || !appFolder.equals("app")) {
                projects.add(new ProjectConfig("default", appFolder, appCmd, "", "", 0));
            }
        }

        // Self-heal: stale config without any project — run the bundled webapp
        if (projects.isEmpty()) {
            String url = cfg.getString("app.named-url", "https://short.smp45.qzz.io");
            projects.add(new ProjectConfig("linkshort", "linkshort-app", "node server.js", "", url, 10000));
        }
    }

    public ProjectConfig getProject(String name) {
        for (ProjectConfig p : projects) {
            if (p.name.equalsIgnoreCase(name)) return p;
        }
        return null;
    }

    public String resolveToken(ProjectConfig pc) {
        if (pc.token != null && !pc.token.isEmpty()) return pc.token;
        return tunnelToken;
    }

    public List<ProjectConfig> getAllProjects() {
        return Collections.unmodifiableList(projects);
    }

    public static class ProjectConfig {
        public final String name;
        public final String folder;
        public final String command;
        public final String token;
        public final String namedUrl;
        public final int port;

        public ProjectConfig(String name, String folder, String command, String token, String namedUrl, int port) {
            this.name = name;
            this.folder = folder;
            this.command = command;
            this.token = token;
            this.namedUrl = namedUrl;
            this.port = port;
        }
    }
}
