package com.vieweat;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.ArrayList;
import java.util.List;

@Controller
public class ProfileController {

  @GetMapping("/")
  public String home(Model model) {
    List<Review> myReviews = new ArrayList<>();

    // Data for the Profile Page
    myReviews.add(Review.builder()
        .placeName("Joe's Pizza")
        .overallRating(5)
        .date("12/12/2025")
        .build());

    myReviews.add(Review.builder()
        .placeName("Sushi World")
        .overallRating(4)
        .date("12/10/2025")
        .build());

    myReviews.add(Review.builder()
        .placeName("Burger Joint")
        .overallRating(3)
        .date("12/08/2025")
        .build());
        
    myReviews.add(Review.builder()
        .placeName("Taco Stand")
        .overallRating(5)
        .date("12/01/2025")
        .cuisine("Mexican") 
        .instagramUrl("https://instagram.com")
        .build());

    model.addAttribute("reviews", myReviews);
    return "profile";
  }

  @GetMapping("/reviews")
  public String getAllReviews(Model model) {
    List<Review> allReviews = new ArrayList<>();

    // --- FIX: Use .builder() here too! ---
    
    // Original Items
    allReviews.add(Review.builder()
        .placeName("Joe's Pizza")
        .overallRating(5)
        .date("12/12/2025")
        .build());

    allReviews.add(Review.builder()
        .placeName("Sushi World")
        .overallRating(4)
        .date("12/10/2025")
        .build());

    allReviews.add(Review.builder()
        .placeName("Burger Joint")
        .overallRating(3)
        .date("12/08/2025")
        .build());

    allReviews.add(Review.builder()
        .placeName("Taco Stand")
        .overallRating(5)
        .date("12/01/2025")
        .build());

    // New Items (Past History)
    allReviews.add(Review.builder()
        .placeName("Pasta House")
        .overallRating(4)
        .date("11/28/2025")
        .build());

    allReviews.add(Review.builder()
        .placeName("Taco Stand")
        .overallRating(5)
        .date("12/01/2025")
        .cuisine("Mexican") 
        .instagramUrl("https://instagram.com")
        .build());

    model.addAttribute("reviews", allReviews);
    
    return "all-reviews";
  }
}