package org.bukkit.plugin.java;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.Command;
import org.bukkit.command.PluginCommand;
import org.bukkit.Server;
import org.bukkit.configuration.file.FileConfiguration;
import java.io.File;
public class JavaPlugin {
    public Server getServer(){return null;}
    public FileConfiguration getConfig(){return null;}
    public void saveDefaultConfig(){}
    public void reloadConfig(){}
    public java.util.logging.Logger getLogger(){return java.util.logging.Logger.getLogger("Minecraft");}
    public PluginCommand getCommand(String n){return null;}
    public File getDataFolder(){return new File(".");}
    public void onEnable(){}
    public void onDisable(){}
}
