package com.vieweat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Used to find "you" so we can link the review
    User findByUsername(String username);

    // Used to look up user by the UID in the JWT token
    User findBySupabaseUid(String supabaseUid);
}
