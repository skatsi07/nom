package com.vieweat;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import lombok.RequiredArgsConstructor;

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
    List<Review> allReviews = reviewRepository.findAll();
    model.addAttribute("reviews", allReviews);
    return "all-reviews";
  }

  // --- 3. SHOW THE "ADD REVIEW" FORM ---
  @GetMapping("/add")
  public String showAddReviewForm(Model model) {
      model.addAttribute("review", new Review());
      return "add-review";
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
}
