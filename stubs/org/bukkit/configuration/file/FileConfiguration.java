package org.bukkit.configuration.file;
public class FileConfiguration {
    public int getInt(String p,int d){return d;}
    public String getString(String p,String d){return d;}
    public boolean getBoolean(String p,boolean d){return d;}
    public void set(String p,Object v){}
}
