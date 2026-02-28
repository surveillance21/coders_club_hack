export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // Note: For a real hackathon project you'd connect this to Supabase auth or NextAuth
        // For this demo, we use a simple hardcoded check to enable the presentation flow
        if (username === 'admin' && password === 'admin123') {
            const response = NextResponse.json({ success: true, message: 'Login successful' });

            // Set simple secure cookie
            response.cookies.set({
                name: 'admin_token',
                value: 'authenticated_admin_demo',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 // 1 day
            });

            return response;
        }

        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    } catch (err) {
        console.error('Login API Error:', err);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
