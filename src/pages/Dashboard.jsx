import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { Beef, Activity, AlertTriangle, Scale } from 'lucide-react';

export default function Dashboard() {
    const { userData } = useAuth();
    const [stats, setStats] = useState({
        totalCattle: 0,
        healthAlerts: 0,
        monthlyincome=0,
        vaccinationsDue: 0,
        avgYield: 0
    });

    // Simulated fetching of stats
    useEffect(() => {
        // In a real app, we would query firestore here
        setStats({
            totalCattle: 24,
            healthAlerts: 2,
            vaccinationsDue: 5,
            avgYield: 18.5
        });
    }, [userData]);

    return (
        <div>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Farm Overview</h1>
                <p style={{ color: 'var(--text-muted)' }}>Welcome back, your farm is performing well today.</p>
            </header>

            <div className="cattle-grid">
                <StatCard
                    icon={<Beef color="var(--accent-primary)" />}
                    title="Total Cattle"
                    value={stats.totalCattle}
                    trend="+2 this month"
                />
                <StatCard
                    icon={<Activity color="#38bdf8" />}
                    title="Avg. Milk Yield"
                    value={`${stats.avgYield} L`}
                    trend="+1.2% daily"
                />
                <StatCard
                    icon={<AlertTriangle color="#fbbf24" />}
                    title="Due Vaccinations"
                    value={stats.vaccinationsDue}
                    trend="Action required"
                />
                <StatCard
                    icon={<Stethoscope color="#f87171" />}
                    title="Health Alerts"
                    value={stats.healthAlerts}
                    trend="Urgent"
                    urgent
                />
            </div>

            <section style={{ marginTop: '3rem' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Recent Activities</h2>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-dim)', textAlign: 'center' }}>No recent activities to show.</p>
                </div>
            </section>
        </div>
    );
}

function StatCard({ icon, title, value, trend, urgent }) {
    return (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px'
                }}>
                    {icon}
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>{title}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: '700' }}>{value}</span>
                <span style={{
                    fontSize: '0.75rem',
                    color: urgent ? '#f87171' : 'var(--accent-primary)',
                    fontWeight: '600'
                }}>{trend}</span>
            </div>
        </div>
    );
}

function Stethoscope({ color, size = 20 }) {
    return <Activity color={color} size={size} />;
}
