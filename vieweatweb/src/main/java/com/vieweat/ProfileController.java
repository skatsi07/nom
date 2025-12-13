package com.vieweat;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class ProfileController {

  private final ReviewRepository reviewRepository;
  private final UserRepository userRepository;

  // --- 1. HOME PAGE (Recent 5 Reviews) ---
  @GetMapping("/")
  public String home(Model model) {
      // 1. Fetch YOUR profile info first
      User myProfile = userRepository.findByUsername("skatsi07");

      // 2. Fetch the reviews specifically linked to YOU
      List<Review> myReviews = reviewRepository.findTop5ByUserOrderByDateDesc(myProfile);
      
      model.addAttribute("reviews", myReviews);
      model.addAttribute("user", myProfile);
      
      return "profile";
  }

  // --- 2. ALL REVIEWS PAGE ---
  @GetMapping("/reviews")
  public String getAllReviews(Model model) {
      
      // 1. Fetch YOUR profile (So the header knows who you are)
      User myProfile = userRepository.findByUsername("skatsi07");

      // 2. Fetch ALL reviews specifically linked to YOU
      // (Using the new method we just created)
      List<Review> allReviews = reviewRepository.findAllByUserOrderByDateDesc(myProfile);

      // 3. Add data to the model so HTML can use it
      model.addAttribute("reviews", allReviews);
      model.addAttribute("user", myProfile); // Passing 'user' makes the header dynamic
      
      return "all-reviews";
  }

  // --- 3. SHOW THE "ADD REVIEW" FORM ---
  @PostMapping("/add")
  public String addReview(
          @ModelAttribute Review review,
          @RequestParam("reviewImages") MultipartFile[] files) throws IOException { // 1. Accept files array
    
    // A. FIND USER & LINK
    User currentUser = userRepository.findByUsername("skatsi07");
    review.setUser(currentUser);

    // B. CLEAN FOOD ITEMS (Remove blanks)
    review.getFoodItems().removeIf(item -> item.getName() == null || item.getName().trim().isEmpty());
    for (FoodItem item : review.getFoodItems()) {
        item.setReview(review);
    }
    
    // C. SAVE REVIEW FIRST (Crucial step!)
    // We must save it now to generate the 'id' (e.g., 50) needed for the folder name
    Review savedReview = reviewRepository.save(review);

    // D. PROCESS PHOTOS (If any)
    if (files != null && files.length > 0) {
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String fileName = StringUtils.cleanPath(file.getOriginalFilename());
                
                // 1. Create the database object
                ReviewPhoto photo = new ReviewPhoto();
                photo.setPhotoUrl("/review-photos/" + savedReview.getId() + "/" + fileName);
                photo.setReview(savedReview); // Link back to review
                
                // 2. Add to the list
                savedReview.getPhotos().add(photo);

                // 3. Save file to Hard Drive (review-photos/50/pizza.jpg)
                String uploadDir = "review-photos/" + savedReview.getId();
                FileUploadUtil.saveFile(uploadDir, fileName, file);
            }
        }
        // Save again to update the photos list in DB
        reviewRepository.save(savedReview);
    }
    return "redirect:/";
  }

  // --- 4. SAVE THE REVIEW (Cleaning up Review) ---
  @PostMapping("/add")
  public String addReview(@ModelAttribute Review review) {
    
    // A. FIND USER
    String myUsername = "skatsi07";
    User currentUser = userRepository.findByUsername(myUsername);
    review.setUser(currentUser);

    // B. CLEAN UP THE FOOD ITEMS LIST
    // 1. Remove any item that has no Name (User left it blank)
    review.getFoodItems().removeIf(item -> item.getName() == null || item.getName().trim().isEmpty());

    // 2. Link the remaining valid items to this review
    // (We must do this manually because the HTML form doesn't know about the Review ID yet)
    for (FoodItem item : review.getFoodItems()) {
        item.setReview(review);
    }
    
    // C. SAVE TO MYSQL
    // This will now only save the Review + the non-empty FoodItems
    reviewRepository.save(review);

    return "redirect:/";
  }
  // --- 5. HIDDEN EDIT PROFILE PAGE ---
  @GetMapping("/edit-profile")
  public String showEditProfile(Model model) {
      // Fetch 'You' so we can fill the form with your current bio/pic
      User user = userRepository.findByUsername("skatsi07");
      model.addAttribute("user", user);
      return "edit-profile";
  }

  // --- 6. HANDLE THE UPLOAD ---
  @PostMapping("/edit-profile/save")
  public String saveProfile(
        @ModelAttribute User user,
        @RequestParam("image") MultipartFile multipartFile) throws IOException {
    
    // 1. Fetch the real user from DB (to prevent ID tampering)
    User existingUser = userRepository.findByUsername("skatsi07");

    // 2. Update Bio
    existingUser.setBio(user.getBio());

    // 3. Handle Image Upload (If they chose one)
    if (!multipartFile.isEmpty()) {
        String fileName = StringUtils.cleanPath(multipartFile.getOriginalFilename());
        
        // Set the path that the HTML will use to find the image
        existingUser.setProfilePicUrl("/user-photos/" + existingUser.getId() + "/" + fileName);

        // Save the actual file to your project folder: user-photos/{id}/
        String uploadDir = "user-photos/" + existingUser.getId();
        FileUploadUtil.saveFile(uploadDir, fileName, multipartFile);
    }

    userRepository.save(existingUser);

    return "redirect:/";
  }
}
