export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ai } from '@/lib/gemini';
import { CONFIDENCE_THRESHOLD, DEPARTMENT_MAP, CATEGORIES } from '@/lib/constants';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, location, contact_info, image_url, lat, lng } = body;

        // Validate request
        if (!title || !description || !location || !contact_info) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Prepare prompt for Gemini
        const prompt = `
      You are an AI assistant helping a city municipality classify public grievances.
      Analyze the following complaint and classify it into one of these exact categories:
      [${CATEGORIES.join(', ')}].

      Complaint Title: "${title}"
      Complaint Description: "${description}"

      Return a raw JSON object with exactly these three fields:
      - "category": (string) the matched category.
      - "confidence": (number) your confidence between 0.00 and 1.00.
      - "reasoning": (string) a short explanation of why you chose this category.
    `;

        // Call Gemini for classification
        let geminiResult = {
            category: 'Other',
            confidence: 0,
            reasoning: 'Failed to parse AI response'
        };

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', // Using flash for fast response on MVP, though pro is also okay.
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                }
            });

            const rawText = response.text;
            if (rawText) {
                geminiResult = JSON.parse(rawText);
            }
        } catch (aiError) {
            console.error('Gemini Classification Error:', aiError);
            // Fallback behavior on AI failure is to proceed to Admin Review queue
        }

        // Determine target department and initial status
        let department = 'Admin Review';
        let status = 'Submitted';
        const isConfident = geminiResult.confidence >= CONFIDENCE_THRESHOLD;

        if (isConfident && DEPARTMENT_MAP[geminiResult.category]) {
            department = DEPARTMENT_MAP[geminiResult.category];
            status = 'Under Review'; // Auto routing could transition it to Under Review
        } else {
            // If low confidence or unrecognized category
            department = 'Admin Review';
        }

        // MVP Mock: Assign to a random zone to simulate geospatial routing and increment its counters.
        let zoneId = null;
        if (lat && lng) {
            const { data: zones } = await supabase.from('zones').select('id, total_complaints, active_complaints, last_24h_complaints');
            if (zones && zones.length > 0) {
                // For demo, randomly pick a zone
                const zone = zones[Math.floor(Math.random() * zones.length)];
                zoneId = zone.id;

                // Increment zone risk factors
                await supabase.from('zones').update({
                    total_complaints: zone.total_complaints + 1,
                    active_complaints: zone.active_complaints + 1,
                    last_24h_complaints: zone.last_24h_complaints + 1
                }).eq('id', zoneId);
            }
        }

        // Insert into Supabase
        const { data: dbData, error: dbError } = await supabase
            .from('complaints')
            .insert([
                {
                    title,
                    description,
                    location,
                    contact_info,
                    image_url: image_url || null,
                    category: geminiResult.category,
                    confidence_score: geminiResult.confidence,
                    gemini_reasoning: geminiResult.reasoning,
                    department,
                    status,
                    lat: lat || null,
                    lng: lng || null,
                    zone_id: zoneId
                }
            ])
            .select()
            .single();

        if (dbError) {
            console.error('Supabase Insert Error:', dbError);
            return NextResponse.json({ error: 'Failed to create complaint ticket' }, { status: 500 });
        }

        return NextResponse.json({ success: true, ticket: dbData }, { status: 201 });

    } catch (err) {
        console.error('Submission API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
