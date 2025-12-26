import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateAuthToken,
  getOptionalAuth,
  getUserFromSession,
  AuthenticationError,
} from "./auth-helpers";
import { createMockAPIContext, createMockSession } from "../../test/mocks/supabase";

describe("auth-helpers", () => {
  describe("validateAuthToken", () => {
    it("should return user ID when session is valid", async () => {
      const session = createMockSession("test-user-123");
      const context = createMockAPIContext(session);
      
      const userId = await validateAuthToken(context);
      expect(userId).toBe("test-user-123");
    });

    it("should throw AuthenticationError when no session", async () => {
      const context = createMockAPIContext(null);
      
      await expect(validateAuthToken(context)).rejects.toThrow(AuthenticationError);
      await expect(validateAuthToken(context)).rejects.toThrow("Authentication required");
    });

    it("should throw AuthenticationError when supabase client is missing", async () => {
      const context = { locals: {} } as any;
      
      await expect(validateAuthToken(context)).rejects.toThrow(AuthenticationError);
      await expect(validateAuthToken(context)).rejects.toThrow("Supabase client not available");
    });

    it("should throw AuthenticationError when session fetch fails", async () => {
      const context = createMockAPIContext();
      context.locals.supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error("Session fetch failed"),
      });
      
      await expect(validateAuthToken(context)).rejects.toThrow(AuthenticationError);
      await expect(validateAuthToken(context)).rejects.toThrow("Failed to validate session");
    });
  });

  describe("getOptionalAuth", () => {
    it("should return user ID when authenticated", async () => {
      const session = createMockSession("test-user-123");
      const context = createMockAPIContext(session);
      
      const userId = await getOptionalAuth(context);
      expect(userId).toBe("test-user-123");
    });

    it("should return null when not authenticated", async () => {
      const context = createMockAPIContext(null);
      
      const userId = await getOptionalAuth(context);
      expect(userId).toBeNull();
    });

    it("should return null when authentication fails", async () => {
      const context = { locals: {} } as any;
      
      const userId = await getOptionalAuth(context);
      expect(userId).toBeNull();
    });
  });

  describe("getUserFromSession", () => {
    it("should return user data when session is valid", async () => {
      const session = createMockSession("test-user-123");
      const context = createMockAPIContext(session);
      
      const userData = await getUserFromSession(context);
      expect(userData).toEqual({
        id: "test-user-123",
        email: "test@example.com",
        session,
      });
    });

    it("should return null when no session", async () => {
      const context = createMockAPIContext(null);
      
      const userData = await getUserFromSession(context);
      expect(userData).toBeNull();
    });

    it("should return null when session fetch fails", async () => {
      const context = createMockAPIContext();
      context.locals.supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error("Session fetch failed"),
      });
      
      const userData = await getUserFromSession(context);
      expect(userData).toBeNull();
    });
  });

  describe("AuthenticationError", () => {
    it("should create error with correct name and message", () => {
      const error = new AuthenticationError("Test auth error");
      
      expect(error.name).toBe("AuthenticationError");
      expect(error.message).toBe("Test auth error");
      expect(error).toBeInstanceOf(Error);
    });
  });
});