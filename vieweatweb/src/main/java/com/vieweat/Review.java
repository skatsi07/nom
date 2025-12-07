package com.vieweat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

import java.util.ArrayList;
import java.util.List;

@Data 
@Builder 
@NoArgsConstructor 
@AllArgsConstructor 
public class Review {

    // --- 1. MANDATORY FIELDS ---
    
    // Primitive 'int' cannot be null, so this is automatically mandatory.
    private int overallRating;

    // Lombok will generate a null-check for these. 
    // If you try to set these to null, the app will throw a NullPointerException.
    @NonNull
    private String placeName;
    
    @NonNull
    private String date;

    // --- 2. OPTIONAL FIELDS ---
    private Float pricePerPerson;
    private String cuisine;
    private String overallDesc;
    private String instagramUrl;
    private String tiktokUrl;

    // --- 3. OPTIONAL SCORES ---
    private Integer foodScore;
    private Integer serviceScore;
    private Integer ambianceScore;

    // --- 4. LIST ---
    @Builder.Default 
    private List<FoodItem> foodItems = new ArrayList<>();
}