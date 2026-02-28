export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all complaints (or filter by status)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const lowConfidence = searchParams.get('lowConfidence');

        let query = supabase.from('complaints').select('*').order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (lowConfidence === 'true') {
            // In PostgreSQL, you can use less than operator for numeric
            query = query.lt('confidence_score', 0.70);
            // We also look for Admin Review department basically
        }

        let dbData = [];
        try {
            // Force a 3-second timeout on the DB connection to trigger offline fallback
            const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) =>
                setTimeout(() => reject(new Error('DB Connection Timeout')), 3000)
            );

            const { data, error } = await Promise.race([query, timeoutPromise]);
            if (!error && data) {
                dbData = data;
            }
        } catch (e) {
            console.warn("Supabase fetch failed, using offline mock data");
        }

        if (dbData.length === 0) {
            dbData = [
                { id: 'm1', title: 'Pothole on Panaji Main Road', category: 'Road', status: 'Submitted', confidence_score: 0.8 },
                { id: 'm2', title: 'Beach waste at Calangute', category: 'Garbage', status: 'Resolved', confidence_score: 0.9 },
                { id: 'm3', title: 'Water pipe burst in Margao', category: 'Water', status: 'Submitted', confidence_score: 0.85 },
                { id: 'm4', title: 'Streetlight out in Vasco', category: 'Electrical', status: 'In Progress', confidence_score: 0.95 },
                { id: 'm5', title: 'Large pothole in Mapusa market', category: 'Road', status: 'Submitted', confidence_score: 0.4 },
                { id: 'm6', title: 'Overflowing dumpster at Baga', category: 'Garbage', status: 'Submitted', confidence_score: 0.99 },
                { id: 'm7', title: 'Missed garbage pickup in Ponda', category: 'Garbage', status: 'Resolved', confidence_score: 0.92 }
            ];

            if (status) {
                dbData = dbData.filter(c => c.status === status);
            }
            if (lowConfidence === 'true') {
                dbData = dbData.filter(c => c.confidence_score < 0.70);
            }
        }

        return NextResponse.json({ complaints: dbData });
    } catch (err) {
        console.error('Fetch API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
