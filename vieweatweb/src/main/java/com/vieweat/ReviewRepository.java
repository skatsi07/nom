package com.vieweat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    // OLD: Finds newest reviews from ANYONE (Delete or ignore this)
    // List<Review> findTop5ByOrderByDateDesc();

    // NEW: Finds newest reviews specifically for a given User
    List<Review> findTop5ByUserOrderByDateDesc(User user);
}