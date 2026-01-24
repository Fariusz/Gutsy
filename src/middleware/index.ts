import { defineMiddleware } from "astro:middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { Database } from "../db/database.types.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    // Quick health check path
    if (context.url.pathname === "/health-check") {
      return new Response("Middleware is active", { status: 200 });
    }

    const supabaseUrl = import.meta.env.SUPABASE_URL ?? process.env.SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.SUPABASE_PUBLIC_KEY ?? process.env.SUPABASE_PUBLIC_KEY ?? process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables in middleware");
      return new Response(`Configuration Error: Missing Supabase environment variables. URL present: ${!!supabaseUrl}, Key present: ${!!supabaseAnonKey}. 

I found "SUPABASE_KEY" in your Netlify settings, but the code was looking for "SUPABASE_PUBLIC_KEY". I've updated the code to look for both, but for best practice, you should rename it to SUPABASE_PUBLIC_KEY in Netlify.`, { status: 200 });
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

    // Optional: add a way to see what's in locals for debugging
    if (context.url.pathname === "/debug-locals") {
       return new Response(`Locals Supabase present: ${!!context.locals.supabase}`, { status: 200 });
    }

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

    return await next();
  } catch (error) {
    console.error("Critical error in middleware:", error);
    return new Response(`Critical Middleware Error: ${error instanceof Error ? error.message : "Unknown error"}\n\nStack: ${error instanceof Error ? error.stack : ""}`, { status: 200 });
  }
});
