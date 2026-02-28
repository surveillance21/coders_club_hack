"use client";

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FileText, CheckCircle, MapPin, Activity, Users, BarChart3, Filter, ShieldCheck, AlertTriangle, Zap, Clock, TrendingUp, TrendingDown, Target, BrainCircuit, Network, Database, Layers, ArrowRight } from 'lucide-react';
import styles from './customer.module.css';

function CountUp({ end, duration = 1500 }: { end: number, duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const easing = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easing * end));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);
  return <>{count.toLocaleString()}</>;
}


const LeafletMap = dynamic(() => import('@/components/admin/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #E2E8F0', borderTop: '3px solid #4318FF', borderRadius: '50%' }} />
    </div>
  )
});

// Dummy zone data centered around India
const DUMMY_ZONES = [
  { id: 'z1', name: 'Panaji', risk_level: 'High', risk_percentage: 82, total_complaints: 52, active_complaints: 35, sla_breaches: 12 },
  { id: 'z2', name: 'Margao', risk_level: 'Medium', risk_percentage: 55, total_complaints: 41, active_complaints: 18, sla_breaches: 4 },
  { id: 'z3', name: 'Vasco da Gama', risk_level: 'Low', risk_percentage: 20, total_complaints: 35, active_complaints: 7, sla_breaches: 1 },
  { id: 'z4', name: 'Mapusa', risk_level: 'Medium', risk_percentage: 48, total_complaints: 29, active_complaints: 11, sla_breaches: 3 },
  { id: 'z5', name: 'Calangute', risk_level: 'High', risk_percentage: 75, total_complaints: 65, active_complaints: 42, sla_breaches: 10 },
  { id: 'z6', name: 'Ponda', risk_level: 'Low', risk_percentage: 39, total_complaints: 18, active_complaints: 7, sla_breaches: 0 },
];

const DUMMY_POLYGONS: Record<string, { lat: number, lng: number }[]> = {
  'Panaji': [{ lat: 15.4850, lng: 73.8150 }, { lat: 15.5000, lng: 73.8150 }, { lat: 15.5000, lng: 73.8350 }, { lat: 15.4850, lng: 73.8350 }],
  'Margao': [{ lat: 15.2650, lng: 73.9500 }, { lat: 15.2850, lng: 73.9500 }, { lat: 15.2850, lng: 73.9800 }, { lat: 15.2650, lng: 73.9800 }],
  'Vasco da Gama': [{ lat: 15.3900, lng: 73.8000 }, { lat: 15.4100, lng: 73.8000 }, { lat: 15.4100, lng: 73.8200 }, { lat: 15.3900, lng: 73.8200 }],
  'Mapusa': [{ lat: 15.5800, lng: 73.8000 }, { lat: 15.6000, lng: 73.8000 }, { lat: 15.6000, lng: 73.8200 }, { lat: 15.5800, lng: 73.8200 }],
  'Calangute': [{ lat: 15.5350, lng: 73.7450 }, { lat: 15.5550, lng: 73.7450 }, { lat: 15.5550, lng: 73.7650 }, { lat: 15.5350, lng: 73.7650 }],
  'Ponda': [{ lat: 15.3900, lng: 73.9900 }, { lat: 15.4100, lng: 73.9900 }, { lat: 15.4100, lng: 74.0200 }, { lat: 15.3900, lng: 74.0200 }],
};

const DUMMY_HEATMAP = [
  { lat: 15.4950, lng: 73.8250 }, { lat: 15.4920, lng: 73.8200 }, { lat: 15.2750, lng: 73.9600 },
  { lat: 15.5450, lng: 73.7550 }, { lat: 15.4050, lng: 73.8150 }, { lat: 15.5920, lng: 73.8100 },
];

const DUMMY_RESOLUTIONS = [
  { id: 'TKT-2081', title: 'Streetlight out near Miramar Beach', category: 'Electrical', time: '2 hours ago', zone: 'Panaji' },
  { id: 'TKT-2079', title: 'Pothole on NH66 highway', category: 'Road Damage', time: '5 hours ago', zone: 'Margao' },
  { id: 'TKT-2065', title: 'Waste dumping near Baga beach', category: 'Sanitation', time: '1 day ago', zone: 'Calangute' },
  { id: 'TKT-2051', title: 'Water leakage in market area', category: 'Water Supply', time: '2 days ago', zone: 'Mapusa' },
  { id: 'TKT-2040', title: 'Broken pipe near port road', category: 'Public Safety', time: '3 days ago', zone: 'Vasco da Gama' },
  { id: 'TKT-2032', title: 'Noise pollution from shacks', category: 'Infrastructure', time: '4 days ago', zone: 'Calangute' },
];

