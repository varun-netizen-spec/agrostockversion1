import React, { useState } from 'react';
import { Zap, TrendingUp, DollarSign, Leaf, Sparkles, Plus } from 'lucide-react';

export default function FeedOptimizer() {
    const [feedCost, setFeedCost] = useState(120);
    const [milkYield, setMilkYield] = useState(18);

    return (
        <div style={{ maxWidth: '1000px' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Feed Optimization</h1>
                <p style={{ color: 'var(--text-muted)' }}>AI-driven recommendations to maximize yield and minimize costs.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <section className="glass-panel" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={20} color="var(--accent-primary)" />
                            Daily Inputs
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label className="input-label">Current Feed Cost ($/day/cattle)</label>
                                <div style={{ position: 'relative' }}>
                                    <DollarSign size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                    <input
                                        type="number"
                                        className="input-field"
                                        style={{ paddingLeft: '3rem' }}
                                        value={feedCost}
                                        onChange={(e) => setFeedCost(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Avg. Milk Yield (Liters/day)</label>
                                <div style={{ position: 'relative' }}>
                                    <Zap size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                    <input
                                        type="number"
                                        className="input-field"
                                        style={{ paddingLeft: '3rem' }}
                                        value={milkYield}
                                        onChange={(e) => setMilkYield(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="glass-panel" style={{ padding: '2rem', border: '1px solid var(--accent-primary)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), transparent)' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fff' }}>
                            <Sparkles size={22} color="var(--accent-primary)" />
                            AI Recommendation
                        </h2>
                        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
                                Based on your current yield of <strong>{milkYield}L</strong> and seasonal factors, we suggest adjusting the
                                crude protein intake by <strong>+5%</strong>.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <RecommendationItem icon={<Leaf size={16} />} text="Increase Green Fodder proportion to 40%." />
                                <RecommendationItem icon={<Leaf size={16} />} text="Add 200g of mineral mixture per cattle." />
                                <RecommendationItem icon={<Leaf size={16} />} text="Estimated Yield increase: +1.5 Liters/day." />
                            </div>
                        </div>
                    </section>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <section className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Feed Inventory</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <InventoryItem label="Silage" percent={75} />
                            <InventoryItem label="Concentrates" percent={30} warning />
                            <InventoryItem label="Dry Fodder" percent={55} />
                        </div>
                        <button className="btn-primary" style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
                            <Plus size={16} />
                            Add Inventory
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
}

function RecommendationItem({ icon, text }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.925rem' }}>
            <div style={{ color: 'var(--accent-primary)' }}>{icon}</div>
            <span>{text}</span>
        </div>
    );
}

function InventoryItem({ label, percent, warning }) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <span>{label}</span>
                <span style={{ color: warning ? '#f87171' : 'var(--text-muted)' }}>{percent}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px' }}>
                <div style={{
                    width: `${percent}%`,
                    height: '100%',
                    background: warning ? '#f87171' : 'var(--accent-primary)',
                    borderRadius: '3px',
                    boxShadow: warning ? 'none' : '0 0 8px var(--accent-glow)'
                }} />
            </div>
        </div>
    );
}
