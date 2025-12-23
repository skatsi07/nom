package com.vieweat.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FoodItemDTO {
    private Long id;
    private String name;
    private Double rating;
    private String description;
}
