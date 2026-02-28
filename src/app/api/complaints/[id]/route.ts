export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DEPARTMENT_MAP } from '@/lib/constants';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, category, resolution_notes } = body;

        const updates: any = {};
        if (status) updates.status = status;
        if (resolution_notes !== undefined) updates.resolution_notes = resolution_notes;

        if (category) {
            updates.category = category;
            updates.department = DEPARTMENT_MAP[category] || 'Admin Review';
        }

        try {
            const { data, error } = await supabase
                .from('complaints')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (!error && data) {
                return NextResponse.json({ success: true, complaint: data });
            }
        } catch (e) {
            console.warn("Supabase update failed, using offline mock success");
        }

        // Offline Fallback
        return NextResponse.json({
            success: true,
            offline: true,
            complaint: { id, ...updates, updated_at: new Date().toISOString() }
        });
    } catch (err) {
        console.error('Update API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
