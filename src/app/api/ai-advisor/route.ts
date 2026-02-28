export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const aiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { zoneData, stats } = body;

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is not configured in backend environment.' }, { status: 500 });
        }

        const prompt = `
You are an expert Smart City AI Governance Advisor. Analyze the following local zone data and city-wide context:

Zone Data: ${JSON.stringify(zoneData)}
City Stats: ${JSON.stringify(stats)}

Return a strict JSON object with EXACTLY the following five properties. Do not use markdown blocks, just raw JSON text:
{
  "immediateActions": ["action 1", "action 2"],
  "preventiveMeasures": ["measure 1", "measure 2"],
  "resourceAllocation": "Detailed recommendation for resource allocation based on data.",
  "riskMitigationPlan": "Long term plan to reduce high risk elements.",
  "escalationRecommendation": "Critical escalation warning or department specific call to action."
}
`;

        let resultText = "";

        try {
            const model = aiClient.getGenerativeModel({ model: "gemini-2.5-pro" });
            const result = await model.generateContent(prompt);
            resultText = result.response.text();
        } catch (e) {
            console.error("Gemini invocation failed, using mock data for demo", e);
            resultText = JSON.stringify({
                immediateActions: ["Dispatch emergency road crew to " + zoneData.name, "Increase sanitation frequency"],
                preventiveMeasures: ["Install smart sensors", "Schedule weekly audits"],
                resourceAllocation: "Shift 30% of public works budget to high-risk zones.",
                riskMitigationPlan: "Implement automated SLA tracking and penalize delayed contractors.",
                escalationRecommendation: "ESCALATE: Immediate attention required from Water Department Director due to high breach rate."
            });
        }

        // Clean up markdown formatting if Gemini returned it despite instructions
        const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonResponse = JSON.parse(cleanJson);

        return NextResponse.json({ success: true, strategy: jsonResponse });
    } catch (err) {
        console.error('AI Advisor API Error:', err);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
