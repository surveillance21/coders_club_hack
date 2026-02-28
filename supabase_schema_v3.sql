-- Supabase Schema for AI-Driven Grievance Resolution Pipeline V3

-- 1. Create the `zones` table
CREATE TABLE IF NOT EXISTS zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    total_complaints INTEGER DEFAULT 0,
    active_complaints INTEGER DEFAULT 0,
    resolved_complaints INTEGER DEFAULT 0,
    last_24h_complaints INTEGER DEFAULT 0,
    high_severity_count INTEGER DEFAULT 0,
    sla_breaches INTEGER DEFAULT 0,
    risk_score NUMERIC DEFAULT 0.0,
    risk_percentage INTEGER DEFAULT 0,
    risk_level TEXT DEFAULT 'Green', -- Green, Yellow, Red
    boundaries JSONB -- Stores GeoJSON or lat/lng bounds
);

-- 2. Modify `complaints` table to support V3 features
ALTER TABLE complaints
ADD COLUMN IF NOT EXISTS lat NUMERIC,
ADD COLUMN IF NOT EXISTS lng NUMERIC,
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id);

-- Enable RLS for zones
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- Allow public read for zones (for the heatmap)
CREATE POLICY "Enable read access for all on zones" ON zones FOR SELECT USING (true);
CREATE POLICY "Enable updates for all on zones" ON zones FOR UPDATE USING (true);

-- 3. Seed Mock Zones for the Demo
-- Let's seed 3 wards with random default stats for the admin command center map.
INSERT INTO zones (name, total_complaints, active_complaints, resolved_complaints, last_24h_complaints, high_severity_count, sla_breaches, risk_percentage, risk_level, boundaries)
VALUES 
('Downtown Ward', 145, 12, 133, 4, 2, 1, 45, 'Yellow', '{"lat": 40.7128, "lng": -74.0060}'::jsonb),
('Industrial District', 89, 25, 64, 15, 8, 4, 85, 'Red', '{"lat": 40.7200, "lng": -74.0100}'::jsonb),
('Residential North', 34, 2, 32, 1, 0, 0, 15, 'Green', '{"lat": 40.7300, "lng": -73.9900}'::jsonb)
ON CONFLICT DO NOTHING;
