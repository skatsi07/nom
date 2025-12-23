package com.vieweat.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;

import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

@Service
public class CloudinaryUploader implements IFileUploader {

    private final Cloudinary cloudinary;
    private final Bucket bucket;

    @Autowired
    public CloudinaryUploader(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;

        // Rate Limiting: 10 uploads per minute
        Bandwidth limit = Bandwidth.classic(10, Refill.greedy(10, Duration.ofMinutes(1)));
        this.bucket = Bucket.builder()
                .addLimit(limit)
                .build();
    }

    @Override
    public String uploadFile(MultipartFile file) throws IOException {
        if (bucket.tryConsume(1)) {
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            return (String) uploadResult.get("secure_url");
        } else {
            throw new IOException("Rate limit exceeded. Please try again later.");
        }
    }
}
