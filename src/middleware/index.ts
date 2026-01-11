import { defineMiddleware } from "astro:middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "../db/database.types.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // Track pending cookie operations
  const pendingCookies: (() => void)[] = [];
  let response: Response;

  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL!, import.meta.env.SUPABASE_KEY!, {
    cookies: {
      get(key: string) {
        return context.cookies.get(key)?.value;
      },
      set(key: string, value: string, options: CookieOptions) {
        // Queue cookie operations to be executed before response is sent
        pendingCookies.push(() => {
          try {
            context.cookies.set(key, value, {
              ...options,
              httpOnly: options.httpOnly ?? true,
              secure: options.secure ?? true,
              sameSite: options.sameSite ?? 'lax',
            });
          } catch (error) {
            console.warn(`Failed to set cookie ${key} (response may have been sent):`, error);
          }
        });
      },
      remove(key: string, options: CookieOptions) {
        // Queue cookie operations to be executed before response is sent
        pendingCookies.push(() => {
          try {
            context.cookies.delete(key, {
              ...options,
              httpOnly: options.httpOnly ?? true,
              secure: options.secure ?? true,
              sameSite: options.sameSite ?? 'lax',
            });
          } catch (error) {
            console.warn(`Failed to remove cookie ${key} (response may have been sent):`, error);
          }
        });
      },
    },
  });

  context.locals.supabase = supabase;

  // Execute the route handler
  response = await next();

  // Execute any pending cookie operations before returning response
  pendingCookies.forEach(operation => operation());

  return response;
});
