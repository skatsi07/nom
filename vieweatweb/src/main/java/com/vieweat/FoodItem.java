package com.vieweat;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity // 1. Make this a table in MySQL
@Table(name = "food_items") // 2. Name the table
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Unique ID for this specific dish entry

    private String name;
    private int rating;
    
    @Column(columnDefinition = "TEXT")
    private String description;

    // --- THE LINK BACK TO REVIEW ---
    @ManyToOne
    @JoinColumn(name = "review_id", nullable = false) // Creates a column 'review_id' in this table
    private Review review;
}
