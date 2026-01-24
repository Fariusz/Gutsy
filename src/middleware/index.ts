import { defineMiddleware } from "astro:middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { Database } from "../db/database.types.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.SUPABASE_PUBLIC_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables in middleware:", {
        url: !!supabaseUrl,
        key: !!supabaseAnonKey,
      });
      return new Response("Configuration Error: Missing Supabase environment variables. Please check your Netlify settings.", { status: 500 });
    }

    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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
  } catch (error) {
    console.error("Critical error in middleware:", error);
    return new Response(`Internal Server Error in Middleware: ${error instanceof Error ? error.message : "Unknown error"}`, { status: 500 });
  }
});
