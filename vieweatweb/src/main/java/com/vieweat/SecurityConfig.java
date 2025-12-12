package com.vieweat;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests((requests) -> requests
                // 1. PUBLIC PAGES (Note: Added /css/** and /images/** so styles verify load)
                .requestMatchers("/", "/reviews", "/css/**", "/images/**").permitAll()
                
                // 2. EVERYTHING ELSE (Requires Login)
                .anyRequest().authenticated()
            )
            .formLogin((form) -> form
                .permitAll()
            )
            .logout((logout) -> logout.permitAll());

        return http.build();
    }