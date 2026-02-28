export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const aiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { complaint } = body;

        if (!complaint) {
            return NextResponse.json({ error: 'Complaint data required' }, { status: 400 });
        }

        const prompt = `
You are an Official Representative for the Smart City Goa Municipal Administration.
A citizen filed the following grievance which has now been successfully RESOLVED.

Complaint Category: ${complaint.category}
Description: "${complaint.description}"
Location: ${complaint.location}

Write a 2-3 sentence official resolution report for the citizen. 
The tone should be:
1. Professional and reassuring.
2. Specific to the issue (e.g. mention Panaji PWD if it's a road issue, or Sanitation team if it's garbage).
3. Confirm that the issue was taken into consideration and addressed by the relevant department.
4. End with a polite "Thank you for helping us build a better Goa."

Return only the text of the report.
`;

        let reportText = "";

        if (process.env.GEMINI_API_KEY) {
            try {
                const model = aiClient.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(prompt);
                reportText = result.response.text().trim();
            } catch (e) {
                console.error("Gemini invocation failed for resolution report", e);
            }
        }

        if (!reportText) {
            // Fallback mock report
            const dept = complaint.category === 'Road Damage' ? 'Public Works Department' :
                complaint.category === 'Garbage or Sanitation' ? 'Municipal Sanitation Team' :
                    'Concerned City Department';

            reportText = `The ${dept} has successfully addressed your grievance regarding "${complaint.title}" at ${complaint.location}. Our field team was dispatched to the site, and the necessary actions have been completed. Thank you for helping us build a better Goa.`;
        }

        return NextResponse.json({ success: true, report: reportText });
    } catch (err) {
        console.error('AI Resolution Report API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
