package org.bukkit.scheduler;
public interface BukkitScheduler {
    BukkitTask runTaskLater(org.bukkit.plugin.java.JavaPlugin p,Runnable r,long delay);
    BukkitTask runTaskTimer(org.bukkit.plugin.java.JavaPlugin p,Runnable r,long delay,long period);
    BukkitTask runTask(org.bukkit.plugin.java.JavaPlugin p,Runnable r);
}
