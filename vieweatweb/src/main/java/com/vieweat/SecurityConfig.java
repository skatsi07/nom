package com.vieweat;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests((requests) -> requests
                // 1. PUBLIC PAGES (Everyone can see these)
                .requestMatchers("/", "/reviews").permitAll()
                
                // 2. EVERYTHING ELSE (Requires Login)
                // This includes "/add" and the POST action to save the review
                .anyRequest().authenticated()
            )
            .formLogin((form) -> form
                // This enables the default login page provided by Spring
                .permitAll()
            )
            .logout((logout) -> logout.permitAll());

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        // 3. DEFINE THE SINGLE ADMIN USER (YOU)
        // Since it's just you for now, we can hardcode this here safely.
        // In the future, we will connect this to your MySQL database.
        
        UserDetails admin = User.builder()
            .username("skatsi07")       // Your Login Username
            .password("{noop}youcannotlogintomywebsitelol42983")    // Your Login Password (Change this!)
            .roles("ADMIN")
            .build();

        return new InMemoryUserDetailsManager(admin);
    }
}
