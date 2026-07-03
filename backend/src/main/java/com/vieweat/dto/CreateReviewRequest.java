package com.vieweat.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateReviewRequest {
    private String placeName;
    private String date;
    private Double overallRating;
    private Float pricePerPerson;
    private String cuisine;
    private String tags;
    private String instagramUrl;
    private String tiktokUrl;
    private String overallDesc;
    private Double foodScore;
    private Double serviceScore;
    private Double ambianceScore;

    // For nested food items
    private List<FoodItemDTO> foodItems;
}
