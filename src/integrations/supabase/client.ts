import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://mwpyoxrvdlbpjnkrwdxu.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cHlveHJ2ZGxicGpua3J3ZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MjQ1MDMsImV4cCI6MjA1MDAwMDUwM30.3wCcOdFN8w7T-NiVNc2rJU9Gv5YiAAVpE_-MUAMLEqY"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)