package com.vieweat.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class ReviewDTO {
    private Long id;
    private String placeName;
    private String date;
    private Double overallRating;

    private Float pricePerPerson;
    private String cuisine;
    private String instagramUrl;
    private String tiktokUrl;
    private String overallDesc;

    private Double foodScore;
    private Double serviceScore;
    private Double ambianceScore;

    private List<FoodItemDTO> foodItems;
    private List<ReviewPhotoDTO> photos;
}
