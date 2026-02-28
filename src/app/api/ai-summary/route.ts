export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const aiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const complaint = body.complaint || body || {};

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
        }

        const prompt = `
You are a Smart City AI Assistant. Analyze the following citizen grievance:

Complaint Category: ${complaint.category || 'N/A'}
Description: "${complaint.description || 'No description provided.'}"
Status: ${complaint.status}
Location details: ${complaint.latitude}, ${complaint.longitude}

Provide a brief, professional summary of the issue (2 sentences max) and propose a direct, actionable solution for the relevant city department. 
Format as JSON with exact keys: { "summary": string, "solution": string }
`;

        let resultText = "";

        try {
            const model = aiClient.getGenerativeModel({ model: "gemini-2.5-pro" });
            const result = await model.generateContent(prompt);
            resultText = result.response.text();
        } catch (e) {
            console.error("Gemini invocation failed, using mock data", e);
            resultText = JSON.stringify({
                summary: "The citizen reported an issue categorized as " + (complaint.category || 'General') + " requiring attention at the specified coordinates.",
                solution: "Dispatch a field inspector to assess the situation and route to the appropriate maintenance team within 24 hours."
            });
        }

        const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonResponse = JSON.parse(cleanJson);

        return NextResponse.json({ success: true, analysis: jsonResponse });
    } catch (err) {
        console.error('AI Summary API Error:', err);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
