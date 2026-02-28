import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const { message, history } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Format history for Gemini Context if possible, but for MVP we will just send the conversation thread as a block
        let formattedHistory = "";
        if (history && Array.isArray(history)) {
            formattedHistory = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');
        }

        const prompt = `
You are the CivicAI Assistant, an intelligent, helpful bot integrated into a Smart City Grievance Pipeline platform.
Your job is to assist citizens with filing grievances, checking statuses, understanding city metrics, and explaining how the command center works.
You should be polite, concise, and professional. Do not use markdown headers; keep formatting simple.

Conversation History:
${formattedHistory}

User: ${message}
Assistant:`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const reply = response.text;

        return NextResponse.json({ reply });
    } catch (err) {
        console.error('Chat API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