export default function Home() {
  const [riskFilter, setRiskFilter] = useState('All');
  const [mapViewToggle, setMapViewToggle] = useState<'risk' | 'density'>('risk');
  const [selectedZone, setSelectedZone] = useState<any | null>(null);
  const [liveStream, setLiveStream] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState(0);

  const mapCenter = { lat: 15.4909, lng: 73.8278 }; // Panaji, Goa

  // Fetch live ticker data and animate health score
  useEffect(() => {
    setTimeout(() => setHealthScore(78), 500); // Animate to 78%

    fetch('/api/complaints')
      .then(res => res.json())
      .then(data => {
        if (data.complaints) {
          // Take the 4 most recent complaints for the ticker
          const recent = data.complaints.slice(0, 4);
          setLiveStream(recent);
        }
      })
      .catch(e => console.error("Error fetching live stream", e));
  }, []);

  const getPolygonColor = (zone: any) => {
    if (zone.risk_percentage > 70) return '#F64E60';
    if (zone.risk_percentage > 40) return '#FFA800';
    return '#16A34A';
  };

  const filteredZones = DUMMY_ZONES.filter(z => riskFilter === 'All' || z.risk_level === riskFilter);

  const totalComplaints = DUMMY_ZONES.reduce((a, z) => a + z.total_complaints, 0);
  const totalResolved = totalComplaints - DUMMY_ZONES.reduce((a, z) => a + z.active_complaints, 0);
  const activeIssues = DUMMY_ZONES.reduce((a, z) => a + z.active_complaints, 0);
  const highRiskCount = DUMMY_ZONES.filter(z => z.risk_level === 'High').length;

  return (
    <div className={styles.customerLayout}>
      <div className={styles.contentWrapper}>
        {/* Civic Health Index */}
        <div className={`${styles.civicHealthContainer} ${styles.animateFadeInUp}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '200px' }}>
            <div style={{ background: '#ECFDF5', padding: '12px', borderRadius: '12px', color: '#10B981' }}>
              <Activity size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Civic Health Index</h2>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>City intelligence active</div>
            </div>
          </div>
          <div className={styles.healthBarWrapper}>
            <div className={styles.healthBarFill} style={{ width: `${healthScore}%` }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', minWidth: '80px', textAlign: 'right' }}>
            <CountUp end={78} />%
          </div>
        </div>

        {/* Hero CTA Banner */}
        <div className={`${styles.heroBanner} ${styles.animateFadeInUp}`} style={{ animationDelay: '0.1s' }}>
          <div className={styles.heroContent}>
            <h1>Report a Civic Issue</h1>
            <p>Help build a smarter city. Describe your complaint and our AI will instantly classify, route, and prioritize it for resolution.</p>
            <div style={{ marginTop: '24px' }}>
              <Link href="/submit" className={styles.heroBtn}>
                <FileText size={20} /> File Complaint
              </Link>
            </div>
          </div>

          {/* Dynamic Graphic */}
          <div className={styles.heroGraphic}>
            <div className={styles.aiStatusBadge}>
              <div className={styles.aiStatusDot} />
              <div>
                <div className={styles.aiStatusText}>CivicAI Active</div>
                <div className={styles.aiStatusSub}>Processing city anomalies</div>
              </div>
            </div>

            <div className={styles.heroTicker}>
              <div className={styles.tickerTrack}>
                {liveStream.length > 0 ? (
                  <>
                    {liveStream.map(c => (
                      <div key={c.id} className={styles.tickerItem}>
                        {c.status === 'Resolved' ? <CheckCircle size={14} color="#10B981" /> :
                          (c.confidence_score > 0.8 ? <Activity size={14} color="#3B82F6" /> : <AlertTriangle size={14} color="#F59E0B" />)}
                        {c.zone_id ? (DUMMY_ZONES.find(z => z.id === c.zone_id)?.name || 'Goa') : 'Goa'} {c.category} {c.status === 'Resolved' ? 'Resolved' : 'Logged'}
                      </div>
                    ))}
                    {/* Duplicate for infinite loop */}
                    {liveStream.map(c => (
                      <div key={c.id + '-dup'} className={styles.tickerItem}>
                        {c.status === 'Resolved' ? <CheckCircle size={14} color="#10B981" /> :
                          (c.confidence_score > 0.8 ? <Activity size={14} color="#3B82F6" /> : <AlertTriangle size={14} color="#F59E0B" />)}
                        {c.zone_id ? (DUMMY_ZONES.find(z => z.id === c.zone_id)?.name || 'Goa') : 'Goa'} {c.category} {c.status === 'Resolved' ? 'Resolved' : 'Logged'}
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className={styles.tickerItem}><Activity size={14} color="#3B82F6" /> CivicAI Baseline Active</div>
                    <div className={styles.tickerItem}><ShieldCheck size={14} color="#10B981" /> Scanning regional inputs</div>
                    <div className={styles.tickerItem}><Activity size={14} color="#3B82F6" /> CivicAI Baseline Active</div>
                    <div className={styles.tickerItem}><ShieldCheck size={14} color="#10B981" /> Scanning regional inputs</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={`${styles.statsRow} ${styles.animateFadeInUp}`} style={{ animationDelay: '0.2s' }}>
          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.pastelGreen}`}><CheckCircle size={28} /></div>
            <div className={styles.statInfo}>
              <span className={styles.statTitle}>Issues Resolved</span>
              <span className={styles.statValue}><CountUp end={totalResolved} /></span>
              <div style={{ marginTop: '8px' }} className={`${styles.trendIndicator} ${styles.trendUp}`}>
                <TrendingUp size={12} /> 12% from last week
              </div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.pastelOrange}`}><AlertTriangle size={28} /></div>
            <div className={styles.statInfo}>
              <span className={styles.statTitle}>Active Issues</span>
              <span className={styles.statValue}><CountUp end={activeIssues} /></span>
              <div style={{ marginTop: '8px' }} className={`${styles.trendIndicator} ${styles.trendDown}`}>
                <TrendingDown size={12} /> 4% from last week
              </div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.pastelBlue}`}><Users size={28} /></div>
            <div className={styles.statInfo}>
              <span className={styles.statTitle}>Active Citizens</span>
              <span className={styles.statValue}><CountUp end={8430} /></span>
              <div style={{ marginTop: '8px' }} className={`${styles.trendIndicator} ${styles.trendUp}`}>
                <TrendingUp size={12} /> +240 new users
              </div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.pastelRed}`}><Zap size={28} /></div>
            <div className={styles.statInfo}>
              <span className={styles.statTitle}>High-Risk Zones</span>
              <span className={styles.statValue}><CountUp end={highRiskCount} /></span>
              <div style={{ marginTop: '8px' }} className={`${styles.trendIndicator} ${styles.trendUp}`}>
                <TrendingUp size={12} /> Mapusa escalated
              </div>
            </div>
          </div>
        </div>

        {/* AI Intelligence Snapshot */}
        <div className={styles.animateFadeInUp} style={{ animationDelay: '0.3s' }}>
          <h2 className={styles.sectionTitle}><BrainCircuit color="#4318FF" /> AI Intelligence Snapshot</h2>
          <div className={styles.aiSnapshotGrid}>
            <div className={styles.aiCard}>
              <div className={styles.statTitle}>Top Detected Issue</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginTop: '8px' }}>Sanitation / Waste</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                <div className={styles.aiStatusDot} style={{ background: '#3B82F6' }} /> 42% of total volume
              </div>
            </div>
            <div className={styles.aiCard}>
              <div className={styles.statTitle}>Highest Risk Zone</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginTop: '8px' }}>Panaji <span style={{ color: '#EF4444' }}>(82%)</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                <div className={styles.aiStatusDot} style={{ background: '#EF4444' }} /> Immediate action required
              </div>
            </div>
            <div className={styles.aiCard}>
              <div className={styles.statTitle}>AI Classification Accuracy</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginTop: '8px' }}>96.8%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                <div className={styles.aiStatusDot} /> Self-optimizing model
              </div>
            </div>
            <div className={styles.aiCard}>
              <div className={styles.statTitle}>Predicted Escalation</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginTop: '8px' }}>Moderate Warning</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                <div className={styles.aiStatusDot} style={{ background: '#F59E0B' }} /> Monsoon drain overflow
              </div>
            </div>
          </div>
        </div>

        {/* Complaint Lifecycle Visualization */}
        <div className={styles.animateFadeInUp} style={{ animationDelay: '0.4s' }}>
          <h2 className={styles.sectionTitle}><Network color="#4318FF" /> How CivicAI Works</h2>
          <div className={styles.lifecycleContainer}>
            <div className={styles.lifecycleLine} />

            <div className={styles.lifecycleStep}>
              <div className={styles.stepIcon}><FileText size={20} /></div>
              <div className={styles.stepTitle}>Complaint Submitted</div>
            </div>
            <div className={styles.lifecycleStep}>
              <div className={styles.stepIcon}><BrainCircuit size={20} /></div>
              <div className={styles.stepTitle}>AI Categorized</div>
            </div>
            <div className={styles.lifecycleStep}>
              <div className={styles.stepIcon}><ArrowRight size={20} /></div>
              <div className={styles.stepTitle}>Smart Routing</div>
            </div>
            <div className={styles.lifecycleStep}>
              <div className={styles.stepIcon}><Clock size={20} /></div>
              <div className={styles.stepTitle}>SLA Tracking</div>
            </div>
            <div className={styles.lifecycleStep}>
              <div className={styles.stepIcon}><CheckCircle size={20} /></div>
              <div className={styles.stepTitle}>Resolution</div>
            </div>
            <div className={styles.lifecycleStep}>
              <div className={styles.stepIcon}><Database size={20} /></div>
              <div className={styles.stepTitle}>Learning & Optimization</div>
            </div>
          </div>
        </div>

        {/* Middle Grid: Map + Resolution Feed */}
        <div className={styles.middleGrid}>
          {/* Map Card */}
          <div className={styles.card} style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className={styles.cardTitle}><MapPin size={22} color="#4318FF" /> Zone Risk Map</h3>
              <div className={styles.filtersBar}>
                {['All', 'High', 'Medium', 'Low'].map(f => (
                  <button key={f} className={`${styles.filterBtn} ${riskFilter === f ? styles.active : ''}`} onClick={() => setRiskFilter(f)}>{f}</button>
                ))}
              </div>
            </div>

            <div className={styles.mapCardInner}>
              <div className={styles.mapWrapper}>
                <LeafletMap
                  center={mapCenter}
                  zoom={11}
                  zones={filteredZones}
                  searchQuery=""
                  mockPolygons={DUMMY_POLYGONS}
                  getPolygonColor={getPolygonColor}
                  handleZoneClick={(z: any) => setSelectedZone(z)}
                  mapViewToggle={mapViewToggle}
                  heatmapPoints={DUMMY_HEATMAP}
                />
                {/* Legend */}
                <div className={styles.mapLegend}>
                  <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: '#EF4444' }} /> High Risk</div>
                  <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: '#F59E0B' }} /> Medium Risk</div>
                  <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: '#10B981' }} /> Low Risk</div>
                </div>
              </div>

              {/* Map Side Panel */}
              <div className={styles.mapSidePanel}>
                <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: '#0F172A' }}>Top High-Risk Zones</h4>
                <div className={styles.sidePanelList}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className={styles.zoneDot} style={{ background: '#EF4444' }} />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Panaji</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444' }}>82%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className={styles.zoneDot} style={{ background: '#EF4444' }} />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Calangute</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444' }}>75%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className={styles.zoneDot} style={{ background: '#F59E0B' }} />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Margao</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B' }}>55%</span>
                  </div>
                </div>
                <button style={{ marginTop: '16px', width: '100%', padding: '10px', background: '#4318FF', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>View AI Analysis</button>
              </div>
            </div>

            {/* Selected Zone Info */}
            {selectedZone && (
              <div style={{ marginTop: 16, padding: '16px', background: '#F4F7FE', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#2B3674' }}>{selectedZone.name}</div>
                  <div style={{ fontSize: 13, color: '#A3AED0', marginTop: 4 }}>{selectedZone.total_complaints} complaints • {selectedZone.active_complaints} active</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: getPolygonColor(selectedZone) }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: getPolygonColor(selectedZone) }}>{selectedZone.risk_level} Risk ({selectedZone.risk_percentage}%)</span>
                </div>
              </div>
            )}
          </div>

          {/* Live Civic Activity Feel */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><Activity size={20} color="#4318FF" /> Live Civic Activity</h3>
            {liveStream.length > 0 ? liveStream.map((item) => (
              <div key={item.id} className={styles.feedItem}>
                <div className={styles.feedContent}>
                  <div className={styles.feedIcon} style={{ background: item.status === 'Resolved' ? '#DCFCE7' : '#EFF6FF', color: item.status === 'Resolved' ? '#16A34A' : '#3B82F6' }}>
                    {item.status === 'Resolved' ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div>
                    <div className={styles.feedTitle}>{item.category} issue logged in {(DUMMY_ZONES.find(z => z.id === item.zone_id)?.name || 'Goa')}</div>
                    <div className={styles.feedMeta}>AI Confidence: {Math.round(item.confidence_score * 100)}%</div>
                  </div>
                </div>
                <span className={`${styles.feedBadge} ${item.status === 'Resolved' ? styles.feedResolved : styles.trendDown}`}>{item.status}</span>
              </div>
            )) : DUMMY_RESOLUTIONS.slice(0, 4).map((item) => (
              <div key={item.id} className={styles.feedItem}>
                <div className={styles.feedContent}>
                  <div className={styles.feedIcon} style={{ background: '#DCFCE7', color: '#16A34A' }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div className={styles.feedTitle}>{item.title}</div>
                    <div className={styles.feedMeta}>{item.category} • {item.zone} • {item.time}</div>
                  </div>
                </div>
                <span className={`${styles.feedBadge} ${styles.feedResolved}`}>Resolved</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Learning Insights */}
        <div className={styles.animateFadeInUp} style={{ animationDelay: '0.5s', marginBottom: '40px' }}>
          <h2 className={styles.sectionTitle}><Layers color="#4318FF" /> System Learning Insights</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            <div className={styles.insightBox}>
              <div className={styles.insightStat}>24%</div>
              <div className={styles.insightDesc}>Faster resolution time compared to last month.</div>
            </div>
            <div className={styles.insightBox}>
              <div className={styles.insightStat}>Sanitation</div>
              <div className={styles.insightDesc}>Most recurring issue pattern identified by AI.</div>
            </div>
            <div className={styles.insightBox}>
              <div className={styles.insightStat}>98.2%</div>
              <div className={styles.insightDesc}>AI routing accuracy across all departments.</div>
            </div>
            <div className={styles.insightBox}>
              <div className={styles.insightStat}>+15%</div>
              <div className={styles.insightDesc}>SLA compliance improvement globally.</div>
            </div>
          </div>
        </div>

        {/* Bottom: Zone Table */}
        <div className={styles.bottomCard}>
          <h3 className={styles.cardTitle}><BarChart3 size={20} color="#4318FF" /> Zone Intelligence Overview</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#A3AED0', fontSize: 13, fontWeight: 600 }}>Zone</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#A3AED0', fontSize: 13, fontWeight: 600 }}>Risk</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#A3AED0', fontSize: 13, fontWeight: 600 }}>Total</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#A3AED0', fontSize: 13, fontWeight: 600 }}>Active</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#A3AED0', fontSize: 13, fontWeight: 600 }}>SLA Breaches</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_ZONES.map(z => (
                <tr key={z.id} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }} onClick={() => setSelectedZone(z)}>
                  <td style={{ padding: '16px', fontWeight: 600, color: '#2B3674' }}>{z.name}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                      background: z.risk_level === 'High' ? '#FFE2E5' : z.risk_level === 'Medium' ? '#FFF4DE' : '#DCFCE7',
                      color: z.risk_level === 'High' ? '#F64E60' : z.risk_level === 'Medium' ? '#FFA800' : '#16A34A',
                    }}>{z.risk_level} ({z.risk_percentage}%)</span>
                  </td>
                  <td style={{ padding: '16px', color: '#2B3674', fontWeight: 600 }}>{z.total_complaints}</td>
                  <td style={{ padding: '16px', color: '#FFA800', fontWeight: 600 }}>{z.active_complaints}</td>
                  <td style={{ padding: '16px', color: '#F64E60', fontWeight: 600 }}>{z.sla_breaches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
