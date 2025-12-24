package com.vieweat;

import com.vieweat.dto.*;
import com.vieweat.service.IFileUploader;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allow React app to access
public class ProfileController {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final IFileUploader fileUploader;

    // Helper to get authenticated user
    private User getCurrentUser(java.security.Principal principal) {
        // principal.getName() returns the Supabase UID (sub claim)
        return userRepository.findBySupabaseUid(principal.getName());
    }

    // --- 1. GET PROFILE (Profile Info + Top 5 Reviews) ---
    @GetMapping("/profile/{username}")
    public ResponseEntity<UserProfileDTO> getProfile(@PathVariable String username) {
        User user = userRepository.findByUsername(username);
        if (user == null)
            return ResponseEntity.notFound().build();

        UserProfileDTO dto = UserProfileDTO.builder()
                .username(user.getUsername())
                .name(user.getName())
                .bio(user.getBio())
                .profilePicUrl(user.getProfilePicUrl())
                .instagramUrl(user.getInstagramUrl())
                .tiktokUrl(user.getTiktokUrl())
                .build();

        return ResponseEntity.ok(dto);
    }

    // Helper Endpoint: Identify Current User
    @GetMapping("/me")
    public ResponseEntity<UserProfileDTO> getCurrentUserProfile(java.security.Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        User user = userRepository.findBySupabaseUid(principal.getName());
        if (user == null)
            return ResponseEntity.notFound().build();

        UserProfileDTO dto = UserProfileDTO.builder()
                .username(user.getUsername())
                .name(user.getName())
                .bio(user.getBio())
                .profilePicUrl(user.getProfilePicUrl())
                .instagramUrl(user.getInstagramUrl())
                .tiktokUrl(user.getTiktokUrl())
                .build();
        return ResponseEntity.ok(dto);
    }

