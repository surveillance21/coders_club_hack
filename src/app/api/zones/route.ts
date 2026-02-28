export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to calculate risk
const calculateRisk = (z: any) => {
    // riskScore = (totalComplaints * 1) + (highSeverity * 3) + (recentComplaints * 2) + (slaBreaches * 2)
    const score = (z.total_complaints * 1) + (z.high_severity_count * 3) + (z.last_24h_complaints * 2) + (z.sla_breaches * 2);

    // Normalize to 0-100 (Assuming max reasonable score for a zone for the MVP is ~200)
    let percentage = Math.min(Math.round((score / 200) * 100), 100);
    if (percentage < 5 && z.total_complaints > 0) percentage = 15; // Give it some base visual

    let level = 'Green';
    if (percentage > 30) level = 'Yellow';
    if (percentage > 65) level = 'Red';

    return { score, percentage, level };
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const riskLevel = searchParams.get('riskLevel');

        let query = supabase.from('zones').select('*');

        if (riskLevel) {
            query = query.eq('risk_level', riskLevel);
        }

        // Attempt DB fetch
        let dbData = [];
        try {
            const { data, error } = await query;
            if (!error && data) {
                dbData = data;
            }
        } catch (e) {
            console.warn("Supabase fetch failed, using offline mock data");
        }

        // Offline Mock Fallback if DB is unreachable
        if (dbData.length === 0) {
            dbData = [
                { id: '1', name: 'Downtown Ward', total_complaints: 145, active_complaints: 12, resolved_complaints: 133, last_24h_complaints: 4, high_severity_count: 2, sla_breaches: 1 },
                { id: '2', name: 'Industrial District', total_complaints: 89, active_complaints: 25, resolved_complaints: 64, last_24h_complaints: 15, high_severity_count: 8, sla_breaches: 4 },
                { id: '3', name: 'Residential North', total_complaints: 34, active_complaints: 2, resolved_complaints: 32, last_24h_complaints: 1, high_severity_count: 0, sla_breaches: 0 }
            ];

            if (riskLevel) {
                // Fake filtering if needed
                dbData = dbData.filter(d => calculateRisk(d).level === riskLevel);
            }
        }

        // Recalculate risk on the fly for the MVP
        const zonesWithRisk = dbData.map(z => {
            const risk = calculateRisk(z);
            return {
                ...z,
                risk_score: risk.score,
                risk_percentage: risk.percentage,
                risk_level: risk.level
            };
        });

        return NextResponse.json({ zones: zonesWithRisk });
    } catch (err) {
        console.error('Failed to fetch zones:', err);
        return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 });
    }
}
