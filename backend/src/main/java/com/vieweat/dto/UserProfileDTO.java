package com.vieweat.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserProfileDTO {
    private String username;
    private String name;
    private String bio;
    private String profilePicUrl;
    private String instagramUrl;
    private String tiktokUrl;
}
