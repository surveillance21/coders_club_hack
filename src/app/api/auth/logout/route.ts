export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const response = NextResponse.json({ success: true, message: 'Logged out' });

        // Clear the cookie by setting it to explicitly expire immediately
        response.cookies.set({
            name: 'admin_token',
            value: '',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0
        });

        return response;
    } catch (err) {
        console.error('Logout API Error:', err);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
