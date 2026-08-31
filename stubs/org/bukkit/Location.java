package org.bukkit;
public class Location implements Cloneable {
    private World w; private double x,y,z;
    public Location(World w,double x,double y,double z){this.w=w;this.x=x;this.y=y;this.z=z;}
    public World getWorld(){return w;}
    public double getX(){return x;} public double getY(){return y;} public double getZ(){return z;}
    public int getBlockX(){return(int)x;} public int getBlockY(){return(int)y;} public int getBlockZ(){return(int)z;}
    public Location add(double x,double y,double z){return new Location(w,this.x+x,this.y+y,this.z+z);}
    public Location add(int x,int y,int z){return new Location(w,this.x+x,this.y+y,this.z+z);}
    public void setY(double y){this.y=y;}
    public double distance(Location o){return Math.sqrt(Math.pow(x-o.x,2)+Math.pow(y-o.y,2)+Math.pow(z-o.z,2));}
    public Location clone(){try{return(Location)super.clone();}catch(Exception e){return this;}}
}
