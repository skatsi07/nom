package com.vieweat;

import com.vieweat.service.IFileUploader;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class ProfileController {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final IFileUploader fileUploader;

    // --- 1. HOME PAGE (Recent 5 Reviews) ---
    @GetMapping("/")
    public String home(Model model) {
        User myProfile = userRepository.findByUsername("skatsi07");
        List<Review> myReviews = reviewRepository.findTop5ByUserOrderByDateDesc(myProfile);

        model.addAttribute("reviews", myReviews);
        model.addAttribute("user", myProfile);

        return "profile";
    }

    // --- 2. ALL REVIEWS PAGE ---
    @GetMapping("/reviews")
    public String getAllReviews(Model model) {
        User myProfile = userRepository.findByUsername("skatsi07");
        List<Review> allReviews = reviewRepository.findAllByUserOrderByDateDesc(myProfile);

        model.addAttribute("reviews", allReviews);
        model.addAttribute("user", myProfile);

        return "all-reviews";
    }

    // --- 3a. GET: Show the Form ---
    @GetMapping("/add")
    public String showAddReviewForm(Model model) {
        model.addAttribute("review", new Review());
        return "add-review";
    }

    // --- 3b. POST: Save the Form ---
    // --- 3b. POST: Save the Form ---
    @PostMapping("/add")
    public String addReview(
            @ModelAttribute Review review,
            @RequestParam("reviewImages") MultipartFile[] filesArray,
            @RequestParam(value = "coverImageIndex", defaultValue = "0") int coverIndex,
            // NEW: Receive indices to skip
            @RequestParam(value = "skippedImageIndices", required = false) String skippedIndicesStr)
            throws IOException {

        // --- A. FILTER & REORDER IMAGES ---

        // 1. Create a "Working List" excluding skipped files
        List<MultipartFile> validFiles = new ArrayList<>();
        List<Integer> skippedIndices = new ArrayList<>();

        if (skippedIndicesStr != null && !skippedIndicesStr.isEmpty()) {
            skippedIndices = Arrays.stream(skippedIndicesStr.split(","))
                    .map(String::trim)
                    .map(Integer::parseInt)
                    .toList();
        }

        // Only add files that are NOT in the skipped list
        for (int i = 0; i < filesArray.length; i++) {
            if (!skippedIndices.contains(i)) {
                validFiles.add(filesArray[i]);
            }
        }

        // 2. Handle Cover Image Logic (If cover wasn't deleted)
        // We need to map the "Original Index" (from HTML) to the "New List Index"
        if (!validFiles.isEmpty() && coverIndex >= 0 && !skippedIndices.contains(coverIndex)) {
            MultipartFile selectedCover = filesArray[coverIndex];

            // Remove it from wherever it ended up in validFiles
            validFiles.remove(selectedCover);
            // Add it to the front
            validFiles.add(0, selectedCover);
        }

        // --- B. STANDARD SAVE LOGIC ---

        User currentUser = userRepository.findByUsername("skatsi07");
        review.setUser(currentUser);

        if (review.getFoodItems() != null) {
            review.getFoodItems().removeIf(item -> item.getName() == null || item.getName().trim().isEmpty());
            for (FoodItem item : review.getFoodItems()) {
                item.setReview(review);
            }
        }

        Review savedReview = reviewRepository.save(review);

        // Process final list
        if (!validFiles.isEmpty()) {
            for (MultipartFile file : validFiles) {
                if (file != null && !file.isEmpty() && file.getOriginalFilename() != null) {
                    // Upload to Cloudinary
                    String photoUrl = fileUploader.uploadFile(file);

                    ReviewPhoto photo = new ReviewPhoto();
                    photo.setPhotoUrl(photoUrl);
                    photo.setReview(savedReview);

                    if (savedReview.getPhotos() == null) {
                        savedReview.setPhotos(new ArrayList<>());
                    }
                    savedReview.getPhotos().add(photo);
                }
            }
            reviewRepository.save(savedReview);
        }

        return "redirect:/";
    }

    // --- 4. HIDDEN EDIT PROFILE PAGE ---
    @GetMapping("/edit-profile")
    public String showEditProfile(Model model) {
        User user = userRepository.findByUsername("skatsi07");
        model.addAttribute("user", user);
        return "edit-profile";
    }

    // --- 6. HANDLE THE UPLOAD ---
    @PostMapping("/edit-profile/save")
    public String saveProfile(
            @ModelAttribute User user,
            @RequestParam("image") MultipartFile multipartFile) throws IOException {

        User existingUser = userRepository.findByUsername("skatsi07");
        existingUser.setBio(user.getBio());

        if (!multipartFile.isEmpty()) {
            String photoUrl = fileUploader.uploadFile(multipartFile);
            existingUser.setProfilePicUrl(photoUrl);
        }

        userRepository.save(existingUser);
        return "redirect:/";
    }

    // --- 5. SHOW LIST OF REVIEWS TO MANAGE ---
    @GetMapping("/manage-reviews")
    public String manageReviews(Model model) {
        User currentUser = userRepository.findByUsername("skatsi07");
        List<Review> myReviews = reviewRepository.findAllByUserOrderByDateDesc(currentUser);
        model.addAttribute("reviews", myReviews);
        return "manage-reviews";
    }

    // --- 6. SHOW THE EDIT FORM ---
    @GetMapping("/edit/{id}")
    public String showEditForm(@PathVariable("id") Long id, Model model) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid review Id:" + id));

        if (!review.getUser().getUsername().equals("skatsi07")) {
            return "redirect:/manage-reviews";
        }

        model.addAttribute("review", review);
        return "edit-review";
    }

    // --- 7. HANDLE THE UPDATE (FIXED FOR HIBERNATE ERROR) ---
    @PostMapping("/update")
    public String updateReview(
            @ModelAttribute Review formReview,
            @RequestParam("reviewImages") MultipartFile[] files,
            @RequestParam(value = "coverSelectionType", defaultValue = "none") String coverType,
            @RequestParam(value = "selectedExistingCoverId", required = false) Long existingCoverId,
            @RequestParam(value = "selectedNewCoverIndex", required = false) Integer newCoverIndex,
            // NEW PARAMETER for deletions
            @RequestParam(value = "deletedPhotoIds", required = false) String deletedPhotoIdsStr) throws IOException {

        // 1. Fetch Existing Review
        Review existingReview = reviewRepository.findById(formReview.getId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid review Id"));

        // 2. Update Standard Fields
        existingReview.setPlaceName(formReview.getPlaceName());
        existingReview.setDate(formReview.getDate());
        existingReview.setOverallRating(formReview.getOverallRating());
        existingReview.setCuisine(formReview.getCuisine());
        existingReview.setPricePerPerson(formReview.getPricePerPerson());
        existingReview.setOverallDesc(formReview.getOverallDesc());
        existingReview.setFoodScore(formReview.getFoodScore());
        existingReview.setServiceScore(formReview.getServiceScore());
        existingReview.setAmbianceScore(formReview.getAmbianceScore());
        existingReview.setInstagramUrl(formReview.getInstagramUrl());
        existingReview.setTiktokUrl(formReview.getTiktokUrl());

        // 3. Update Food Items
        existingReview.getFoodItems().clear();
        if (formReview.getFoodItems() != null) {
            formReview.getFoodItems().removeIf(item -> item.getName() == null || item.getName().trim().isEmpty());
            for (FoodItem item : formReview.getFoodItems()) {
                item.setReview(existingReview);
                existingReview.getFoodItems().add(item);
            }
        }

        // --- 4. PHOTO LOGIC ---

        // Start by making a COPY of the current DB photos
        List<ReviewPhoto> currentDbPhotos = new ArrayList<>(existingReview.getPhotos());

        // A. REMOVE DELETED PHOTOS (NEW LOGIC)
        // If the user clicked 'X' on any photos, remove them from our working list
        if (deletedPhotoIdsStr != null && !deletedPhotoIdsStr.isEmpty()) {
            List<Long> idsToRemove = Arrays.stream(deletedPhotoIdsStr.split(","))
                    .map(String::trim)
                    .map(Long::parseLong)
                    .toList();

            currentDbPhotos.removeIf(p -> idsToRemove.contains(p.getId()));
        }

        // B. Handle "Existing Photo Selected as Cover"
        List<ReviewPhoto> tempPhotoList = new ArrayList<>();

        if ("existing".equals(coverType) && existingCoverId != null) {
            ReviewPhoto selectedCover = currentDbPhotos.stream()
                    .filter(p -> p.getId().equals(existingCoverId))
                    .findFirst()
                    .orElse(null);

            if (selectedCover != null) {
                tempPhotoList.add(selectedCover); // Add cover first
                currentDbPhotos.remove(selectedCover); // Remove so it's not added again later
            }
        }

        // C. Add remaining existing photos
        tempPhotoList.addAll(currentDbPhotos);

        // D. Handle New Uploads
        if (files != null && files.length > 0) {
            List<MultipartFile> fileList = new ArrayList<>(Arrays.asList(files));
            fileList.removeIf(MultipartFile::isEmpty);

            if (!fileList.isEmpty()) {
                MultipartFile coverFile = null;

                if ("new".equals(coverType) && newCoverIndex != null
                        && newCoverIndex >= 0 && newCoverIndex < fileList.size()) {
                    coverFile = fileList.get(newCoverIndex);
                    fileList.remove((int) newCoverIndex);
                }

                if (coverFile != null) {
                    ReviewPhoto photo = saveFileToReview(coverFile, existingReview);
                    tempPhotoList.add(0, photo); // Insert at absolute beginning
                }

                for (MultipartFile f : fileList) {
                    ReviewPhoto photo = saveFileToReview(f, existingReview);
                    tempPhotoList.add(photo);
                }
            }
        }

        // E. Update DB (Clear and Refill to keep order)
        existingReview.getPhotos().clear();
        existingReview.getPhotos().addAll(tempPhotoList);

        reviewRepository.save(existingReview);

        return "redirect:/manage-reviews";
    }

    // Helper method to save file and create object
    private ReviewPhoto saveFileToReview(MultipartFile file, Review review) throws IOException {
        String photoUrl = fileUploader.uploadFile(file);

        ReviewPhoto photo = new ReviewPhoto();
        photo.setPhotoUrl(photoUrl);
        photo.setReview(review);

        return photo;
    }

    // --- 8. DELETE REVIEW ---
    @GetMapping("/delete/{id}")
    public String deleteReview(@PathVariable("id") Long id) {

        // 1. Find the review
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid review Id:" + id));

        // 2. Security Check (Only allow skatsi07 to delete)
        if (review.getUser().getUsername().equals("skatsi07")) {
            reviewRepository.delete(review);
        }

        // 3. Redirect back to the list
        return "redirect:/manage-reviews";
    }
}