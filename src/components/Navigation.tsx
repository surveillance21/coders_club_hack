"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowLeft, LayoutDashboard, Settings, LogOut, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthRole, logout } from '@/lib/auth';

export default function Navigation() {
    const [isOpen, setIsOpen] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const updateRole = async () => setRole(await getAuthRole());
        updateRole();
        window.addEventListener('auth_change', updateRole);
        return () => window.removeEventListener('auth_change', updateRole);
    }, []);

    const isHome = pathname === '/';
    const isLogin = pathname === '/login';
    const isAdmin = pathname.startsWith('/admin');

    if (isLogin || isAdmin) return null; // Complete clean layout on login & admin

    const handleLogout = async () => {
        await logout();
        setIsOpen(false);
        router.push('/login');
    };

    return (
        <>
            <header className="navbar" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '33%' }}>
                    {!isHome && !isAdmin && (
                        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--fg-secondary)', fontSize: '14px' }}>
                            <ArrowLeft size={18} /> Back
                        </button>
                    )}
                    {isAdmin && (
                        <button onClick={() => router.push('/login')} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--fg-secondary)', fontSize: '14px' }}>
                            <ArrowLeft size={18} /> Back to Login
                        </button>
                    )}
                </div>

                <Link href="/" className="navbar-logo" style={{ width: '33%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
                    <Image src="/civic_logo.png" alt="CivicAI" width={56} height={56} style={{ objectFit: 'contain' }} />
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-anton)', fontSize: '40px', color: '#1E293B', letterSpacing: '1px', textTransform: 'uppercase' }}>Civic</span>
                        <span style={{ fontFamily: 'var(--font-anton)', fontSize: '40px', color: '#4338CA', letterSpacing: '1px', textTransform: 'uppercase', marginLeft: '6px' }}>AI</span>
                    </div>
                </Link>

                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '33%' }}>
                    <button onClick={() => setIsOpen(true)} style={{ color: 'var(--fg-primary)', padding: '4px' }}>
                        <Menu size={24} />
                    </button>
                </div>
            </header>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            style={{
                                position: 'fixed',
                                top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.4)',
                                zIndex: 1000,
                                backdropFilter: 'blur(2px)'
                            }}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{
                                position: 'fixed',
                                top: 0, right: 0, bottom: 0,
                                width: '280px',
                                backgroundColor: 'var(--bg-primary)',
                                zIndex: 1001,
                                boxShadow: '-4px 0 16px rgba(0,0,0,0.1)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
                                <span style={{ fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Menu</span>
                                <button onClick={() => setIsOpen(false)} style={{ color: 'var(--fg-secondary)' }}><X size={20} /></button>
                            </div>

                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, fontFamily: 'Inter, sans-serif' }}>

                                {role === 'admin' && !isAdmin && (
                                    <Link href="/admin" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', color: 'var(--fg-primary)', transition: 'background 0.2s' }} className="nav-item-hover">
                                        <LayoutDashboard size={18} /> Admin Panel
                                    </Link>
                                )}

                                {!isAdmin && (
                                    <>
                                        <Link href="/history" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', color: 'var(--fg-primary)', transition: 'background 0.2s' }} className="nav-item-hover">
                                            <ClipboardList size={18} /> My Complaints
                                        </Link>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', color: 'var(--fg-primary)', cursor: 'pointer' }} className="nav-item-hover">
                                            <Settings size={18} /> Settings
                                        </div>
                                    </>
                                )}

                            </div>

                            <div style={{ padding: '24px', borderTop: '1px solid var(--border-light)', fontFamily: 'Inter, sans-serif' }}>
                                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--danger)', width: '100%', padding: '12px' }}>
                                    <LogOut size={18} /> Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
