package org.bukkit;
import java.util.Collections;
import java.util.List;
public class Bukkit {
    public static Server getServer(){return null;}
    public static List<World> getWorlds(){return Collections.emptyList();}
    public static List<? extends org.bukkit.entity.Player> getOnlinePlayers(){return Collections.emptyList();}
    public static void broadcastMessage(String msg){}
}
