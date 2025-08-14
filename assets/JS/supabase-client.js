// import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rajiiuqbkptwnbuwdgvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhamlpdXFia3B0d25idXdkZ3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMTA4NTUsImV4cCI6MjA1OTg4Njg1NX0.3Yc9IKmXM6AaceWlasAqdSVQSRhZTRXYzRQyGI1RucI';

window.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// export default supabase;
