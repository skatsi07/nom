package com.vieweat;

public class FoodItem {
    private String name;
    private int rating;
    private String description;

    // We allow these to be null if you want them optional too
    public FoodItem(String name, int rating, String description) {
        this.name = name;
        this.rating = rating;
        this.description = description;
    }

    public String getName() { return name; }
    public int getRating() { return rating; }
    public String getDescription() { return description; }
}
