package com.vieweat;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MyUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Try to find the user in MySQL
        User myDbUser = userRepository.findByUsername(username);

        if (myDbUser == null) {
            throw new UsernameNotFoundException("User not found: " + username);
        }

        // 2. Convert your Database User into a Spring Security User
        // Note: We use the full class path for 'User' builder to avoid confusion 
        // because you have your own 'User' class and Spring has one too.
        return org.springframework.security.core.userdetails.User.builder()
                .username(myDbUser.getUsername())
                .password(myDbUser.getPassword()) // This passes "{noop}..." to Spring
                .roles("ADMIN") // For now, everyone in the DB gets Admin power
                .build();
    }
}
