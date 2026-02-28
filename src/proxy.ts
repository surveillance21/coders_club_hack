import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the route is an admin route
    if (pathname.startsWith('/admin')) {

        // Check for our simple admin token cookie
        const adminToken = request.cookies.get('admin_token')?.value;

        if (!adminToken) {
            // Redirect to the login page if not authenticated
            const loginUrl = new URL('/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

// Config to specify which paths the middleware should run on
export const config = {
    matcher: ['/admin/:path*'],
};
