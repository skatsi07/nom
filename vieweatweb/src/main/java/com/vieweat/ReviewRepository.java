package com.vieweat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    // This gives us methods like findAll(), save(), delete(), etc. automatically!
    
    // We can also define custom queries easily:
    // This finds the 5 most recent reviews for your main profile page
    List<Review> findTop5ByOrderByDateDesc();
}
