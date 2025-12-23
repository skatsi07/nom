package com.vieweat.config;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    // Use a default value of null to prevent startup crash if the env var is
    // missing
    @Value("${CLOUDINARY_URL:#{null}}")
    private String cloudinaryUrl;

    @Bean
    public Cloudinary cloudinary() {
        // Cloudinary expects the "CLOUDINARY_URL" to be auto-detected if set in env
        // vars,
        // but explicit configuration is safer if passing it around.
        // However, the simplest way with the Java SDK and env var is just:
        // return new Cloudinary(System.getenv("CLOUDINARY_URL"));
        // Or using the injected value:

        if (cloudinaryUrl == null || cloudinaryUrl.isEmpty()) {
            // Fallback or Error - For now, we assume it's provided in env
            // Using System.getenv if the injected property is missing or for redundancy
            String envUrl = System.getenv("CLOUDINARY_URL");
            if (envUrl != null) {
                return new Cloudinary(envUrl);
            }
            throw new IllegalStateException("CLOUDINARY_URL environment variable not set");
        }

        return new Cloudinary(cloudinaryUrl);
    }
}
