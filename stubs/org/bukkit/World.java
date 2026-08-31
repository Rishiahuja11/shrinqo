package org.bukkit;
public interface World {
    String getName();
    Location getSpawnLocation();
    org.bukkit.block.Block getBlockAt(int x,int y,int z);
    org.bukkit.block.Block getBlockAt(Location l);
    int getHighestBlockYAt(Location l);
    Object getHandle();
}
