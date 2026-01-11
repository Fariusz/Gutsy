import type { APIContext } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

/**
 * Authentication utilities for API endpoints
 * Handles Supabase session validation and user extraction
 */

/**
 * Extract and validate user authentication from API context
 * Returns user ID if authenticated, throws error if not
 */
export async function validateAuthToken(context: APIContext): Promise<string> {
  const supabase = context.locals.supabase as SupabaseClient<Database>;

  if (!supabase) {
    throw new AuthenticationError("Supabase client not available");
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new AuthenticationError("Failed to validate session");
  }

  if (!session || !session.user) {
    throw new AuthenticationError("Authentication required");
  }

  return session.user.id;
}

/**
 * Get user session without throwing errors
 * Returns null if not authenticated
 */
export async function getOptionalAuth(context: APIContext): Promise<string | null> {
  try {
    return await validateAuthToken(context);
  } catch {
    return null;
  }
}

/**
 * Custom authentication error class for better error handling
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Check if user has valid session and extract user data
 */
export async function getUserFromSession(context: APIContext) {
  const supabase = context.locals.supabase as SupabaseClient<Database>;

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    session,
  };
}
