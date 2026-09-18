// JOO-J: Anomalous Observation Organization - Japan Branch
// Supabase config (shared free-tier project; table prefix "joo_" is exclusive to this site)
const JOO_SUPABASE_URL = 'https://kifnzvktwbomxthzvvgy.supabase.co';
const JOO_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZm56dmt0d2JvbXh0aHp2dmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzgxMzgsImV4cCI6MjA5MzQxNDEzOH0.M7nXP-u--6J_6rRpgz1cJj21_7KX6MtfTmZy77Xf_IE';

// kaikomziu.github.io is a shared origin across all games, so a real login session from
// another game on this Supabase project can leak into localStorage here and get sent as an
// "authenticated" JWT instead of anon. Force anon explicitly and never persist/pick up a session.
const jooSupabase = supabase.createClient(JOO_SUPABASE_URL, JOO_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { headers: { Authorization: 'Bearer ' + JOO_SUPABASE_ANON_KEY } },
});
