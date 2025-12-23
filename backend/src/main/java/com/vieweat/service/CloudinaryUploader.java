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

    @Override
    public void deleteFile(String url) throws IOException {
        if (url == null || url.isEmpty()) {
            return;
        }

        // Extract public ID from URL
        // Example URL:
        // https://res.cloudinary.com/demo/image/upload/v1570979139/folder/sample.jpg
        try {
            // 1. Find the substring after "upload/" (and optional version "v123/")
            // The public ID includes folder structure but NO extension.
            // Simplest approach: Get the part after the last '/' and remove extension? NO,
            // because of folders.
            // Better: Use Cloudinary's recommendation or regex.

            // Simple parsing specific to standard Cloudinary URLs:
            int uploadIndex = url.indexOf("/upload/");
            if (uploadIndex == -1) {
                System.err.println("WARNING: Could not parse publicId from URL: " + url);
                return;
            }

            String path = url.substring(uploadIndex + 8); // Skip "/upload/"

            // Skip version "v123456789/" if present
            if (path.startsWith("v")) {
                int slashAfterVersion = path.indexOf("/");
                if (slashAfterVersion != -1) {
                    path = path.substring(slashAfterVersion + 1);
                }
            }

            // Remove extension (last dot)
            int lastDot = path.lastIndexOf(".");
            String publicId = (lastDot == -1) ? path : path.substring(0, lastDot);

            // Delete from Cloudinary
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            System.out.println("Deleted from Cloudinary: " + publicId);

        } catch (Exception e) {
            System.err.println("Error deleting file from Cloudinary: " + e.getMessage());
            // We generally Log and Continue so we don't break the user flow just because
            // cleanup failed
        }
    }
}
