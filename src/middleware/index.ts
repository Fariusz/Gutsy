import { defineMiddleware } from "astro:middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "../db/database.types.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      get(key: string) {
        return context.cookies.get(key)?.value;
      },
      set(key: string, value: string, options: CookieOptions) {
        context.cookies.set(key, value, options);
      },
      remove(key: string, options: CookieOptions) {
        context.cookies.delete(key, options);
      },
    },
  });

  context.locals.supabase = supabase;

  return next();
});
