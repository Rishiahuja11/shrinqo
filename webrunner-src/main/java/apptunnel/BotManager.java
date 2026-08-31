package apptunnel;

import com.mojang.authlib.GameProfile;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;

import java.lang.reflect.*;
import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.logging.Level;
import java.util.logging.Logger;

public class BotManager {
    private final JavaPlugin plugin;
    private final Logger log;
    private final String botName;
    private boolean active = false;
    private boolean nmsReady = false;
    private BukkitTask moveTask, chatTask, breakTask, heartbeatTask, lookTask, healthTask;
    private World world;
    private Location botLoc;
    private float yaw = 0f;
    private float pitch = 0f;
    private Object nmsPlayer;
    private int entityId;
    private final SecureRandom rng = new SecureRandom();
    private String nmsStatus = "not_started";
    private int respawnCount = 0;
    private boolean isSneaking = false;
    private boolean isSprinting = false;
    private final ConcurrentLinkedDeque<String> recentLogs = new ConcurrentLinkedDeque<>();
    private static final int MAX_LOGS = 50;

    private static final String[] CHAT_MESSAGES = {
        "anyone online?", "nice day for mining", "just found diamonds!",
        "who built this?", "this server is cool", "need food",
        "heading to the nether", "anyone wanna trade?", "love this world",
        "building a house nearby", "just tamed a wolf", "beautiful sunset",
        "found a village!", "need iron badly", "anyone wanna team up?",
        "gg", "nice base", "where is everyone?", "just chilling",
        "lol", "brb", "this is fun", "gonna explore",
        "need wood", "anyone wanna pvp?", "cool build!",
        "anyone need help?", "mining strip", "found lava!",
        "oh nice", "heading home", "back from mining"
    };

    private static final String[] SNEAK_MESSAGES = {
        "*sneaks around*", "*looks around cautiously*", "*hides behind a tree",
        "*tiptoes quietly*", "*peeks around the corner*"
    };

    public BotManager(JavaPlugin plugin, String name) {
        this.plugin = plugin;
        this.log = plugin.getLogger();
        this.botName = name;
    }

    public boolean isActive() { return active; }
    public String getBotName() { return botName; }
    public String getNmsStatus() { return nmsStatus; }

    private void addLog(String msg) {
        String ts = java.time.LocalTime.now().toString().substring(0, 8);
        recentLogs.addLast("[" + ts + "] " + msg);
        while (recentLogs.size() > MAX_LOGS) recentLogs.pollFirst();
    }

    public String getSpawnLocation() {
        if (botLoc == null) return "unknown";
        return String.format("%s [%.1f, %.1f, %.1f]", botLoc.getWorld().getName(), botLoc.getX(), botLoc.getY(), botLoc.getZ());
    }

    public boolean spawn() {
        if (active) return true;
        try {
            world = Bukkit.getWorlds().get(0);
            if (world == null) { log.warning("[bot:" + botName + "] No worlds loaded"); return false; }

            respawnAtSpawn();

            nmsReady = spawnNmsPlayer();
            active = true;
            startTasks();

            if (nmsReady) {
                nmsStatus = "visible";
                log.info("[bot:" + botName + "] VISIBLE at " + formatLoc(botLoc));
                broadcastSystemMessage("§e" + botName + " joined the game");
            } else {
                nmsStatus = "chat_only";
                log.warning("[bot:" + botName + "] chat-only");
            }
            return true;
        } catch (Exception e) {
            log.log(Level.WARNING, "[bot:" + botName + "] Spawn failed", e);
            return false;
        }
    }

    public void despawn() {
        if (!active) return;
        stopTasks();
        broadcastSystemMessage("§e" + botName + " left the game");
        if (nmsReady && nmsPlayer != null) {
            try {
                broadcastDestroy();
                removeFromPlayerList();
            } catch (Exception e) {
                log.log(Level.WARNING, "[bot:" + botName + "] Despawn error", e);
            }
        }
        nmsPlayer = null;
        active = false;
        nmsReady = false;
        nmsStatus = "offline";
        log.info("[bot:" + botName + "] despawned");
    }

    private void respawnAtSpawn() {
        Location spawn = world.getSpawnLocation().clone();
        botLoc = spawn.clone().add(
            rng.nextInt(8) - 4, 0, rng.nextInt(8) - 4
        );
        botLoc.setY(world.getHighestBlockYAt(botLoc) + 1);
    }

