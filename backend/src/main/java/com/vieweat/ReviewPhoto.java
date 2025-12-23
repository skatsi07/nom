package com.vieweat;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "review_photos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String photoUrl; // Stores "/review-photos/10/pizza.jpg"

    // Link back to the Review
    @ManyToOne
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    private Integer photoOrder;
}