import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_PUBLIC_KEY ?? import.meta.env.SUPABASE_KEY;

export const createSupabaseClient = () => {
  const url = supabaseUrl;
  const key = supabaseAnonKey;
  
  if (!url || !key) {
    throw new Error(`Missing Supabase environment variables. URL: ${!!url}, Key: ${!!key}. Check if SUPABASE_URL and SUPABASE_PUBLIC_KEY (or SUPABASE_KEY) are set.`);
  }
  return createClient<Database>(url, key);
};
