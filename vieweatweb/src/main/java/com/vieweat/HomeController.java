package com.vieweat;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.ArrayList;
import java.util.List;

@Controller
public class HomeController {

  @GetMapping("/")
  public String home(Model model) {
    List<Review> myReviews = new ArrayList<>();

    // Some fake data just to test out the website
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
        
    // Example of adding extra details (optional fields) easily:
    myReviews.add(Review.builder()
        .placeName("Taco Stand")
        .overallRating(5)
        .date("12/01/2025")
        .cuisine("Mexican") 
        .build());

    model.addAttribute("reviews", myReviews);
    return "index";
  }
}