    private void respawn() {
        if (!active) return;
        respawnCount++;
        log.info("[bot:" + botName + "] Respawning (#" + respawnCount + ")...");
        addLog("Respawn #" + respawnCount);

        stopTasks();
        if (nmsReady && nmsPlayer != null) {
            try {
                broadcastDestroy();
                removeFromPlayerList();
            } catch (Exception ignored) {}
        }

        Bukkit.getScheduler().runTaskLater(plugin, () -> {
            if (!active) return;
            respawnAtSpawn();

            nmsReady = spawnNmsPlayer();
            if (nmsReady) {
                startTasks();
                broadcastSystemMessage("§e" + botName + " joined the game");
                log.info("[bot:" + botName + "] Respawned at " + formatLoc(botLoc));
            }
        }, 30L);
    }

    private void removeFromPlayerList() {
        try {
            Object mcServer = getMinecraftServer();
            Object playerList = getPlayerList(mcServer);
            if (playerList == null) return;
            Object uuid = nmsPlayer.getClass().getMethod("getUUID").invoke(nmsPlayer);
            String nameLower = botName.toLowerCase(java.util.Locale.ROOT);
            Class<?> clz = playerList.getClass();
            while (clz != null && clz != Object.class) {
                for (Field f : clz.getDeclaredFields()) {
                    f.setAccessible(true);
                    try {
                        Object val = f.get(playerList);
                        if (val instanceof Map<?, ?> map) {
                            Class<?> keyType = getMapKeyType(f);
                            if (keyType == UUID.class) map.remove(uuid);
                            else if (keyType == String.class) map.remove(nameLower);
                        }
                    } catch (Exception ignored) {}
                }
                clz = clz.getSuperclass();
            }
        } catch (Exception ignored) {}
    }

    // ========== NMS FAKE PLAYER ==========

