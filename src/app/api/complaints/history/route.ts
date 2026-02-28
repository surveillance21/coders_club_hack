import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        let dbData = [];
        try {
            // Fetch highest/latest 50 complaints
            const { data, error } = await supabase
                .from('complaints')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (!error && data) {
                dbData = data;
            }
        } catch (e) {
            console.warn("Supabase fetch failed, falling back to mock history data.");
        }

        if (dbData.length === 0) {
            // Offline Mock Data Fallback
            dbData = [
                {
                    id: '1a2b3c4d-1234-5678-9101-abcdef123456',
                    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                    title: 'Massive Pothole on 5th Avenue',
                    description: 'Large pothole causing traffic slowdown.',
                    category: 'Road Damage',
                    status: 'Resolved',
                    location: '5th Ave & Main St'
                },
                {
                    id: '2b3c4d5e-2345-6789-1011-bcdefg234567',
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                    title: 'Broken Streetlight',
                    description: 'Pitch black road at night, dangerous for pedestrians.',
                    category: 'Electrical',
                    status: 'Under Review',
                    location: 'Industrial District'
                },
                {
                    id: '3c4d5e6f-3456-7890-1112-cdefgh345678',
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
                    title: 'Burst Water Pipe',
                    description: 'Water is flooding the sidewalk.',
                    category: 'Water Supply',
                    status: 'In Progress',
                    location: 'Residential North Blvd'
                },
                {
                    id: '4d5e6f7g-4567-8901-1213-defghi456789',
                    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
                    title: 'Fallen Tree Branch',
                    description: 'Branch blocking the bike lane completely.',
                    category: 'Public Safety',
                    status: 'Submitted',
                    location: 'Downtown Ward Park'
                }
            ];
        }

        return NextResponse.json({ complaints: dbData });
    } catch (err) {
        console.error('History API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
