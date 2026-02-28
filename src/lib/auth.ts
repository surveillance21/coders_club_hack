import { supabase } from './supabase';

export const getAuthRole = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        // If a real session exists, use it
        if (!error && session) {
            if (session.user.email?.includes('admin')) {
                return 'admin';
            }
            return 'citizen';
        }

        // MVP Bypass Fallback (If email wasn't confirmed but we logged them in anyway)
        if (typeof window !== 'undefined') {
            return localStorage.getItem('civic_role') || null;
        }

        return null;
    } catch (err) {
        return null;
    }
};

export const logout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
        localStorage.removeItem('civic_role');
        window.dispatchEvent(new Event('auth_change'));
    }
};

