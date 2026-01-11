import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

export const mockSupabaseClient: SupabaseClient = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
  rpc: vi.fn(),
} as any;

export const createMockSession = (userId = "test-user-id") => ({
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  expires_at: Date.now() + 3600 * 1000,
  token_type: "bearer",
  user: {
    id: userId,
    aud: "authenticated",
    role: "authenticated",
    email: "test@example.com",
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
});

export const createMockAPIContext = (session?: any) => ({
  locals: {
    supabase: {
      ...mockSupabaseClient,
      auth: {
        ...mockSupabaseClient.auth,
        getSession: vi.fn().mockResolvedValue({
          data: { session },
          error: null,
        }),
        getUser: vi.fn().mockResolvedValue({
          data: { user: session?.user || null },
          error: null,
        }),
      },
    },
  },
  request: {
    headers: new Headers(),
    json: vi.fn(),
  },
} as any);