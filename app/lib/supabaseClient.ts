import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xpypctupocfwwyoqhioi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweXBjdHVwb2Nmd3d5b3FoaW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwODI5MTIsImV4cCI6MjA4MzY1ODkxMn0.jssMOGLnB_ftUdYRSFXGf4q3wE4TzFzqtOHR7deEBAo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
