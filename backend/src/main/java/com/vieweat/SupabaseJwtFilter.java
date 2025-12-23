package com.vieweat;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

@Component
public class SupabaseJwtFilter extends OncePerRequestFilter {

    @org.springframework.beans.factory.annotation.Value("${supabase.jwt-secret}")
    private String supabaseJwtSecret;

    @org.springframework.beans.factory.annotation.Value("${supabase.url}")
    private String supabaseUrl;

    @org.springframework.beans.factory.annotation.Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    public SupabaseJwtFilter() {
        // Dependencies are injected by Spring after construction
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);

        try {
            // Validate Token by calling Supabase Auth API directly
            // This avoids algorithm mismatch issues (ES256 vs HS256) and key management
            // headaches.

            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest authRequest = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(supabaseUrl + "/auth/v1/user"))
                    .header("Authorization", "Bearer " + token)
                    .header("apikey", supabaseAnonKey)
                    .GET()
                    .build();

            java.net.http.HttpResponse<String> authResponse = client.send(authRequest,
                    java.net.http.HttpResponse.BodyHandlers.ofString());

            if (authResponse.statusCode() == 200) {
                // Manually parse JSON to extract "id" to avoid conflicting Jackson imports
                String responseBody = authResponse.body();
                // Assumes format: {..."id":"<UUID>"...}
                String userId = null;
                if (responseBody.contains("\"id\":\"")) {
                    int start = responseBody.indexOf("\"id\":\"") + 6;
                    int end = responseBody.indexOf("\"", start);
                    userId = responseBody.substring(start, end);
                }

                System.out.println("SupabaseJwtFilter: Token validated via API for User ID: " + userId);

                if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userId, null, Collections.emptyList());

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } else {
                System.err.println("SupabaseJwtFilter: Token validation failed. Status: " + authResponse.statusCode());
                // System.err.println("Response: " + authResponse.body());
            }

        } catch (Exception e) {
            System.err.println("SupabaseJwtFilter: Verification Error: " + e.getMessage());
            e.printStackTrace();
        }

        chain.doFilter(request, response);
    }
}