    // --- 2. GET REVIEWS ---
    @GetMapping("/reviews")
    public ResponseEntity<Page<ReviewDTO>> getReviews(
            @RequestParam(name = "username", required = false) String username,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "9") int size) {

        if (username == null || username.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        User user = userRepository.findByUsername(username);
        if (user == null)
            return ResponseEntity.notFound().build();

        Pageable pageable = PageRequest.of(page, size);
        Page<Review> reviewsPage = reviewRepository.findAllByUserOrderByDateDesc(user, pageable);

        // Convert Page<Review> to Page<ReviewDTO>
        Page<ReviewDTO> dtoPage = reviewsPage.map(this::convertToDTO);

        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/reviews/{id}")
    public ResponseEntity<ReviewDTO> getReviewById(@PathVariable Long id) {
        Review review = reviewRepository.findById(id).orElse(null);
        if (review == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(convertToDTO(review));
    }

    // --- 3. CREATE REVIEW ---
    @PostMapping(value = "/reviews", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<ReviewDTO> createReview(
            @RequestPart("reviewData") CreateReviewRequest request,
            @RequestPart(value = "images", required = false) MultipartFile[] files,
            java.security.Principal principal) throws IOException {

        User user = getCurrentUser(principal);
        if (user == null)
            return ResponseEntity.status(401).build();

        Review review = new Review();
        review.setUser(user);
        updateReviewFromRequest(review, request);

        // Handle Food Items
        if (request.getFoodItems() != null) {
            List<FoodItem> items = request.getFoodItems().stream().map(dto -> {
                FoodItem item = new FoodItem();
                item.setName(dto.getName());
                item.setRating(dto.getRating());
                item.setDescription(dto.getDescription());
                item.setReview(review);
                return item;
            }).collect(Collectors.toList());
            review.setFoodItems(items);
        }

        Review savedReview = reviewRepository.save(review);

        // Handle Photos
        if (files != null && files.length > 0) {
            int order = 0;
            List<ReviewPhoto> photos = new ArrayList<>();
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    String url = fileUploader.uploadFile(file);
                    ReviewPhoto photo = new ReviewPhoto();
                    photo.setPhotoUrl(url);
                    photo.setReview(savedReview);
                    photo.setPhotoOrder(order++);
                    photos.add(photo);
                }
            }
            savedReview.setPhotos(photos);
            reviewRepository.save(savedReview);
        }

        return ResponseEntity.ok(convertToDTO(savedReview));
    }

    // --- 4. UPDATE REVIEW ---
    @PutMapping(value = "/reviews/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<ReviewDTO> updateReview(
            @PathVariable Long id,
            @RequestPart("reviewData") CreateReviewRequest request,
            @RequestPart(value = "newImages", required = false) MultipartFile[] newFiles,
            @RequestParam(value = "deletedPhotoIds", required = false) String deletedPhotoIdsStr,
            @RequestParam(value = "coverPhotoId", required = false) Long coverPhotoId,
            @RequestParam(value = "coverNewFileIndex", required = false) Integer coverNewFileIndex,
            java.security.Principal principal) throws IOException {

        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid ID"));

        // Security Check
        User currentUser = getCurrentUser(principal);
        if (!review.getUser().getUsername().equals(currentUser.getUsername())) {
            return ResponseEntity.status(403).build();
        }

        updateReviewFromRequest(review, request);

        // Update Food Items (Simple Replace)
        review.getFoodItems().clear();
        if (request.getFoodItems() != null) {
            for (FoodItemDTO dto : request.getFoodItems()) {
                FoodItem item = new FoodItem();
                item.setName(dto.getName());
                item.setRating(dto.getRating());
                item.setDescription(dto.getDescription());
                item.setReview(review);
                review.getFoodItems().add(item);
            }
        }

        // Handle Photo Deletion
        if (deletedPhotoIdsStr != null && !deletedPhotoIdsStr.isEmpty()) {
            List<Long> idsToRemove = Arrays.stream(deletedPhotoIdsStr.split(","))
                    .map(String::trim).map(Long::parseLong).collect(Collectors.toList());

            review.getPhotos().removeIf(p -> {
                if (idsToRemove.contains(p.getId())) {
                    try {
                        fileUploader.deleteFile(p.getPhotoUrl());
                    } catch (IOException e) {
                    }
                    return true;
                }
                return false;
            });
        }

        // Track new photos to identify for coverNewFileIndex
        List<ReviewPhoto> newlyAddedPhotos = new ArrayList<>();

        // Handle New Photos
        if (newFiles != null) {
            // Note: We don't set order yet, we'll reset all orders at the end
            for (MultipartFile file : newFiles) {
                if (!file.isEmpty()) {
                    String url = fileUploader.uploadFile(file);
                    ReviewPhoto photo = new ReviewPhoto();
                    photo.setPhotoUrl(url);
                    photo.setReview(review);
                    review.getPhotos().add(photo);
                    newlyAddedPhotos.add(photo);
                }
            }
        }

        // --- COVER PHOTO RE-ORDERING ---
        if (coverPhotoId != null) {
            // User wants an EXISTING photo to be first on the list
            ReviewPhoto cover = review.getPhotos().stream()
                    .filter(p -> p.getId().equals(coverPhotoId))
                    .findFirst().orElse(null);

            if (cover != null) {
                review.getPhotos().remove(cover);
                review.getPhotos().add(0, cover);
            }
        } else if (coverNewFileIndex != null && coverNewFileIndex >= 0 && coverNewFileIndex < newlyAddedPhotos.size()) {
            // User wants a NEW photo to be first
            ReviewPhoto cover = newlyAddedPhotos.get(coverNewFileIndex);
            if (cover != null && review.getPhotos().contains(cover)) {
                review.getPhotos().remove(cover);
                review.getPhotos().add(0, cover);
            }
        }

        // Re-assign Order (0, 1, 2...)
        for (int i = 0; i < review.getPhotos().size(); i++) {
            review.getPhotos().get(i).setPhotoOrder(i);
        }

        Review saved = reviewRepository.save(review);
        return ResponseEntity.ok(convertToDTO(saved));
    }

    // --- 5. DELETE REVIEW ---
    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id, java.security.Principal principal) {
        Review review = reviewRepository.findById(id).orElse(null);
        if (review == null)
            return ResponseEntity.notFound().build();

        User currentUser = getCurrentUser(principal);
        if (!review.getUser().getUsername().equals(currentUser.getUsername())) {
            return ResponseEntity.status(403).build();
        }

        for (ReviewPhoto p : review.getPhotos()) {
            try {
                fileUploader.deleteFile(p.getPhotoUrl());
            } catch (IOException e) {
            }
        }
        reviewRepository.delete(review);
        return ResponseEntity.ok().build();
    }

    // --- 6. UPDATE PROFILE ---
    @PostMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserProfileDTO> updateProfile(
            @RequestParam("bio") String bio,
            @RequestParam(value = "instagramUrl", required = false) String instagramUrl,
            @RequestParam(value = "tiktokUrl", required = false) String tiktokUrl,
            @RequestPart(value = "image", required = false) MultipartFile file,
            java.security.Principal principal) throws IOException {

        User user = getCurrentUser(principal);
        if (user == null)
            return ResponseEntity.status(401).build();

        user.setBio(bio);
        user.setInstagramUrl(instagramUrl);
        user.setTiktokUrl(tiktokUrl);

        if (file != null && !file.isEmpty()) {
            if (user.getProfilePicUrl() != null)
                fileUploader.deleteFile(user.getProfilePicUrl());
            user.setProfilePicUrl(fileUploader.uploadFile(file));
        }

        userRepository.save(user);

        return getProfile(user.getUsername());
    }

    // Helper Methods
    private void updateReviewFromRequest(Review review, CreateReviewRequest request) {
        review.setPlaceName(request.getPlaceName());
        review.setDate(request.getDate());
        review.setOverallRating(request.getOverallRating());
        review.setPricePerPerson(request.getPricePerPerson());
        review.setCuisine(request.getCuisine());
        review.setInstagramUrl(request.getInstagramUrl());
        review.setTiktokUrl(request.getTiktokUrl());
        review.setOverallDesc(request.getOverallDesc());
        review.setFoodScore(request.getFoodScore());
        review.setServiceScore(request.getServiceScore());
        review.setAmbianceScore(request.getAmbianceScore());
    }

    private ReviewDTO convertToDTO(Review r) {
        return ReviewDTO.builder()
                .id(r.getId())
                .placeName(r.getPlaceName())
                .date(r.getDate())
                .overallRating(r.getOverallRating())
                .cuisine(r.getCuisine())
                .pricePerPerson(r.getPricePerPerson())
                .instagramUrl(r.getInstagramUrl())
                .tiktokUrl(r.getTiktokUrl())
                .overallDesc(r.getOverallDesc())
                .foodScore(r.getFoodScore())
                .serviceScore(r.getServiceScore())
                .ambianceScore(r.getAmbianceScore())
                .photos(r.getPhotos().stream().map(p -> ReviewPhotoDTO.builder()
                        .id(p.getId())
                        .photoUrl(p.getPhotoUrl())
                        .photoOrder(p.getPhotoOrder())
                        .build()).collect(Collectors.toList()))
                .foodItems(r.getFoodItems().stream().map(f -> FoodItemDTO.builder()
                        .id(f.getId())
                        .name(f.getName())
                        .rating(f.getRating())
                        .description(f.getDescription())
                        .build()).collect(Collectors.toList()))
                .build();
    }
}