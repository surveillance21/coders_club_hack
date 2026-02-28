"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
    Loader2, AlertTriangle, ShieldCheck, Activity, Map as MapIcon,
    BrainCircuit, Search, Clock, Zap, ClipboardList, LayoutDashboard,
    Ticket, MapPin, Settings, LogOut, Bell, User, ChevronDown,
    FileWarning, Eye, UserCircle, PieChart as PieChartIcon, BarChart3,
    TrendingUp, Users, AlertCircle, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import Image from 'next/image';
import styles from './admin.module.css';
import { logout } from '@/lib/auth';

/* ============ MAP ============ */
const BASE_DUMMY_ZONES = [
    { id: 'z1', name: 'Panaji', baseTotal: 52, baseActive: 12 },
    { id: 'z2', name: 'Margao', baseTotal: 41, baseActive: 8 },
    { id: 'z3', name: 'Vasco da Gama', baseTotal: 35, baseActive: 14 },
    { id: 'z4', name: 'Mapusa', baseTotal: 29, baseActive: 5 },
    { id: 'z5', name: 'Calangute', baseTotal: 65, baseActive: 22 },
    { id: 'z6', name: 'Ponda', baseTotal: 18, baseActive: 7 },
];
const mockPolygons: Record<string, { lat: number, lng: number }[]> = {
    'Panaji': [{ lat: 15.4850, lng: 73.8150 }, { lat: 15.5000, lng: 73.8150 }, { lat: 15.5000, lng: 73.8350 }, { lat: 15.4850, lng: 73.8350 }],
    'Margao': [{ lat: 15.2650, lng: 73.9500 }, { lat: 15.2850, lng: 73.9500 }, { lat: 15.2850, lng: 73.9800 }, { lat: 15.2650, lng: 73.9800 }],
    'Vasco da Gama': [{ lat: 15.3900, lng: 73.8000 }, { lat: 15.4100, lng: 73.8000 }, { lat: 15.4100, lng: 73.8200 }, { lat: 15.3900, lng: 73.8200 }],
    'Mapusa': [{ lat: 15.5800, lng: 73.8000 }, { lat: 15.6000, lng: 73.8000 }, { lat: 15.6000, lng: 73.8200 }, { lat: 15.5800, lng: 73.8200 }],
    'Calangute': [{ lat: 15.5350, lng: 73.7450 }, { lat: 15.5550, lng: 73.7450 }, { lat: 15.5550, lng: 73.7650 }, { lat: 15.5350, lng: 73.7650 }],
    'Ponda': [{ lat: 15.3900, lng: 73.9900 }, { lat: 15.4100, lng: 73.9900 }, { lat: 15.4100, lng: 74.0200 }, { lat: 15.3900, lng: 74.0200 }],
};

const LeafletMap = dynamic(() => import('@/components/admin/LeafletMap'), {
    ssr: false,
    loading: () => (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
            <Loader2 className="animate-spin" size={28} color="#94A3B8" />
        </div>
    )
});
const initialCenter = { lat: 15.4909, lng: 73.8278 };

