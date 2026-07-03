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
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // --- MANDATORY FIELDS ---
    @Column(unique = false, nullable = false)
    private Double overallRating;

    @Column(unique = false, nullable = false)
    private String placeName;

    @Column(unique = false, nullable = false)
    private String date;

    // --- OPTIONAL FIELDS ---
    private Float pricePerPerson;
    private String cuisine;
    private String tags;
    private String instagramUrl;
    private String tiktokUrl;

    @Column(columnDefinition = "TEXT")
    private String overallDesc;

    private Double foodScore;
    private Double serviceScore;
    private Double ambianceScore;

    @Builder.Default
    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 20)
    private List<FoodItem> foodItems = new ArrayList<>();

    // --- PHOTOS ---
    @Builder.Default
    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("photoOrder ASC")
    @org.hibernate.annotations.BatchSize(size = 20)
    private List<ReviewPhoto> photos = new ArrayList<>();
}