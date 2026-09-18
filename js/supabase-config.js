// JOO-J: Anomalous Observation Organization - Japan Branch
// Supabase config (shared free-tier project; table prefix "joo_" is exclusive to this site)
const JOO_SUPABASE_URL = 'https://kifnzvktwbomxthzvvgy.supabase.co';
const JOO_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZm56dmt0d2JvbXh0aHp2dmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzgxMzgsImV4cCI6MjA5MzQxNDEzOH0.M7nXP-u--6J_6rRpgz1cJj21_7KX6MtfTmZy77Xf_IE';

const jooSupabase = supabase.createClient(JOO_SUPABASE_URL, JOO_SUPABASE_ANON_KEY);