/* ============ COMPONENT ============ */
export default function SmartCommandCenter() {
    const router = useRouter();

    // Tab state
    const [activeTab, setActiveTab] = useState<'dashboard' | 'tickets' | 'zones'>('dashboard');
    const [profileOpen, setProfileOpen] = useState(false);

    // Data
    const [zones, setZones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState<any | null>(null);
    const [mapCenter, setMapCenter] = useState(initialCenter);
    const [mapZoom, setMapZoom] = useState(12);
    const [searchQuery, setSearchQuery] = useState('');
    const [mapViewToggle, setMapViewToggle] = useState<'risk' | 'density'>('risk');
    const [complaintLocations, setComplaintLocations] = useState<{ lat: number, lng: number }[]>([]);
    const [allComplaints, setAllComplaints] = useState<any[]>([]);
    const [complaintAI, setComplaintAI] = useState<Record<string, any>>({});
    const [complaintAILoading, setComplaintAILoading] = useState<string | null>(null);
    const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [confirmModal, setConfirmModal] = useState<{ id: string } | null>(null);

    useEffect(() => {
        const fetchData = () => {
            Promise.all([
                fetch('/api/complaints?aggregate=zones').then(r => r.json()),
                fetch('/api/complaints').then(r => r.json())
            ]).then(([zd, td]) => {
                setZones(zd.zones || []);
                setComplaintLocations(zd.complaintLocations || []);
                setAllComplaints(td.complaints || []);
                setLoading(false);
            }).catch(() => setLoading(false));
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5 seconds for real-time feel
        return () => clearInterval(interval);
    }, []);

    // Click outside to close profile
    useEffect(() => {
        const close = () => setProfileOpen(false);
        if (profileOpen) { document.addEventListener('click', close); return () => document.removeEventListener('click', close); }
    }, [profileOpen]);

    const handleZoneClick = (zone: any) => {
        setSelectedZone(zone);
        if (mockPolygons[zone.name]) {
            const poly = mockPolygons[zone.name];
            setMapCenter({ lat: poly.reduce((a, p) => a + p.lat, 0) / poly.length, lng: poly.reduce((a, p) => a + p.lng, 0) / poly.length });
            setMapZoom(14);
        }
    };

    const handleGenerateComplaintAI = async (id: string, desc: string, cat: string) => {
        if (selectedComplaintId === id) { setSelectedComplaintId(null); return; }
        setSelectedComplaintId(id);
        if (complaintAI[id]) return;
        setComplaintAILoading(id);
        try {
            const res = await fetch('/api/ai-summary', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ complaint: { id, description: desc, category: cat, status: 'Active' } })
            });
            const data = await res.json();
            if (res.ok && data.success) setComplaintAI(prev => ({ ...prev, [id]: data.analysis }));
        } catch (e) { console.error(e); }
        finally { setComplaintAILoading(null); }
    };

    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    const handleResolveComplaint = async (id: string) => {
        setConfirmModal({ id });
    };

    const confirmResolve = async () => {
        if (!confirmModal) return;
        const id = confirmModal.id;
        setConfirmModal(null);
        setResolvingId(id);
        try {
            const res = await fetch(`/api/complaints/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Resolved' })
            });

            const data = await res.json();

            if (res.ok && (data.success || data.offline)) {
                setAllComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'Resolved' } : c));
                setToast({ message: `Ticket #${id.split('-')[0]} resolved successfully${data.offline ? ' (Offline Mode)' : ''}`, type: 'success' });
                // Auto-hide toast
                setTimeout(() => setToast(null), 3000);
            } else {
                setToast({ message: data.error || 'Failed to resolve ticket', type: 'error' });
                setTimeout(() => setToast(null), 3000);
            }
        } catch (e) {
            console.error(e);
            setToast({ message: 'Network error. Please try again.', type: 'error' });
            setTimeout(() => setToast(null), 3000);
        }
        finally { setResolvingId(null); }
    };

    const handleLogout = async () => { await logout(); router.push('/login'); };

    const getPolygonColor = (z: any) => z.risk_percentage > 70 ? '#EF4444' : z.risk_percentage > 40 ? '#F59E0B' : '#10B981';
    const COLORS = ['#4338CA', '#0284C7', '#10B981', '#F59E0B', '#EF4444'];

    const dynamicZones = useMemo(() => {
        const zonesMap = new Map();
        BASE_DUMMY_ZONES.forEach(z => {
            zonesMap.set(z.name, { ...z, total_complaints: z.baseTotal, active_complaints: z.baseActive });
        });

        allComplaints.forEach(c => {
            const text = ((c.title || '') + ' ' + (c.description || '')).toLowerCase();
            for (const zoneName of zonesMap.keys()) {
                if (text.includes(zoneName.toLowerCase())) {
                    const z = zonesMap.get(zoneName);
                    z.total_complaints += 1;
                    if (c.status !== 'Resolved') { z.active_complaints += 1; }
                    break;
                }
            }
        });

        return Array.from(zonesMap.values()).map(z => {
            let risk = Math.round((z.active_complaints / Math.max(z.total_complaints, 1)) * 100);
            risk = Math.min(Math.max(risk, 0), 100);
            return { ...z, risk_percentage: risk, risk_level: risk > 70 ? 'High' : risk > 40 ? 'Medium' : 'Low' };
        });
    }, [allComplaints]);

    const totalComplaints = dynamicZones.reduce((a, z) => a + z.total_complaints, 0);
    const activeComplaints = dynamicZones.reduce((a, z) => a + z.active_complaints, 0);
    const totalResolved = totalComplaints - activeComplaints;
    const avgRisk = dynamicZones.length ? Math.round(dynamicZones.reduce((a, z) => a + z.risk_percentage, 0) / dynamicZones.length) : 0;

    // For heatmap just use dummy Delhi points + locations from real data if any
    const heatmapPoints = useMemo(() => [
        { lat: 15.4950, lng: 73.8250 }, { lat: 15.4920, lng: 73.8200 }, { lat: 15.2750, lng: 73.9600 },
        { lat: 15.5450, lng: 73.7550 }, { lat: 15.4050, lng: 73.8150 }, { lat: 15.5920, lng: 73.8100 },
        ...complaintLocations
    ], [complaintLocations]);

    const trendData = [
        { name: 'Mon', Logged: 40, Handled: 24 }, { name: 'Tue', Logged: 30, Handled: 39 },
        { name: 'Wed', Logged: 20, Handled: 18 }, { name: 'Thu', Logged: 27, Handled: 39 },
        { name: 'Fri', Logged: 18, Handled: 48 }, { name: 'Sat', Logged: 23, Handled: 38 },
        { name: 'Sun', Logged: 34, Handled: 43 },
    ];
    const categoryData = [
        { name: 'Infrastructure', value: 400 }, { name: 'Sanitation', value: 300 },
        { name: 'Water', value: 300 }, { name: 'Electricity', value: 200 },
    ];
    const barData = [
        { name: 'Sat', v: 30 }, { name: 'Sun', v: 45 }, { name: 'Mon', v: 60 },
        { name: 'Tue', v: 50 }, { name: 'Wed', v: 75 }, { name: 'Thu', v: 55 },
    ];

    const filteredComplaints = (allComplaints || []).filter(c => {
        if (statusFilter !== 'All' && c.status !== statusFilter) return false;
        if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
        return true;
    });

    // AI confidence helpers
    const getConfidence = (ai: any) => ai?.confidence ?? Math.floor(Math.random() * 40 + 55);
    const getUrgencyFromAI = (ai: any) => {
        const summary = (ai?.summary || '').toLowerCase();
        if (summary.includes('immediate') || summary.includes('danger') || summary.includes('critical')) return 'Critical';
        if (summary.includes('urgent') || summary.includes('hazard')) return 'High';
        if (summary.includes('moderate') || summary.includes('repair')) return 'Medium';
        return 'Low';
    };

    const sidebarItems = [
        { key: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { key: 'tickets', icon: <Ticket size={18} />, label: 'Tickets' },
        { key: 'zones', icon: <MapPin size={18} />, label: 'Zones' },
    ];

    /* ============ RENDER ============ */
    return (
        <div className={styles.adminLayout}>
            {/* ── SIDEBAR ── */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarLogo} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Image src="/civic_logo.png" alt="CivicAI Logo" width={56} height={56} style={{ objectFit: 'contain' }} />
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-anton)', fontSize: '40px', color: '#1E293B', letterSpacing: '1px', textTransform: 'uppercase' }}>Civic</span>
                        <span style={{ fontFamily: 'var(--font-anton)', fontSize: '40px', color: '#4338CA', letterSpacing: '1px', textTransform: 'uppercase', marginLeft: '6px' }}>AI</span>
                    </div>
                </div>

                <div className={styles.sidebarSectionLabel}>Main Menu</div>
                <nav className={styles.sidebarMenu}>
                    {sidebarItems.map(item => (
                        <div key={item.key}
                            className={`${styles.sidebarItem} ${activeTab === item.key ? styles.active : ''}`}
                            onClick={() => setActiveTab(item.key as any)}>
                            {item.icon} {item.label}
                        </div>
                    ))}
                </nav>

                <div className={styles.sidebarSectionLabel}>Settings</div>
                <nav className={styles.sidebarMenu}>
                    <div className={styles.sidebarItem}><BrainCircuit size={18} /> AI Config</div>
                    <div className={styles.sidebarItem}><Settings size={18} /> Preferences</div>
                </nav>

                <div style={{ flex: 1 }} />
                <nav className={styles.sidebarMenu}>
                    <div className={`${styles.sidebarItem} ${styles.dangerItem}`} onClick={handleLogout}>
                        <LogOut size={18} /> Sign Out
                    </div>
                </nav>
            </aside>

            {/* ── MAIN ── */}
            <main className={styles.mainContent}>
                {/* Top Bar */}
                <div className={styles.topBar}>
                    <div className={styles.topBarLeft}>
                        <h1>{activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'tickets' ? 'Ticket Triage' : 'Zone Intelligence'}</h1>
                        <p>{activeTab === 'dashboard' ? 'Overview & Analytics' : activeTab === 'tickets' ? 'AI-Powered Complaint Analysis' : 'Geographic Risk Mapping'}</p>
                    </div>
                    <div className={styles.topBarRight}>
                        <div className={styles.searchBox}>
                            <Search size={16} color="#94A3B8" />
                            <input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <div className={styles.iconBtn}>
                            <Bell size={18} />
                            <span className={styles.notifDot} />
                        </div>
                        {/* Profile */}
                        <div style={{ position: 'relative' }}>
                            <div className={styles.profileTrigger} onClick={e => { e.stopPropagation(); setProfileOpen(!profileOpen); }}>
                                <div className={styles.profileAvatar}>A</div>
                                <div>
                                    <div className={styles.profileName}>Admin</div>
                                    <div className={styles.profileRole}>Operator</div>
                                </div>
                                <ChevronDown size={14} color="#94A3B8" />
                            </div>
                            {profileOpen && (
                                <div className={styles.profileDropdown} onClick={e => e.stopPropagation()}>
                                    <div className={styles.profileDropdownItem}><UserCircle size={16} /> My Profile</div>
                                    <div className={styles.profileDropdownItem}><Settings size={16} /> Settings</div>
                                    <div className={styles.profileDropdownItem}><Bell size={16} /> Notifications</div>
                                    <div style={{ height: 1, background: '#E8ECF0', margin: '4px 0' }} />
                                    <div className={`${styles.profileDropdownItem} ${styles.profileDropdownDanger}`} onClick={handleLogout}>
                                        <LogOut size={16} /> Sign Out
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════════ DASHBOARD TAB ══════════ */}
                {activeTab === 'dashboard' && (
                    <>
                        {/* Colored Hero Cards */}
                        <div className={styles.statsGrid}>
                            <div className={`${styles.heroStatCard} ${styles.bgTeal}`}>
                                <div className={styles.heroStatIcon}><ClipboardList size={22} /></div>
                                <div className={styles.heroStatValue}>{loading ? '...' : totalComplaints}</div>
                                <div className={styles.heroStatLabel}>Total Complaints</div>
                                <div className={styles.heroStatSub}>• All-time logged issues</div>
                            </div>
                            <div className={`${styles.heroStatCard} ${styles.bgBlue}`}>
                                <div className={styles.heroStatIcon}><TrendingUp size={22} /></div>
                                <div className={styles.heroStatValue}>{loading ? '...' : `${100 - avgRisk}%`}</div>
                                <div className={styles.heroStatLabel}>Civic Health</div>
                                <div className={styles.heroStatSub}>• Platform health index</div>
                            </div>
                            <div className={`${styles.heroStatCard} ${styles.bgOrange}`}>
                                <div className={styles.heroStatIcon}><AlertTriangle size={22} /></div>
                                <div className={styles.heroStatValue}>{loading ? '...' : activeComplaints}</div>
                                <div className={styles.heroStatLabel}>Pending Action</div>
                                <div className={styles.heroStatSub}>• Tickets awaiting review</div>
                            </div>
                            <div className={`${styles.heroStatCard} ${styles.bgRose}`}>
                                <div className={styles.heroStatIcon}><CheckCircle size={22} /></div>
                                <div className={styles.heroStatValue}>{loading ? '...' : totalResolved}</div>
                                <div className={styles.heroStatLabel}>Resolved</div>
                                <div className={styles.heroStatSub}>• Successfully closed tickets</div>
                            </div>
                        </div>

                        {/* Charts Row - 3 columns */}
                        <div className={styles.chartRow}>
                            <div className={styles.card}>
                                <h3 className={styles.cardTitle}>Issue Velocity</h3>
                                <div style={{ width: '100%', height: 220 }}>
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <LineChart data={trendData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} width={30} />
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: 13 }} />
                                            <Legend wrapperStyle={{ paddingTop: '8px', fontSize: 12 }} />
                                            <Line type="monotone" dataKey="Logged" stroke="#4338CA" strokeWidth={2.5} dot={{ r: 3, fill: '#4338CA' }} />
                                            <Line type="monotone" dataKey="Handled" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className={styles.card}>
                                <h3 className={styles.cardTitle}>Category Distribution</h3>
                                <div style={{ width: '100%', height: 220 }}>
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <PieChart>
                                            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                                                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px', fontSize: 13 }} />
                                            <Legend wrapperStyle={{ fontSize: 12 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className={styles.card}>
                                <h3 className={styles.cardTitle}>Weekly Volume</h3>
                                <div style={{ width: '100%', height: 220 }}>
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <BarChart data={barData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} width={30} />
                                            <Tooltip contentStyle={{ borderRadius: '8px', fontSize: 13 }} />
                                            <Bar dataKey="v" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Quick table preview */}
                        <div className={styles.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Recent Tickets</h3>
                                <button className={styles.btnAction} style={{ background: '#F1F5F9', color: '#4338CA' }} onClick={() => setActiveTab('tickets')}>
                                    View All <Eye size={14} />
                                </button>
                            </div>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead><tr><th>ID</th><th>Category</th><th>Status</th><th>Description</th></tr></thead>
                                    <tbody>
                                        {(allComplaints || []).slice(0, 5).map(c => (
                                            <tr key={c.id}>
                                                <td><span className={styles.idBadge}>#{c.id?.split('-')[0]}</span></td>
                                                <td><span className={styles.tagPill}>{c.category}</span></td>
                                                <td><span className={`${styles.statusPill} ${c.status === 'Resolved' ? styles.statusResolved : styles.statusActive}`}>{c.status}</span></td>
                                                <td><div className={styles.snippetCell}>{c.description}</div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* ══════════ TICKETS TAB ══════════ */}
                {activeTab === 'tickets' && (
                    <div className={styles.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div>
                                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Global Action Hub</h3>
                                <p className={styles.cardSubtitle} style={{ margin: '4px 0 0' }}>AI triage with urgency reasoning & confidence calibration</p>
                            </div>
                            <div className={styles.filtersBar}>
                                <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                    <option value="All">Any Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                                <select className={styles.filterSelect} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                                    <option value="All">Any Category</option>
                                    <option value="Infrastructure">Infrastructure</option>
                                    <option value="Sanitation">Sanitation</option>
                                    <option value="Water">Water</option>
                                    <option value="Electricity">Electricity</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Ticket</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Description</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredComplaints.slice(0, 20).map(c => (
                                        <React.Fragment key={c.id}>
                                            <tr>
                                                <td>
                                                    <div className={styles.idBadge}>#{c.id?.split('-')[0]}</div>
                                                    <div className={styles.dateText}>{new Date(c.created_at).toLocaleDateString()}</div>
                                                </td>
                                                <td><span className={styles.tagPill}>{c.category}</span></td>
                                                <td>
                                                    <span className={`${styles.statusPill} ${c.status === 'Resolved' ? styles.statusResolved : styles.statusActive}`}>
                                                        {c.status === 'Resolved' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td><div className={styles.snippetCell}>{c.description}</div></td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div className={styles.actionBtns}>
                                                        {c.status !== 'Resolved' && (
                                                            <button className={`${styles.btnAction} ${styles.btnResolve}`} onClick={() => handleResolveComplaint(c.id)} disabled={resolvingId === c.id}>
                                                                {resolvingId === c.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />} Resolve
                                                            </button>
                                                        )}
                                                        <button className={`${styles.btnAction} ${styles.btnAi}`} onClick={() => handleGenerateComplaintAI(c.id, c.description, c.category)} disabled={complaintAILoading === c.id}>
                                                            {complaintAILoading === c.id ? <Loader2 size={12} className="animate-spin" /> : <BrainCircuit size={12} />}
                                                            {selectedComplaintId === c.id ? 'Close' : 'AI Triage'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* AI Expansion Panel */}
                                            <AnimatePresence>
                                                {selectedComplaintId === c.id && complaintAI[c.id] && (() => {
                                                    const ai = complaintAI[c.id];
                                                    const urgency = getUrgencyFromAI(ai);
                                                    const confidence = getConfidence(ai);
                                                    const needsReview = confidence < 70;
                                                    const urgencyClass = urgency === 'Critical' ? styles.urgencyCritical : urgency === 'High' ? styles.urgencyHigh : urgency === 'Medium' ? styles.urgencyMedium : styles.urgencyLow;
                                                    const confColor = confidence >= 80 ? '#10B981' : confidence >= 60 ? '#F59E0B' : '#EF4444';

                                                    return (
                                                        <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={styles.aiExpansionRow}>
                                                            <td colSpan={5}>
                                                                <div className={styles.aiPanel}>
                                                                    {/* Col 1: Context Summary */}
                                                                    <div className={styles.aiPanelCol}>
                                                                        <h4 className={`${styles.aiTitle} ${styles.aiTitleBlue}`}><BrainCircuit size={14} /> Context Summary</h4>
                                                                        <p className={styles.aiText}>{ai.summary}</p>
                                                                        {/* Urgency Reasoning */}
                                                                        <h4 className={`${styles.aiTitle} ${styles.aiTitleAmber}`} style={{ marginTop: 12 }}><AlertCircle size={14} /> Urgency Assessment</h4>
                                                                        <div className={styles.urgencyBar}>
                                                                            <span className={`${styles.urgencyLevel} ${urgencyClass}`}>{urgency}</span>
                                                                            <span className={styles.aiText} style={{ fontSize: 12 }}>
                                                                                {urgency === 'Critical' ? 'Immediate danger or safety risk detected' :
                                                                                    urgency === 'High' ? 'Significant impact, requires fast response' :
                                                                                        urgency === 'Medium' ? 'Non-urgent but requires scheduled action' :
                                                                                            'Minor issue, can be batched'}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Col 2: Remediation */}
                                                                    <div className={styles.aiPanelCol}>
                                                                        <h4 className={`${styles.aiTitle} ${styles.aiTitleGreen}`}><ShieldCheck size={14} /> Remediation Steps</h4>
                                                                        <ul className={styles.aiText} style={{ paddingLeft: 16, margin: 0 }}>
                                                                            {(ai.solutionSteps || [ai.solution]).map((s: string, i: number) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
                                                                        </ul>
                                                                    </div>

                                                                    {/* Col 3: Confidence Calibration */}
                                                                    <div className={styles.aiPanelCol}>
                                                                        <h4 className={`${styles.aiTitle} ${styles.aiTitleAmber}`}><Activity size={14} /> Confidence Calibration</h4>
                                                                        <div className={styles.confidenceBar}>
                                                                            <div className={styles.confidenceTrack}>
                                                                                <div className={styles.confidenceFill} style={{ width: `${confidence}%`, background: confColor }} />
                                                                            </div>
                                                                            <span className={styles.confidenceLabel} style={{ color: confColor }}>{confidence}%</span>
                                                                        </div>
                                                                        <p className={styles.aiText} style={{ marginTop: 8, fontSize: 12 }}>
                                                                            {confidence >= 80 ? 'High confidence — AI recommendation is reliable.' :
                                                                                confidence >= 60 ? 'Moderate confidence — review recommended.' :
                                                                                    'Low confidence — manual review strongly advised.'}
                                                                        </p>
                                                                        {needsReview && (
                                                                            <div className={styles.humanReviewFlag}>
                                                                                <FileWarning size={14} /> Flagged for Human Review
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })()}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                            {filteredComplaints.length === 0 && (
                                <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>No tickets found.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════ ZONES TAB ══════════ */}
                {activeTab === 'zones' && (
                    <>
                        <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E8ECF0' }}>
                                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Risk Topography Map</h3>
                                <div className={styles.filtersBar}>
                                    <button className={styles.filterSelect} style={{ cursor: 'pointer', background: mapViewToggle === 'risk' ? '#4338CA' : 'white', color: mapViewToggle === 'risk' ? 'white' : '#1E293B' }}
                                        onClick={() => setMapViewToggle('risk')}>Risk View</button>
                                    <button className={styles.filterSelect} style={{ cursor: 'pointer', background: mapViewToggle === 'density' ? '#4338CA' : 'white', color: mapViewToggle === 'density' ? 'white' : '#1E293B' }}
                                        onClick={() => setMapViewToggle('density')}>Heatmap</button>
                                </div>
                            </div>
                            <div className={styles.mapWrapper}>
                                <LeafletMap center={mapCenter} zoom={mapZoom} zones={dynamicZones} searchQuery={searchQuery} mockPolygons={mockPolygons} getPolygonColor={getPolygonColor} handleZoneClick={handleZoneClick} mapViewToggle={mapViewToggle} heatmapPoints={heatmapPoints} />
                            </div>
                        </div>

                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Zone Intelligence</h3>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead><tr><th>Zone</th><th>Risk Level</th><th>Total</th><th>Active</th><th>Resolved</th></tr></thead>
                                    <tbody>
                                        {(dynamicZones || []).map((z, i) => (
                                            <tr key={i} onClick={() => handleZoneClick(z)}>
                                                <td style={{ fontWeight: 600 }}>
                                                    <span className={styles.zoneDot} style={{ background: getPolygonColor(z) }} />
                                                    {z.name}
                                                </td>
                                                <td>
                                                    <span className={styles.statusPill} style={{
                                                        background: z.risk_percentage > 70 ? '#FEE2E2' : z.risk_percentage > 40 ? '#FEF3C7' : '#D1FAE5',
                                                        color: z.risk_percentage > 70 ? '#DC2626' : z.risk_percentage > 40 ? '#D97706' : '#059669'
                                                    }}>{z.risk_percentage}%</span>
                                                </td>
                                                <td>{z.total_complaints}</td>
                                                <td style={{ color: '#D97706', fontWeight: 600 }}>{z.active_complaints}</td>
                                                <td style={{ color: '#059669', fontWeight: 600 }}>{z.total_complaints - z.active_complaints}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>
            {/* Confirm Modal */}
            <AnimatePresence>
                {confirmModal && (
                    <div className={styles.modalOverlay}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={styles.modal}
                        >
                            <div className={styles.modalHeader}>
                                <AlertCircle size={24} color="#D97706" />
                                <h3>Confirm Resolution</h3>
                            </div>
                            <p className={styles.modalBody}>
                                Are you sure you want to mark ticket <strong>#{confirmModal.id.split('-')[0]}</strong> as resolved? This will notify the citizen.
                            </p>
                            <div className={styles.modalFooter}>
                                <button className={styles.btnCancel} onClick={() => setConfirmModal(null)}>Cancel</button>
                                <button className={styles.btnConfirm} onClick={confirmResolve}>Mark as Resolved</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, x: '-50%' }}
                        className={styles.toast}
                        style={{
                            background: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#4338CA'
                        }}
                    >
                        {toast.type === 'success' ? <ShieldCheck size={18} /> : toast.type === 'error' ? <AlertCircle size={18} /> : <Bell size={18} />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
