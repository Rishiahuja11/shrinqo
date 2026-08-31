package org.bukkit.block;
import org.bukkit.Material;
import org.bukkit.Location;
public interface Block { Material getType(); boolean breakNaturally(); Location getLocation(); }
