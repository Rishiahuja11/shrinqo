package org.bukkit;
public interface Server {
    java.util.List<World> getWorlds();
    org.bukkit.scheduler.BukkitScheduler getScheduler();
}
