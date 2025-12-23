package com.vieweat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
public class ViewEatApplication {

	public static void main(String[] args) {
		// Load .env file
		// We try to load from the current directory first, or "ViewEatWeb" if running
		// from root
		try {
			// Load .env file
			Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
			dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
		} catch (Exception e) {
			// Ignore if .env fails to load
		}

		SpringApplication.run(ViewEatApplication.class, args);
	}

}
