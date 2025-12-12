package com.vieweat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    // Used for the Home Page (Limit 5)
    List<Review> findTop5ByUserOrderByDateDesc(User user);

    // --- NEW METHOD ---
    // Used for the "All Reviews" page. 
    // Finds EVERYTHING by this user, newest first.
    List<Review> findAllByUserOrderByDateDesc(User user);
}