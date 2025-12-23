package com.vieweat.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReviewPhotoDTO {
    private Long id;
    private String photoUrl;
    private Integer photoOrder;
}
