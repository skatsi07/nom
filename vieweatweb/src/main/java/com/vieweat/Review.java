package com.vieweat;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Every review gets a unique ID

    // --- THE LINK TO THE USER ---
    @ManyToOne // Many reviews can belong to One user
    @JoinColumn(name = "user_id", nullable = false) // This creates a "Foreign Key" column in the DB
    private User user;

    // --- 1. MANDATORY FIELDS ---
    @Column(unique = false, nullable = false)
    private Double overallRating;

    @Column(unique = false, nullable = false)
    private String placeName;
    
    @Column(unique = false, nullable = false)
    private String date;

    // --- 2. OPTIONAL FIELDS ---
    private Float pricePerPerson;
    private String cuisine;
    private String instagramUrl;
    private String tiktokUrl;
    
    @Column(columnDefinition = "TEXT")
    private String overallDesc;

    // --- 3. OPTIONAL SCORES ---
    private Double foodScore;
    private Double serviceScore;
    private Double ambianceScore;

    // --- 4. LIST ---
    @Builder.Default 
    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL)
    private List<FoodItem> foodItems = new ArrayList<>();
}