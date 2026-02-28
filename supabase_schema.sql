-- Supabase Schema for AI-Driven Grievance Resolution Pipeline MVP

-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    location TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    category TEXT,
    department TEXT,
    confidence_score NUMERIC,
    gemini_reasoning TEXT,
    status TEXT DEFAULT 'Submitted' NOT NULL,
    resolution_notes TEXT
);

-- Note: In a production environment, you would also set up Row Level Security (RLS) policies here.
-- For the MVP, we assume authorized API interactions from the Next.js backend, and we might allow public inserts from the frontend if needed, but going via the Next.js API route is better for keeping the Gemini API secure anyway.

-- Enable Row Level Security (RLS)
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (so citizens can submit from the frontend via API or directly if anon key allows).
-- Actually, since submissions go through Next.js API route to use Gemini, we can use the Service Role key in the API or just rely on Anon Key if policy allows.
CREATE POLICY "Enable insert for public" ON complaints FOR INSERT WITH CHECK (true);

-- Allow public read (for demo purposes)
CREATE POLICY "Enable read access for all" ON complaints FOR SELECT USING (true);

-- Allow public updates (for demo admin panel purposes)
CREATE POLICY "Enable update for all" ON complaints FOR UPDATE USING (true);
