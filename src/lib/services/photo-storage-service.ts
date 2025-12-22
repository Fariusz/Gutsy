import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

/**
 * Service for handling photo storage operations with Supabase Storage
 */
export class PhotoStorageService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Upload a base64 encoded photo to Supabase Storage
   * @param photoData - Base64 encoded image data
   * @param userId - User ID for organizing storage
   * @returns Storage path for the uploaded photo
   */
  async uploadPhoto(photoData: string, userId: string): Promise<string> {
    try {
      // Validate photo size (10MB limit)
      const sizeInBytes = (photoData.length * 3) / 4;
      const maxSizeBytes = 10 * 1024 * 1024; // 10MB

      if (sizeInBytes > maxSizeBytes) {
        throw new Error("Photo size exceeds 10MB limit");
      }

      // Extract MIME type and convert base64 to buffer
      const matches = photoData.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!matches?.length || matches.length !== 3) {
        throw new Error("Invalid base64 image format");
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      // Validate MIME type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(mimeType)) {
        throw new Error("Unsupported image format. Allowed: JPEG, PNG, WebP");
      }

      // Convert base64 to Uint8Array
      const buffer = Uint8Array.from(atob(base64Data), (c) => c.codePointAt(0) || 0);

      // Generate unique filename
      const fileExtension = mimeType.split("/")[1];
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const filePath = `meal-photos/${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { error } = await this.supabase.storage.from("meal-photos").upload(filePath, buffer, {
        contentType: mimeType,
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        throw new Error(`Photo upload failed: ${error.message}`);
      }

      return filePath;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Photo upload failed due to unknown error");
    }
  }

  /**
   * Generate a signed URL for accessing a stored photo
   * @param photoPath - Storage path of the photo
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Signed URL for photo access
   */
  async generateSignedUrl(photoPath: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await this.supabase.storage.from("meal-photos").createSignedUrl(photoPath, expiresIn);

    if (error || !data) {
      throw new Error(`Failed to generate signed URL: ${error?.message || "Unknown error"}`);
    }

    return data.signedUrl;
  }

  /**
   * Generate signed URLs for multiple photos in bulk
   * @param photoPaths - Array of storage paths for photos
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Map of photo paths to signed URLs
   */
  async generateSignedUrls(photoPaths: string[], expiresIn = 3600): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>();

    if (photoPaths.length === 0) {
      return urlMap;
    }

    try {
      // Process photos in parallel for better performance
      const signedUrlPromises = photoPaths.map(async (path) => {
        try {
          const { data, error } = await this.supabase.storage.from("meal-photos").createSignedUrl(path, expiresIn);

          if (!error && data?.signedUrl) {
            return { path, url: data.signedUrl };
          }
          return null;
        } catch {
          // If individual URL generation fails, skip it
          return null;
        }
      });

      const results = await Promise.all(signedUrlPromises);

      // Build the map from successful results
      results.forEach((result) => {
        if (result) {
          urlMap.set(result.path, result.url);
        }
      });

      return urlMap;
    } catch (error) {
      // If bulk operation fails entirely, try individual generation
      console.warn("Bulk signed URL generation failed, falling back to individual generation");

      for (const path of photoPaths) {
        try {
          const url = await this.generateSignedUrl(path, expiresIn);
          urlMap.set(path, url);
        } catch {
          // Skip failed individual URLs
          continue;
        }
      }

      return urlMap;
    }
  }
}
