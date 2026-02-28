export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const zone = await request.json();

        if (!zone || !zone.name) {
            return NextResponse.json({ error: 'Invalid zone data' }, { status: 400 });
        }

        const prompt = `
            You are a Smart City AI Analyst analyzing real-time civic grievance data for a municipality dashboard.
            
            Analyze the following Zone Data:
            Zone Name: ${zone.name}
            Total Complaints: ${zone.total_complaints}
            Active Issues: ${zone.active_complaints}
            Last 24h Escalations: ${zone.last_24h_complaints}
            High Severity Count: ${zone.high_severity_count}
            SLA Breaches: ${zone.sla_breaches}
            Current AI Risk Level: ${zone.risk_level} (${zone.risk_percentage}%)

            Generate a concise, professional, structured JSON output containing exactly these fields:
            - "summary": (string) A 1-2 sentence overview of the zone's current health.
            - "root_cause_hypothesis": (string) Based on the severity and breaches, guess the underlying issue (e.g. failing infrastructure, extreme weather).
            - "forecast": (string) Predict what will happen in the next 48 hours if unaddressed.
            - "suggested_action": (string) 1 clear directive for the emergency response coordinator.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });

        if (!response.text) throw new Error("No response from AI");

        const analysis = JSON.parse(response.text);

        return NextResponse.json({ success: true, analysis });

    } catch (err) {
        console.error('Zone Analysis Error:', err);
        return NextResponse.json({ error: 'Failed to analyze zone' }, { status: 500 });
    }
}
