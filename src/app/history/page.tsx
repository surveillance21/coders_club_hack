"use client";

import { useState, useEffect } from 'react';
import { Loader2, Clock, CheckCircle, AlertCircle, FileText, MapPin, ShieldCheck } from 'lucide-react';

function ResolutionReport({ complaint }: { complaint: any }) {
    const [report, setReport] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await fetch('/api/ai-resolution-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ complaint })
                });
                const data = await res.json();
                if (data.report) setReport(data.report);
            } catch (err) {
                console.error("Failed to fetch resolution report", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [complaint]);

    if (loading) return <div style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B' }}>
        <Loader2 size={14} className="animate-spin" /> Generating official resolution summary...
    </div>;

    if (!report) return null;

    return (
        <div style={{
            marginTop: '16px',
            padding: '20px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
            border: '1px solid #BBF7D0',
            position: 'relative'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#166534', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <ShieldCheck size={16} /> Official Government Action Report
            </div>
            <p style={{ margin: 0, color: '#14532D', fontSize: '14px', lineHeight: 1.6, fontStyle: 'italic' }}>
                "{report}"
            </p>
            <div style={{ marginTop: '12px', textAlign: 'right', fontSize: '11px', color: '#166534', opacity: 0.8, fontWeight: 600 }}>
                — Smart City Goa Municipal Administration
            </div>
        </div>
    );
}

export default function HistoryPage() {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/complaints/history');
                const data = await res.json();
                if (data.complaints) {
                    setComplaints(data.complaints);
                }
            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Resolved': return <CheckCircle size={18} color="#10B981" />;
            case 'In Progress': return <Loader2 size={18} className="animate-spin" color="#F59E0B" />;
            case 'Under Review': return <AlertCircle size={18} color="#4318FF" />;
            default: return <Clock size={18} color="#94A3B8" />;
        }
    };

    const getStatusBadgeClass = (status: string) => {
        if (status === 'Resolved') return 'badge-resolved';
        if (status === 'In Progress' || status === 'Under Review') return 'badge-submitted';
        return 'badge-gray';
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '48px', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ marginBottom: '8px', fontSize: '32px', fontWeight: 800 }}>My Complaints</h1>
                <p style={{ color: '#64748B', fontSize: '16px' }}>Track the real-time status and official responses to your submitted grievances.</p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
                    <Loader2 size={32} className="animate-spin" color="#4318FF" />
                </div>
            ) : complaints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: '20px', border: '2px dashed #E2E8F0' }}>
                    <FileText size={56} color="#CBD5E1" style={{ margin: '0 auto 20px' }} />
                    <h3 style={{ marginBottom: '8px', color: '#1E293B', fontSize: '20px' }}>No Complaints Found</h3>
                    <p style={{ color: '#64748B' }}>You haven't submitted any grievances yet. Your history will appear here.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {complaints.map((c: any) => (
                        <div key={c.id} className="card" style={{ padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderRadius: '16px', position: 'relative' }}>
                            {c.status === 'Resolved' && (
                                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '6px', background: '#10B981', borderRadius: '16px 0 0 16px' }} />
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '6px', fontWeight: 700, letterSpacing: '0.05em' }}>
                                        #{c.id.split('-')[0].toUpperCase()} • {new Date(c.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                    <h3 style={{ fontSize: '20px', margin: 0, fontWeight: 700, color: '#1E293B' }}>{c.title}</h3>
                                </div>

                                <span className={`badge ${getStatusBadgeClass(c.status)}`} style={{ fontWeight: 700, padding: '6px 14px', borderRadius: '30px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {getStatusIcon(c.status)} {c.status}
                                    </span>
                                </span>
                            </div>

                            <p style={{ color: '#475569', fontSize: '15px', lineHeight: 1.6, marginBottom: '20px' }}>
                                {c.description}
                            </p>

                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                                <span className="badge badge-gray" style={{ color: '#64748B', border: '1px solid #E2E8F0' }}>{c.category}</span>
                                <span style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                    <MapPin size={14} color="#94A3B8" /> {c.location}
                                </span>
                            </div>

                            {/* Official Report for Resolved issues */}
                            {c.status === 'Resolved' && <ResolutionReport complaint={c} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

