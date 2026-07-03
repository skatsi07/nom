package com.vieweat;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long>, JpaSpecificationExecutor<Review> {

    // Used for the Home Page (Limit 5)
    List<Review> findTop5ByUserOrderByDateDesc(User user);

    // --- NEW METHOD ---
    // Used for the "All Reviews" page.
    // Finds EVERYTHING by this user, newest first.
    Page<Review> findAllByUserOrderByDateDesc(User user, Pageable pageable);

    // Finds reviews by this user containing the specific tag, newest first.
    Page<Review> findAllByUserAndTagsContainingIgnoreCaseOrderByDateDesc(User user, String tag, Pageable pageable);
}