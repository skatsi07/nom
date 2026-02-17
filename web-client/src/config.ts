
// This file centralizes the API configuration.
// In development, the proxy in vite.config.ts handles requests to /api, so we can use an empty string.
// In production, we need to point to the actual backend URL.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