    private boolean spawnNmsPlayer() {
        try {
            Object mcServer = getMinecraftServer();
            Object craftWorld = world.getClass().getMethod("getHandle").invoke(world);
            Object serverLevel = resolveServerLevel(mcServer, craftWorld);
            if (serverLevel == null) { addLog("ERROR: No ServerLevel"); return false; }

            GameProfile profile = new GameProfile(UUID.randomUUID(), botName);

            Class<?> spClass = Class.forName("net.minecraft.server.level.ServerPlayer");

            for (Constructor<?> ctor : spClass.getDeclaredConstructors()) {
                try {
                    Class<?>[] pts = ctor.getParameterTypes();
                    Object[] args = new Object[pts.length];
                    boolean matched = true;

                    for (int i = 0; i < pts.length; i++) {
                        Class<?> pt = pts[i];
                        String ptName = pt.getName();

                        if (ptName.contains("MinecraftServer") || pt.isAssignableFrom(mcServer.getClass())) {
                            args[i] = mcServer;
                        } else if (ptName.contains("ServerLevel") || pt.isAssignableFrom(serverLevel.getClass())) {
                            args[i] = serverLevel;
                        } else if (ptName.contains("GameProfile")) {
                            args[i] = profile;
                        } else if (pt == UUID.class) {
                            args[i] = profile.id();
                        } else if (pt == String.class) {
                            args[i] = botName;
                        } else if (pt.isPrimitive()) {
                            args[i] = defaultValue(pt);
                        } else {
                            try {
                                args[i] = null;
                                if (ptName.contains("ClientInformation")) {
                                    args[i] = pt.getMethod("createDefault").invoke(null);
                                } else {
                                    args[i] = pt.getDeclaredConstructor().newInstance();
                                }
                            } catch (Exception e2) { matched = false; break; }
                        }
                    }

                    if (!matched) continue;
                    ctor.setAccessible(true);
                    nmsPlayer = ctor.newInstance(args);
                    entityId = (int) nmsPlayer.getClass().getMethod("getId").invoke(nmsPlayer);

                    setPos(botLoc.getX(), botLoc.getY(), botLoc.getZ());
                    createFakeConnection(mcServer);

                    broadcastPlayerInfoUpdate("ADD_PLAYER", profile);
                    Thread.sleep(100);
                    broadcastSpawn();
                    Thread.sleep(50);
                    broadcastHeadRotation();
                    broadcastTeleport();

                    addToPlayerList(mcServer);
                    return true;
                } catch (Exception e) {
                    log.fine("[bot:" + botName + "] ctor(" + ctor.getParameterCount() + ") failed: " + e.getMessage());
                }
            }

            log.warning("[bot:" + botName + "] No constructor worked");
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "[bot:" + botName + "] NMS spawn failed", e);
            return false;
        }
    }

    // ========== TASKS ==========

    private void startTasks() {
        moveTask = new BukkitRunnable() {
            @Override public void run() {
                if (!active) { cancel(); return; }
                try { moveRandom(); } catch (Exception ignored) {}
            }
        }.runTaskTimer(plugin, 40L, 60L + rng.nextInt(40));

        chatTask = new BukkitRunnable() {
            @Override public void run() {
                if (!active) { cancel(); return; }
                try { sayRandom(); } catch (Exception ignored) {}
            }
        }.runTaskTimer(plugin, 100L, 300L + rng.nextInt(300));

        breakTask = new BukkitRunnable() {
            @Override public void run() {
                if (!active) { cancel(); return; }
                try { breakNearby(); } catch (Exception ignored) {}
            }
        }.runTaskTimer(plugin, 200L, 200L + rng.nextInt(200));

        heartbeatTask = new BukkitRunnable() {
            @Override public void run() {
                if (!active) { cancel(); return; }
                try {
                    if (nmsReady && nmsPlayer != null) {
                        respondToKeepAlive();
                        broadcastHeadRotation();
                        broadcastAnimation();
                        checkHealth();
                    }
                } catch (Exception ignored) {}
            }
        }.runTaskTimer(plugin, 100L, 200L);

        lookTask = new BukkitRunnable() {
            @Override public void run() {
                if (!active) { cancel(); return; }
                try { lookAround(); } catch (Exception ignored) {}
            }
        }.runTaskTimer(plugin, 60L, 80L + rng.nextInt(60));
    }

    private void stopTasks() {
        if (moveTask != null) { moveTask.cancel(); moveTask = null; }
        if (chatTask != null) { chatTask.cancel(); chatTask = null; }
        if (breakTask != null) { breakTask.cancel(); breakTask = null; }
        if (heartbeatTask != null) { heartbeatTask.cancel(); heartbeatTask = null; }
        if (lookTask != null) { lookTask.cancel(); lookTask = null; }
        if (healthTask != null) { healthTask.cancel(); healthTask = null; }
    }

    // ========== BEHAVIORS ==========

    private void moveRandom() {
        if (botLoc == null || nmsPlayer == null) return;

        double dx = (rng.nextDouble() - 0.5) * 4;
        double dz = (rng.nextDouble() - 0.5) * 4;
        double nx = botLoc.getX() + dx;
        double nz = botLoc.getZ() + dz;

        Location spawn = world.getSpawnLocation();
        double dist = Math.sqrt(Math.pow(nx - spawn.getX(), 2) + Math.pow(nz - spawn.getZ(), 2));
        if (dist > 40) { nx = botLoc.getX() - dx; nz = botLoc.getZ() - dz; }

        double ny = world.getHighestBlockYAt(new Location(world, nx, 0, nz)) + 1;
        botLoc = new Location(world, nx, ny, nz);
        yaw = (float) ((Math.atan2(dz, dx) * 180.0 / Math.PI) + 90.0);

        if (nmsReady) {
            try {
                setPos(nx, ny, nz);
                broadcastTeleport();
                broadcastHeadRotation();
                broadcastAnimation();
            } catch (Exception ignored) {}
        }

        if (rng.nextInt(20) == 0) toggleSneak();
        if (rng.nextInt(30) == 0) toggleSprint();
    }

    private void lookAround() {
        if (nmsPlayer == null || !nmsReady) return;
        pitch = (float) (rng.nextFloat() * 40 - 20);
        yaw += (float) (rng.nextFloat() * 60 - 30);
        if (yaw > 360) yaw -= 360;
        if (yaw < 0) yaw += 360;
        broadcastHeadRotation();
    }

    private void toggleSneak() {
        if (nmsPlayer == null || !nmsReady) return;
        isSneaking = !isSneaking;
        try {
            Class<?> pktClass = Class.forName("net.minecraft.network.protocol.game.ClientboundSetEntityMetadataPacket");
            for (Constructor<?> ctor : pktClass.getDeclaredConstructors()) {
                Class<?>[] pts = ctor.getParameterTypes();
                if (pts.length == 3 && pts[0] == int.class) {
                    ctor.setAccessible(true);
                    List<Object> dataList = new ArrayList<>();
                    Class<?> entityDataClass = Class.forName("net.minecraft.network.syncher.EntityDataAccessor");
                    Class<?> serializerClass = Class.forName("net.minecraft.network.syncher.EntityDataSerializers");
                    Class<?> synchedEntityDataClass = Class.forName("net.minecraft.network.syncher.SynchedEntityData");
                    Method getAccessor = synchedEntityDataClass.getMethod("defineId", Class.class, Class.class);
                    Object accessor = getAccessor.invoke(null, nmsPlayer.getClass(), boolean.class);
                    Object val = isSneaking;
                    Class<?> packedDataType = Class.forName("net.minecraft.network.syncher.EntityDataSerializer");
                    for (Field f : Class.forName("net.minecraft.network.syncher.SynchedEntityData").getDeclaredFields()) {
                        if (f.getType().getSimpleName().contains("SNEAKING") || f.getName().contains("SNEAK")) {
                            f.setAccessible(true);
                            accessor = f.get(null);
                            break;
                        }
                    }
                    Class<?> entityDataValueType = Class.forName("net.minecraft.network.syncher.EntityDataValue");
                    Method packMethod = null;
                    for (Method m : entityDataValueType.getMethods()) {
                        if (m.getParameterCount() == 1 && m.getParameterTypes()[0] == boolean.class) {
                            packMethod = m;
                            break;
                        }
                    }
                    if (packMethod != null) {
                        Object packed = packMethod.invoke(null, isSneaking);
                        Method defineMethod = synchedEntityDataClass.getMethod("get", entityDataClass);
                        Object entityData = defineMethod.invoke(nmsPlayer);
                        Class<?> entityDataInnerClass = entityData.getClass();
                        for (Method m : entityDataInnerClass.getMethods()) {
                            if (m.getName().equals("set") && m.getParameterCount() == 2) {
                                m.invoke(entityData, accessor, packed);
                                break;
                            }
                        }
                    }
                    break;
                }
            }
        } catch (Exception ignored) {}
    }

    private void toggleSprint() {
        if (nmsPlayer == null || !nmsReady) return;
        isSprinting = !isSprinting;
        try {
            Class<?> spClass = Class.forName("net.minecraft.server.level.ServerPlayer");
            for (Method m : spClass.getMethods()) {
                if (m.getName().equals("setSprinting") && m.getParameterCount() == 1) {
                    m.invoke(nmsPlayer, isSprinting);
                    break;
                }
            }
        } catch (Exception ignored) {}
    }

    private void checkHealth() {
        if (nmsPlayer == null) return;
        try {
            Object healthObj = nmsPlayer.getClass().getMethod("getHealth").invoke(nmsPlayer);
            float health = ((Number) healthObj).floatValue();
            if (health <= 0) {
                log.info("[bot:" + botName + "] Died! Respawning...");
                broadcastSystemMessage("§e" + botName + " died!");
                Bukkit.getScheduler().runTaskLater(plugin, () -> {
                    if (active) respawn();
                }, 40L);
            }
        } catch (Exception ignored) {}
    }

    private void respondToKeepAlive() {
        if (nmsPlayer == null) return;
        try {
            Object conn = getDeclaredField(nmsPlayer, "connection");
            if (conn == null) return;

            long now = System.currentTimeMillis();
            Class<?> clz = conn.getClass();
            while (clz != null && clz != Object.class) {
                for (Field f : clz.getDeclaredFields()) {
                    f.setAccessible(true);
                    try {
                        String fn = f.getName().toLowerCase(java.util.Locale.ROOT);
                        if ((fn.contains("keepalive") || fn.contains("keep_alive")) && f.getType() == long.class) {
                            f.setLong(conn, now);
                        }
                        if ((fn.contains("awaited") || fn.contains("pending") || fn.contains("waiting")) && f.getType() == boolean.class) {
                            f.setBoolean(conn, false);
                        }
                    } catch (Exception ignored) {}
                }
                clz = clz.getSuperclass();
            }
        } catch (Exception ignored) {}
    }

    private void sayRandom() {
        if (nmsPlayer == null) return;
        String msg = CHAT_MESSAGES[rng.nextInt(CHAT_MESSAGES.length)];
        if (nmsReady) {
            try {
                Object packet = createSystemChatPacket(msg);
                if (packet != null) { broadcastPacket(packet); return; }
            } catch (Exception ignored) {}
        }
        Bukkit.broadcastMessage("<" + botName + "> " + msg);
    }

    private void breakNearby() {
        if (botLoc == null || !nmsReady) return;
        int bx = botLoc.getBlockX() + rng.nextInt(5) - 2;
        int by = botLoc.getBlockY() + rng.nextInt(3) - 1;
        int bz = botLoc.getBlockZ() + rng.nextInt(5) - 2;
        if (!world.isChunkLoaded(bx >> 4, bz >> 4)) return;
        org.bukkit.block.Block block = world.getBlockAt(bx, by, bz);
        Material type = block.getType();
        if (type != Material.AIR && type != Material.BEDROCK &&
            type != Material.WATER && type != Material.LAVA && type != Material.OBSIDIAN) {
            block.setType(Material.AIR, false);
            broadcastAnimation();
        }
    }

    // ========== NMS HELPERS ==========

    private Object resolveServerLevel(Object mcServer, Object craftWorld) {
        try {
            return mcServer.getClass().getMethod("getLevel", craftWorld.getClass()).invoke(mcServer, craftWorld);
        } catch (Exception ignored) {}
        try {
            return mcServer.getClass().getMethod("getLevel", Class.forName("net.minecraft.resources.ResourceKey"))
                .invoke(mcServer, craftWorld.getClass().getMethod("dimension").invoke(craftWorld));
        } catch (Exception ignored) {}
        try {
            for (Method m : mcServer.getClass().getMethods()) {
                if (m.getName().equals("getLevel") && m.getParameterCount() == 1) {
                    try { return m.invoke(mcServer, craftWorld); } catch (Exception ignored) {}
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private void addToPlayerList(Object mcServer) {
        try {
            Object playerList = getPlayerList(mcServer);
            if (playerList == null) return;
            Object uuid = nmsPlayer.getClass().getMethod("getUUID").invoke(nmsPlayer);
            String nameLower = botName.toLowerCase(java.util.Locale.ROOT);
            Class<?> clz = playerList.getClass();
            while (clz != null && clz != Object.class) {
                for (Field f : clz.getDeclaredFields()) {
                    f.setAccessible(true);
                    try {
                        Object val = f.get(playerList);
                        if (val instanceof Map<?, ?> map) {
                            Class<?> keyType = getMapKeyType(f);
                            if (keyType == UUID.class) {
                                ((Map<Object, Object>) map).put(uuid, nmsPlayer);
                            } else if (keyType == String.class) {
                                ((Map<Object, Object>) map).put(nameLower, nmsPlayer);
                            }
                        } else if (val instanceof List<?> list) {
                            if (!list.contains(nmsPlayer)) {
                                ((List<Object>) list).add(nmsPlayer);
                            }
                        }
                    } catch (Exception ignored) {}
                }
                clz = clz.getSuperclass();
            }
        } catch (Exception ignored) {}
    }

    private Class<?> getMapKeyType(Field f) {
        try {
            java.lang.reflect.Type gt = f.getGenericType();
            if (gt instanceof java.lang.reflect.ParameterizedType pt) {
                java.lang.reflect.Type[] args = pt.getActualTypeArguments();
                if (args.length > 0 && args[0] instanceof Class<?> kc) return kc;
            }
        } catch (Exception ignored) {}
        return Object.class;
    }

    private Object getMinecraftServer() throws Exception {
        Object cs = Bukkit.getServer();
        try { return cs.getClass().getDeclaredMethod("getServer").invoke(cs); }
        catch (NoSuchMethodException e) { return cs.getClass().getDeclaredMethod("getMinecraftServer").invoke(cs); }
    }

    private Object getPlayerList(Object mcServer) {
        Object pl = getDeclaredField(mcServer, "playerList");
        if (pl == null) {
            try { pl = mcServer.getClass().getMethod("getPlayerList").invoke(mcServer); } catch (Exception ignored) {}
        }
        if (pl == null) {
            for (Field f : mcServer.getClass().getDeclaredFields()) {
                f.setAccessible(true);
                try {
                    Object val = f.get(mcServer);
                    if (val != null && val.getClass().getSimpleName().contains("PlayerList")) { pl = val; break; }
                } catch (Exception ignored) {}
            }
        }
        return pl;
    }

    private Object getDeclaredField(Object obj, String name) {
        Class<?> clz = obj.getClass();
        while (clz != null) {
            try {
                Field f = clz.getDeclaredField(name);
                f.setAccessible(true);
                return f.get(obj);
            } catch (NoSuchFieldException e) { clz = clz.getSuperclass(); }
            catch (Exception ignored) { return null; }
        }
        return null;
    }

    private void setPos(double x, double y, double z) throws Exception {
        try { nmsPlayer.getClass().getMethod("setPos", double.class, double.class, double.class).invoke(nmsPlayer, x, y, z); }
        catch (Exception e) {
            try { nmsPlayer.getClass().getMethod("setPosRaw", double.class, double.class, double.class).invoke(nmsPlayer, x, y, z); }
            catch (Exception e2) { nmsPlayer.getClass().getMethod("absMoveTo", double.class, double.class, double.class).invoke(nmsPlayer, x, y, z); }
        }
    }

    // ========== PACKETS ==========

    private void createFakeConnection(Object mcServer) {
        try {
            Class<?> connClass = null;
            for (String name : new String[]{"net.minecraft.network.Connection", "net.minecraft.network.NetworkManager"}) {
                try { connClass = Class.forName(name); break; } catch (ClassNotFoundException ignored) {}
            }
            if (connClass == null) return;

            Object connection = null;
            for (Constructor<?> c : connClass.getDeclaredConstructors()) {
                if (c.getParameterCount() == 1 && c.getParameterTypes()[0].isEnum()) {
                    c.setAccessible(true);
                    Object flowConst = null;
                    for (Object ec : c.getParameterTypes()[0].getEnumConstants()) {
                        if (ec.toString().toUpperCase(java.util.Locale.ROOT).contains("CLIENT")) { flowConst = ec; break; }
                    }
                    if (flowConst == null) flowConst = c.getParameterTypes()[0].getEnumConstants()[0];
                    connection = c.newInstance(flowConst);
                    break;
                }
            }
            if (connection == null) return;

            Class<?> clcClass = null;
            for (String name : new String[]{"net.minecraft.network.CommonListenerCookie", "net.minecraft.server.network.CommonListenerCookie"}) {
                try { clcClass = Class.forName(name); break; } catch (ClassNotFoundException ignored) {}
            }

            Object cookie = null;
            if (clcClass != null) {
                Object gp = nmsPlayer.getClass().getMethod("getGameProfile").invoke(nmsPlayer);
                Object ci = Class.forName("net.minecraft.server.level.ClientInformation").getMethod("createDefault").invoke(null);
                for (Constructor<?> c : clcClass.getDeclaredConstructors()) {
                    if (c.getParameterCount() >= 3) {
                        try {
                            c.setAccessible(true);
                            Class<?>[] pts = c.getParameterTypes();
                            Object[] args = new Object[pts.length];
                            for (int i = 0; i < pts.length; i++) {
                                String pt = pts[i].getName();
                                if (pt.contains("GameProfile")) args[i] = gp;
                                else if (pts[i] == int.class) args[i] = 0;
                                else if (pt.contains("ClientInformation")) args[i] = ci;
                                else if (pts[i] == boolean.class) args[i] = false;
                                else args[i] = defaultValue(pts[i]);
                            }
                            cookie = c.newInstance(args);
                            break;
                        } catch (Exception ignored) {}
                    }
                }
            }

            Class<?> sgpliClass = Class.forName("net.minecraft.server.network.ServerGamePacketListenerImpl");
            Object listener = null;
            for (Constructor<?> c : sgpliClass.getDeclaredConstructors()) {
                if (c.getParameterCount() == 4) {
                    try {
                        c.setAccessible(true);
                        Class<?>[] pts = c.getParameterTypes();
                        Object[] args = new Object[4];
                        for (int i = 0; i < 4; i++) {
                            String pt = pts[i].getName();
                            if (pt.contains("MinecraftServer")) args[i] = mcServer;
                            else if (pt.contains("Connection") || pt.contains("NetworkManager")) args[i] = connection;
                            else if (pt.contains("ServerPlayer")) args[i] = nmsPlayer;
                            else if (pt.contains("CommonListenerCookie") || pt.contains("Cookie")) args[i] = cookie;
                            else args[i] = defaultValue(pts[i]);
                        }
                        listener = c.newInstance(args);
                        break;
                    } catch (Exception ignored) {}
                }
            }

            if (listener == null) return;
            Class<?> clz = nmsPlayer.getClass();
            while (clz != null) {
                for (Field f : clz.getDeclaredFields()) {
                    if (f.getType() == sgpliClass) {
                        f.setAccessible(true);
                        f.set(nmsPlayer, listener);
                        return;
                    }
                }
                clz = clz.getSuperclass();
            }
        } catch (Exception ignored) {}
    }

    private void broadcastPlayerInfoUpdate(String action, GameProfile profile) {
        try {
            Class<?> pktClass = null;
            for (String cls : new String[]{
                "net.minecraft.network.protocol.game.ClientboundPlayerInfoUpdatePacket",
                "net.minecraft.network.game.ClientboundPlayerInfoUpdatePacket"
            }) {
                try { pktClass = Class.forName(cls); break; } catch (ClassNotFoundException ignored) {}
            }
            if (pktClass == null) return;

            Class<?> actionEnum = null;
            for (Class<?> ec : pktClass.getDeclaredClasses()) {
                if (ec.isEnum()) { actionEnum = ec; break; }
            }
            if (actionEnum == null) return;

            Object enumAction = null;
            for (Object c : actionEnum.getEnumConstants()) {
                if (c.toString().equals(action)) { enumAction = c; break; }
            }
            if (enumAction == null) return;

            Object actionSet = Class.forName("java.util.EnumSet").getMethod("of", Enum.class).invoke(null, enumAction);
            for (Constructor<?> ctor : pktClass.getDeclaredConstructors()) {
                Class<?>[] pts = ctor.getParameterTypes();
                if (pts.length == 2 && Set.class.isAssignableFrom(pts[0])) {
                    ctor.setAccessible(true);
                    broadcastPacket(ctor.newInstance(actionSet, new GameProfile[]{profile}));
                    return;
                }
            }
        } catch (Exception ignored) {}
    }

    private void broadcastSpawn() {
        if (nmsPlayer == null) return;
        try {
            try {
                Class<?> seClass = Class.forName("net.minecraft.server.level.ServerEntity");
                Class<?> syncClass = Class.forName("net.minecraft.server.level.ServerEntity$Synchronizer");
                Object mcServer = getMinecraftServer();
                Object sl = resolveServerLevel(mcServer, world.getClass().getMethod("getHandle").invoke(world));
                Object syncProxy = Proxy.newProxyInstance(syncClass.getClassLoader(), new Class[]{syncClass}, (p, m, a) -> null);
                Constructor<?> seCtor = seClass.getDeclaredConstructor(
                    Class.forName("net.minecraft.server.level.ServerLevel"),
                    Class.forName("net.minecraft.world.entity.Entity"),
                    int.class, boolean.class, syncClass, Set.class
                );
                Object serverEntity = seCtor.newInstance(sl, nmsPlayer, 2, false, syncProxy, Collections.emptySet());
                Object packet = nmsPlayer.getClass().getMethod("getAddEntityPacket", seClass).invoke(nmsPlayer, serverEntity);
                broadcastPacket(packet);
                return;
            } catch (Exception ignored) {}

            try {
                broadcastPacket(nmsPlayer.getClass().getMethod("getAddEntityPacket").invoke(nmsPlayer));
                return;
            } catch (Exception ignored) {}
        } catch (Exception ignored) {}
    }

    private void broadcastTeleport() {
        if (nmsPlayer == null) return;
        try {
            Class<?> tpClass = Class.forName("net.minecraft.network.protocol.game.ClientboundTeleportEntityPacket");
            Class<?> pmrClass = Class.forName("net.minecraft.world.entity.PositionMoveRotation");
            Class<?> vec3Class = Class.forName("net.minecraft.world.phys.Vec3");
            Object pos = nmsPlayer.getClass().getMethod("position").invoke(nmsPlayer);
            double x = (double) vec3Class.getMethod("x").invoke(pos);
            double y = (double) vec3Class.getMethod("y").invoke(pos);
            double z = (double) vec3Class.getMethod("z").invoke(pos);
            Object posVec = vec3Class.getConstructor(double.class, double.class, double.class).newInstance(x, y, z);
            Object zeroVec = vec3Class.getConstructor(double.class, double.class, double.class).newInstance(0, 0, 0);
            Object pmr = pmrClass.getConstructor(vec3Class, vec3Class, float.class, float.class).newInstance(posVec, zeroVec, 0f, 0f);
            broadcastPacket(tpClass.getDeclaredConstructors()[0].newInstance(entityId, pmr, Collections.emptySet(), false));
        } catch (Exception ignored) {}
    }

    private void broadcastHeadRotation() {
        if (nmsPlayer == null) return;
        try {
            for (String cls : new String[]{
                "net.minecraft.network.protocol.game.ClientboundRotateHeadPacket",
                "net.minecraft.network.game.ClientboundRotateHeadPacket"
            }) {
                try {
                    Class<?> hrClass = Class.forName(cls);
                    for (Constructor<?> ctor : hrClass.getDeclaredConstructors()) {
                        Class<?>[] pts = ctor.getParameterTypes();
                        if (pts.length == 2 && pts[1] == byte.class) {
                            ctor.setAccessible(true);
                            if (pts[0].getName().contains("Entity")) {
                                broadcastPacket(ctor.newInstance(nmsPlayer, (byte)((int)(yaw * 256.0F / 360.0F))));
                            } else {
                                broadcastPacket(ctor.newInstance(entityId, (byte)((int)(yaw * 256.0F / 360.0F))));
                            }
                            return;
                        }
                    }
                } catch (ClassNotFoundException ignored) {}
            }
        } catch (Exception ignored) {}
    }

    private void broadcastAnimation() {
        try {
            for (String cls : new String[]{
                "net.minecraft.network.protocol.game.ClientboundAnimatePacket",
                "net.minecraft.network.game.ClientboundAnimatePacket"
            }) {
                try {
                    broadcastPacket(Class.forName(cls).getConstructor(int.class, int.class).newInstance(entityId, 0));
                    return;
                } catch (ClassNotFoundException ignored) {}
            }
        } catch (Exception ignored) {}
    }

    private void broadcastDestroy() {
        try {
            for (String cls : new String[]{
                "net.minecraft.network.protocol.game.ClientboundRemoveEntitiesPacket",
                "net.minecraft.network.game.ClientboundRemoveEntitiesPacket"
            }) {
                try {
                    Class<?> rmClass = Class.forName(cls);
                    for (Constructor<?> ctor : rmClass.getConstructors()) {
                        Class<?>[] pts = ctor.getParameterTypes();
                        if (pts.length == 1 && pts[0] == int[].class) {
                            broadcastPacket(ctor.newInstance(new int[]{entityId})); return;
                        } else if (pts.length == 1 && pts[0] == int.class) {
                            broadcastPacket(ctor.newInstance(entityId)); return;
                        } else if (pts.length == 1 && Collection.class.isAssignableFrom(pts[0])) {
                            broadcastPacket(ctor.newInstance(List.of(entityId))); return;
                        }
                    }
                } catch (ClassNotFoundException ignored) {}
            }
        } catch (Exception ignored) {}
    }

    private Object createSystemChatPacket(String msg) {
        try {
            Class<?> pktClass = null;
            for (String cls : new String[]{
                "net.minecraft.network.chat.ClientboundSystemChatPacket",
                "net.minecraft.network.protocol.game.ClientboundSystemChatPacket"
            }) {
                try { pktClass = Class.forName(cls); break; } catch (ClassNotFoundException ignored) {}
            }
            if (pktClass == null) return null;

            Class<?> compClass = null;
            for (String cls : new String[]{"net.minecraft.network.chat.Component", "net.minecraft.network.chat.MutableComponent"}) {
                try { compClass = Class.forName(cls); break; } catch (ClassNotFoundException ignored) {}
            }
            if (compClass == null) return null;

            Object component = compClass.getMethod("literal", String.class).invoke(null, msg);
            for (Method m : pktClass.getMethods()) {
                if (m.getName().equals("literal") && m.getParameterCount() == 2) {
                    return m.invoke(null, msg, false);
                }
            }
            for (Constructor<?> ctor : pktClass.getDeclaredConstructors()) {
                try {
                    Object[] args = new Object[ctor.getParameterCount()];
                    args[0] = component;
                    for (int i = 1; i < args.length; i++) args[i] = defaultValue(ctor.getParameterTypes()[i]);
                    return ctor.newInstance(args);
                } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}
        return null;
    }

    private void broadcastPacket(Object packet) {
        for (Player p : Bukkit.getOnlinePlayers()) {
            try { sendPacketToPlayer(p, packet); } catch (Exception ignored) {}
        }
    }

    private void broadcastSystemMessage(String msg) {
        try {
            Object packet = createSystemChatPacket(msg);
            if (packet != null) broadcastPacket(packet);
        } catch (Exception ignored) {}
        Bukkit.getOnlinePlayers().forEach(p -> p.sendMessage(msg));
    }

    private void sendPacketToPlayer(Player player, Object packet) throws Exception {
        Object handle = player.getClass().getMethod("getHandle").invoke(player);
        Object conn = getDeclaredField(handle, "connection");
        if (conn == null) conn = getDeclaredField(handle, "conn");
        if (conn == null) {
            for (Field f : handle.getClass().getDeclaredFields()) {
                if (f.getType().getSimpleName().toLowerCase().contains("connection")) {
                    f.setAccessible(true); conn = f.get(handle); if (conn != null) break;
                }
            }
        }
        if (conn == null) return;

        Object netManager = conn;
        for (Field f : conn.getClass().getDeclaredFields()) {
            String sn = f.getType().getSimpleName().toLowerCase();
            if (sn.contains("connection") || sn.contains("networkmanager")) {
                f.setAccessible(true); netManager = f.get(conn); if (netManager != null) break;
            }
        }

        for (Method m : netManager.getClass().getMethods()) {
            if ((m.getName().equals("sendPacket") || m.getName().equals("send")) && m.getParameterCount() == 1) {
                m.invoke(netManager, packet); return;
            }
        }
    }

    private Object defaultValue(Class<?> type) {
        if (type == int.class || type == Integer.class) return 0;
        if (type == long.class || type == Long.class) return 0L;
        if (type == float.class || type == Float.class) return 0f;
        if (type == double.class || type == Double.class) return 0d;
        if (type == boolean.class || type == Boolean.class) return false;
        if (type == byte.class || type == Byte.class) return (byte) 0;
        if (type == short.class || type == Short.class) return (short) 0;
        return null;
    }

    private String formatLoc(Location loc) {
        return loc == null ? "null" : String.format("[%s: %.1f, %.1f, %.1f]", loc.getWorld().getName(), loc.getX(), loc.getY(), loc.getZ());
    }
}
