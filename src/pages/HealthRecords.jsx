import React from 'react';
import { Stethoscope, Calendar, Pill, Syringe, Heart, ChevronRight, AlertCircle } from 'lucide-react';

export default function HealthRecords() {
    const records = [
        {
            id: '1',
            date: 'Jan 15, 2026',
            tagId: 'C-1024',
            type: 'Vaccination',
            title: 'FMD Vaccination',
            status: 'Completed',
            doctor: 'Dr. Sarah Smith'
        },
        {
            id: '2',
            date: 'Jan 12, 2026',
            tagId: 'C-1025',
            type: 'Illness',
            title: 'Mild Fever & Lethargy',
            status: 'Under Treatment',
            doctor: 'Dr. Mike Ross',
            urgent: true
        },
        {
            id: '3',
            date: 'Jan 05, 2026',
            tagId: 'C-1027',
            type: 'Routine',
            title: 'General Health Check',
            status: 'Healthy',
            doctor: 'Internal Review'
        }
    ];

    return (
        <div>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Health History</h1>
                <p style={{ color: 'var(--text-muted)' }}>Track vaccinations, illnesses, and treatments across your herd.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>Recent Records Timeline</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {records.map((rec, index) => (
                            <div key={rec.id} style={{
                                display: 'flex',
                                gap: '1.5rem',
                                position: 'relative'
                            }}>
                                {/* Timeline Line */}
                                {index !== records.length - 1 && (
                                    <div style={{
                                        position: 'absolute',
                                        left: '20px',
                                        top: '40px',
                                        bottom: '-25px',
                                        width: '2px',
                                        background: 'var(--border-color)'
                                    }} />
                                )}

                                <div style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '12px',
                                    background: rec.urgent ? 'rgba(248, 113, 113, 0.1)' : 'var(--accent-glow)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: rec.urgent ? '#f87171' : 'var(--accent-primary)',
                                    flexShrink: 0,
                                    zIndex: 1
                                }}>
                                    {rec.type === 'Vaccination' ? <Syringe size={20} /> :
                                        rec.type === 'Illness' ? <AlertCircle size={20} /> : <Heart size={20} />}
                                </div>

                                <div style={{ flex: 1, paddingBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '600', textTransform: 'uppercase' }}>
                                            {rec.type} • {rec.tagId}
                                        </span>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{rec.date}</span>
                                    </div>
                                    <h4 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{rec.title}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        <span>Status: <span style={{ color: rec.urgent ? '#f87171' : 'var(--accent-primary)' }}>{rec.status}</span></span>
                                        <span>Administered by: {rec.doctor}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <section className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={18} color="var(--accent-primary)" />
                            Next Due Events
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <NextDueItem title="De-worming" date="Feb 02" tag="C-1024" />
                            <NextDueItem title="Anthrax Booster" date="Feb 10" tag="Herd" />
                        </div>
                    </section>

                    <section className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Resources</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            Access common vaccination schedules and health guides.
                        </p>
                        <button style={{
                            width: '100%',
                            padding: '0.6rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.875rem',
                            color: 'var(--text-muted)'
                        }}>View Guidelines</button>
                    </section>
                </div>
            </div>
        </div>
    );
}

function NextDueItem({ title, date, tag }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Tag: {tag}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', fontWeight: '600' }}>{date}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>In 10 days</div>
            </div>
        </div>
    );
}
