import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ljqkrzikddhaltdxlpfj.supabase.co";

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_x2X6sWuG5LUzFgq5rNJ8gw_LIia46ig";

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);
