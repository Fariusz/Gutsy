import { defineMiddleware } from "astro:middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { Database } from "../db/database.types.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_PUBLIC_KEY, {
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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    context.locals.session = session;
    context.locals.user = session.user;
  }

  const protectedRoutes = ["/logs", "/triggers"];
  if (!session && protectedRoutes.some((route) => context.url.pathname.startsWith(route))) {
    return context.redirect("/login");
  }

  const authRoutes = ["/login", "/register"];
  if (session && authRoutes.includes(context.url.pathname)) {
    return context.redirect("/logs");
  }

  const response = await next();
  return response;
});
