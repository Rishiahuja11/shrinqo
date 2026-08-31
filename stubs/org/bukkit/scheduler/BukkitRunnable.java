package org.bukkit.scheduler;
public abstract class BukkitRunnable implements Runnable {
    public BukkitTask runTaskTimer(org.bukkit.plugin.java.JavaPlugin p,long d,long per){return null;}
    public BukkitTask runTaskLater(org.bukkit.plugin.java.JavaPlugin p,long d){return null;}
    public void cancel(){}
}
