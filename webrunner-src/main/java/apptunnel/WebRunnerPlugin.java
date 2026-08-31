package apptunnel;

import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class WebRunnerPlugin extends JavaPlugin {
    private Config config;
    private NodeInstaller nodeInstaller;
    private final List<BotManager> bots = new ArrayList<>();
    private final Map<String, ProjectInstance> instances = new ConcurrentHashMap<>();
    private Thread startupThread;

    public static class ProjectInstance {
        public final Config.ProjectConfig config;
        public NodeManager nodeManager;
        public TunnelManager tunnelManager;
        public volatile boolean running;

        public ProjectInstance(Config.ProjectConfig config) {
            this.config = config;
        }
    }

    @Override
    public void onEnable() {
        saveDefaultConfig();
        config = new Config(getConfig());
        nodeInstaller = new NodeInstaller(getLogger(), getDataFolder());

        getCommand("webrunner").setExecutor(this::handleCommand);
        getLogger().info("WebRunner enabled! " + config.projects.size() + " project(s)");

        startupThread = new Thread(() -> {
            try { Thread.sleep(300); } catch (InterruptedException e) { return; }
            startAll();
        }, "WebRunner-Startup");
        startupThread.setDaemon(true);
        startupThread.start();
    }

    @Override
    public void onDisable() {
        if (startupThread != null) { startupThread.interrupt(); startupThread = null; }
        for (ProjectInstance inst : instances.values()) stopInstance(inst);
        instances.clear();
        for (BotManager b : bots) {
            try { b.despawn(); } catch (Exception ignored) {}
        }
        bots.clear();
        getLogger().info("WebRunner disabled!");
    }

    private void startAll() {
        if (!nodeInstaller.ensureInstalled()) {
            getLogger().severe("Node.js not installed!");
            return;
        }
        String nodeBin = nodeInstaller.getNodeBinary();
        getLogger().info("[startup] Node.js: " + nodeBin);

        for (Config.ProjectConfig pc : config.projects) {
            File pkg = new File(getDataFolder(), pc.folder + "/package.json");
            if (pkg.exists()) runNpmInstall(nodeBin, pc);
        }

        for (Config.ProjectConfig pc : config.projects) startInstance(pc);

        if (config.botEnabled) {
            Bukkit.getScheduler().runTaskLater(this, () -> {
                for (String name : config.botNames) {
                    try {
                        BotManager bm = new BotManager(this, name);
                        if (bm.spawn()) {
                            bots.add(bm);
                            getLogger().info("Bot: " + name);
                        }
                    } catch (Exception e) {
                        getLogger().warning("Bot " + name + " failed: " + e.getMessage());
                    }
                }
                getLogger().info("Bots online: " + bots.size() + "/" + config.botNames.size());
                Bukkit.getScheduler().runTaskLater(this, this::printStatus, 60L);
            }, 40L);
        } else {
            Bukkit.getScheduler().runTaskLater(this, this::printStatus, 60L);
        }
    }

    private void startInstance(Config.ProjectConfig pc) {
        ProjectInstance old = instances.get(pc.name.toLowerCase());
        if (old != null) stopInstance(old);

        File dataDir = new File(getDataFolder(), pc.folder);
        if (!dataDir.exists()) dataDir.mkdirs();

        String nodeBin = nodeInstaller.getNodeBinary();
        String command = buildNodeCommand(nodeBin, pc);
        String token = config.resolveToken(pc);

        ProjectInstance inst = new ProjectInstance(pc);
        inst.running = true;
        inst.nodeManager = new NodeManager(getLogger(), command, dataDir.getAbsolutePath());
        String namedUrl = pc.namedUrl != null ? pc.namedUrl : "";
        inst.tunnelManager = new TunnelManager(getLogger(), token, namedUrl);

        NodeManager nm = inst.nodeManager;
        TunnelManager tm = inst.tunnelManager;

        nm.setOnPortDetected(() -> {
            int port = nm.getDetectedPort();
            if (port > 0 && tm != null && !tm.isRunning()) {
                getLogger().info("[project:" + pc.name + "] Port " + port + ", tunnel...");
                tm.start(port);
            }
        });

        if (pc.port > 0 && token != null && !token.isEmpty()) tm.start(pc.port);

        nm.start();
        instances.put(pc.name.toLowerCase(), inst);
        getLogger().info("[project:" + pc.name + "] " + command);
    }

    private void stopInstance(ProjectInstance inst) {
        if (inst == null) return;
        inst.running = false;
        if (inst.nodeManager != null) inst.nodeManager.stop();
        if (inst.tunnelManager != null) inst.tunnelManager.stop();
    }

    private void runNpmInstall(String nodeBin, Config.ProjectConfig pc) {
        File pkg = new File(getDataFolder(), pc.folder + "/package.json");
        if (!pkg.exists()) return;
        File nm = new File(pkg.getParentFile(), "node_modules");
        if (nm.exists() && nm.isDirectory()) {
            File[] c = nm.listFiles();
            if (c != null && c.length > 0) { getLogger().info("[npm:" + pc.name + "] exists, skip"); return; }
        }
        String npmCmd = nodeInstaller.getNpmBinary();
        String nodeDir = new File(nodeBin).getParent();
        String wrapped = "export PATH=\"" + nodeDir + ":$PATH\"; " + npmCmd + " install --production";
        try {
            ProcessBuilder pb = new ProcessBuilder("sh", "-c", wrapped);
            pb.directory(pkg.getParentFile());
            pb.redirectErrorStream(true);
            Process p = pb.start();
            try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                String line;
                while ((line = r.readLine()) != null) {
                    if (line.contains("added") || line.contains("up to date") || line.contains("audited"))
                        getLogger().info("[npm:" + pc.name + "] " + line);
                }
            }
            p.waitFor();
        } catch (Exception e) { getLogger().warning("[npm:" + pc.name + "] " + e.getMessage()); }
    }

    private String buildNodeCommand(String nodeBin, Config.ProjectConfig pc) {
        String cmd = pc.command.trim();
        String npmBin = nodeInstaller.getNpmBinary();
        if (cmd.isEmpty()) return nodeBin + " index.js";
        if (cmd.startsWith("node ") || cmd.startsWith("nodejs "))
            return nodeBin + " " + cmd.substring(cmd.indexOf(' ') + 1);
        if (cmd.startsWith("npm ") || cmd.startsWith("npx ")) {
            String sub = cmd.substring(cmd.indexOf(' ') + 1);
            if (npmBin != null && new File(npmBin).exists()) return npmBin + " " + sub;
            return "sh -c 'npm " + sub + "'";
        }
        if (cmd.contains("npm ") || cmd.contains("npx ")) return "sh -c '" + cmd + "'";
        return nodeBin + " " + cmd;
    }

    private void printStatus() {
        getLogger().info("========== WebRunner ==========");
        for (Map.Entry<String, ProjectInstance> e : instances.entrySet()) {
            ProjectInstance inst = e.getValue();
            NodeManager n = inst.nodeManager;
            TunnelManager t = inst.tunnelManager;
            getLogger().info("  [" + e.getKey() + "] " + (n != null && n.isRunning() ? "UP" : "DOWN")
                + " Port:" + (n != null ? n.getDetectedPort() : "-")
                + " Tunnel:" + (t != null && t.isRunning() ? "UP" : "OFF"));
        }
        if (!bots.isEmpty()) {
            for (BotManager b : bots) {
                getLogger().info("  Bot: " + b.getBotName() + " " + b.getNmsStatus());
            }
        }
        getLogger().info("================================");
    }

    // ========== COMMANDS ==========

    public boolean handleCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!sender.hasPermission("webrunner.admin")) { sender.sendMessage("No permission!"); return true; }
        String sub = args.length > 0 ? args[0] : "status";
        String target = args.length > 1 ? args[1] : null;
        switch (sub.toLowerCase()) {
            case "status":   return target != null ? cmdStatus(sender, target) : cmdAllStatus(sender);
            case "list":     return cmdList(sender);
            case "start":    return target != null ? cmdStart(sender, target) : usage(sender, "start <project>");
            case "stop":     return target != null ? cmdStop(sender, target) : usage(sender, "stop <project>");
            case "restart":  return target != null ? cmdRestart(sender, target) : usage(sender, "restart <project>");
            case "logs":     return target != null ? cmdLogs(sender, target) : usage(sender, "logs <project>");
            case "startall": return cmdStartAll(sender);
            case "stopall":  return cmdStopAll(sender);
            case "bot":      return args.length > 1 ? cmdBot(sender, args) : usage(sender, "bot <list|spawn|despawn> [name]");
            case "folder":   return tell(sender, "§7Folder: §f" + getDataFolder().getAbsolutePath());
            default:         return tell(sender, "§e/webrunner <status|list|start|stop|restart|logs|startall|stopall|bot> [project]");
        }
    }

    private boolean cmdAllStatus(CommandSender s) {
        s.sendMessage("§6========== WebRunner ==========");
        if (instances.isEmpty()) s.sendMessage("§7  No projects");
        for (Map.Entry<String, ProjectInstance> e : instances.entrySet()) {
            ProjectInstance i = e.getValue();
            NodeManager n = i.nodeManager;
            TunnelManager t = i.tunnelManager;
            boolean up = n != null && n.isRunning();
            boolean tun = t != null && t.isRunning();
            String url;
            if (t != null && t.hasNamedUrl()) {
                url = t.getNamedTunnelUrl();
            } else if (tun) {
                url = t.getQuickTunnelUrl() != null ? t.getQuickTunnelUrl() : "connected";
            } else {
                url = "OFF";
            }
            s.sendMessage("§6  " + e.getKey() + " " + (up ? "§aUP" : "§cDOWN")
                + " §7port:§f" + (n != null ? n.getDetectedPort() : "-")
                + " §7tunnel:§f" + url);
        }
        s.sendMessage("§6Bots: " + bots.size() + "/" + config.botNames.size());
        for (BotManager b : bots) {
            s.sendMessage("§7  §f" + b.getBotName() + " §7" + b.getNmsStatus()
                + " §7at §f" + b.getSpawnLocation());
        }
        s.sendMessage("§6================================");
        return true;
    }

    private boolean cmdStatus(CommandSender s, String name) {
        Config.ProjectConfig pc = config.getProject(name);
        if (pc == null) return tell(s, "§c'" + name + "' not found");
        ProjectInstance i = instances.get(name.toLowerCase());
        s.sendMessage("§6--- " + pc.name + " ---");
        s.sendMessage("§7Folder: §f" + pc.folder);
        s.sendMessage("§7Command: §f" + (pc.command.isEmpty() ? "node index.js" : pc.command));
        s.sendMessage("§7Port: §f" + (pc.port > 0 ? pc.port : "auto"));
        s.sendMessage("§7Token: §f" + (pc.token.isEmpty() ? "(global)" : "set"));
        s.sendMessage("§7Named URL: §f" + (pc.namedUrl != null && !pc.namedUrl.isEmpty() ? pc.namedUrl : "(none)"));
        if (i != null && i.nodeManager != null) {
            NodeManager n = i.nodeManager;
            TunnelManager t = i.tunnelManager;
            s.sendMessage("§7Status: " + (n.isRunning() ? "§aRUNNING" : "§cSTOPPED"));
            s.sendMessage("§7PID: §f" + n.getPid());
            if (t != null && t.isRunning()) {
                String url;
                if (t.hasNamedUrl()) url = t.getNamedTunnelUrl();
                else url = t.getQuickTunnelUrl();
                s.sendMessage("§7Tunnel: §a" + (url != null ? url : "connected"));
            } else s.sendMessage("§7Tunnel: §7off");
        } else s.sendMessage("§7Status: §cNOT STARTED");
        return true;
    }

    private boolean cmdList(CommandSender s) {
        s.sendMessage("§6========== Projects ==========");
        for (Config.ProjectConfig pc : config.projects) {
            ProjectInstance i = instances.get(pc.name.toLowerCase());
            boolean r = i != null && i.nodeManager != null && i.nodeManager.isRunning();
            s.sendMessage("§7  " + pc.name + ": " + (r ? "§arunning" : "§cstopped")
                + " §7dir:§f" + pc.folder
                + " §7cmd:§f" + (pc.command.isEmpty() ? "node index.js" : pc.command));
        }
        s.sendMessage("§6==============================");
        return true;
    }

    private boolean cmdStart(CommandSender s, String name) {
        Config.ProjectConfig pc = config.getProject(name);
        if (pc == null) return tell(s, "§c'" + name + "' not found");
        ProjectInstance i = instances.get(name.toLowerCase());
        if (i != null && i.nodeManager != null && i.nodeManager.isRunning())
            return tell(s, "§c'" + name + "' already running");
        File pkg = new File(getDataFolder(), pc.folder + "/package.json");
        if (pkg.exists()) runNpmInstall(nodeInstaller.getNodeBinary(), pc);
        startInstance(pc);
        return tell(s, "§aStarted: " + name);
    }

    private boolean cmdStop(CommandSender s, String name) {
        ProjectInstance i = instances.get(name.toLowerCase());
        if (i == null) return tell(s, "§c'" + name + "' not running");
        stopInstance(i);
        instances.remove(name.toLowerCase());
        return tell(s, "§cStopped: " + name);
    }

    private boolean cmdRestart(CommandSender s, String name) {
        Config.ProjectConfig pc = config.getProject(name);
        if (pc == null) return tell(s, "§c'" + name + "' not found");
        ProjectInstance i = instances.get(name.toLowerCase());
        if (i != null) stopInstance(i);
        File pkg = new File(getDataFolder(), pc.folder + "/package.json");
        if (pkg.exists()) runNpmInstall(nodeInstaller.getNodeBinary(), pc);
        startInstance(pc);
        return tell(s, "§eRestarted: " + name);
    }

    private boolean cmdLogs(CommandSender s, String name) {
        ProjectInstance i = instances.get(name.toLowerCase());
        if (i == null || i.nodeManager == null) return tell(s, "§c'" + name + "' not running");
        List<String> logs = i.nodeManager.getLogs();
        int start = Math.max(0, logs.size() - 30);
        s.sendMessage("§6=== " + name + " (" + Math.min(30, logs.size()) + " lines) ===");
        for (int j = start; j < logs.size(); j++) s.sendMessage("§7" + logs.get(j));
        return true;
    }

    private boolean cmdStartAll(CommandSender s) {
        int c = 0;
        for (Config.ProjectConfig pc : config.projects) {
            ProjectInstance i = instances.get(pc.name.toLowerCase());
            if (i != null && i.nodeManager != null && i.nodeManager.isRunning()) continue;
            File pkg = new File(getDataFolder(), pc.folder + "/package.json");
            if (pkg.exists()) runNpmInstall(nodeInstaller.getNodeBinary(), pc);
            startInstance(pc); c++;
        }
        return tell(s, "§aStarted " + c);
    }

    private boolean cmdStopAll(CommandSender s) {
        int c = 0;
        for (ProjectInstance i : instances.values()) { stopInstance(i); c++; }
        instances.clear();
        return tell(s, "§cStopped " + c);
    }

    private boolean cmdBot(CommandSender s, String[] args) {
        String action = args[1].toLowerCase();
        String name = args.length > 2 ? args[2] : null;
        switch (action) {
            case "list": {
                if (bots.isEmpty()) return tell(s, "§7No bots online");
                s.sendMessage("§6Bots (" + bots.size() + "/" + config.botNames.size() + "):");
                for (BotManager b : bots) {
                    s.sendMessage("§7  §f" + b.getBotName() + " §7" + b.getNmsStatus()
                        + " §7at §f" + b.getSpawnLocation());
                }
                return true;
            }
            case "spawn": {
                if (name == null) return usage(s, "bot spawn <name>");
                for (String bn : config.botNames) {
                    if (bn.equalsIgnoreCase(name)) {
                        for (BotManager b : bots) {
                            if (b.getBotName().equalsIgnoreCase(name))
                                return tell(s, "§c'" + name + "' already online");
                        }
                        try {
                            BotManager bm = new BotManager(this, bn);
                            if (bm.spawn()) {
                                bots.add(bm);
                                return tell(s, "§aSpawned: " + bn);
                            }
                            return tell(s, "§cSpawn failed for: " + bn);
                        } catch (Exception e) {
                            return tell(s, "§cError: " + e.getMessage());
                        }
                    }
                }
                return tell(s, "§c'" + name + "' not in bot.names config");
            }
            case "despawn": {
                if (name == null) return usage(s, "bot despawn <name>");
                Iterator<BotManager> it = bots.iterator();
                while (it.hasNext()) {
                    BotManager b = it.next();
                    if (b.getBotName().equalsIgnoreCase(name)) {
                        b.despawn();
                        it.remove();
                        return tell(s, "§cDespawned: " + name);
                    }
                }
                return tell(s, "§c'" + name + "' not online");
            }
            default: return usage(s, "bot <list|spawn|despawn> [name]");
        }
    }

    private boolean tell(CommandSender s, String m) { s.sendMessage(m); return true; }
    private boolean usage(CommandSender s, String u) { return tell(s, "§cUsage: /webrunner " + u); }
}
