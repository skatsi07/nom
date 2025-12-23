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
			String envDir = "./ViewEatWeb";
			java.io.File envInSubDir = new java.io.File(envDir, ".env");

			Dotenv dotenv;
			if (envInSubDir.exists()) {
				dotenv = Dotenv.configure().directory(envDir).ignoreIfMissing().load();
			} else {
				dotenv = Dotenv.configure().ignoreIfMissing().load();
			}

			dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
		} catch (Exception e) {
			// Ignore if .env fails to load
		}

		SpringApplication.run(ViewEatApplication.class, args);
	}

}
