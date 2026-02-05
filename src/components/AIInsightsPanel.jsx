import React, { useState, useEffect } from 'react';
import { SalesAnalyticsService } from '../services/SalesAnalyticsService';
import { GeminiService } from '../services/geminiService';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export default function AIInsightsPanel({ farmerId }) {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (farmerId) {
            generateInsights();
        }
    }, [farmerId]);

    const generateInsights = async () => {
        setLoading(true);
        try {
            // 1. Get Real Data
            const analytics = await SalesAnalyticsService.getAggregatedSalesData(farmerId);

            if (analytics.error || analytics.totalOrders === 0) {
                setInsights(null); // Not enough data
                return;
            }

            // 2. Get AI Analysis
            const aiResult = await GeminiService.generateBusinessInsights(analytics);
            setInsights(aiResult);
        } catch (error) {
            console.error("AI Panel Error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <Loader2 className="spin" size={24} style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)' }} />
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Analyzing sales patterns with Gemini AI...</p>
            </div>
        );
    }

    if (!insights || !insights.insights) {
        return null; // Don't show if no data/error
    }

    return (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <div style={{
                background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.1), rgba(56, 189, 248, 0.1))',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Sparkles size={20} color="#8b5cf6" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>AI Business Intelligence</h3>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
                    Powered by Gemini
                </span>
            </div>

            <div style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '500', color: 'var(--text-main)' }}>
                    "{insights.recommendation}"
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {insights.insights.map((item, i) => (
                        <div key={i} style={{
                            background: 'rgba(255,255,255,0.03)',
                            padding: '1rem',
                            borderRadius: '12px',
                            display: 'flex',
                            gap: '1rem'
                        }}>
                            <div style={{ marginTop: '0.2rem' }}>
                                {item.type === 'positive' && <TrendingUp size={20} color="#10b981" />}
                                {item.type === 'warning' && <AlertTriangle size={20} color="#f59e0b" />}
                                {item.type === 'tip' && <Lightbulb size={20} color="#38bdf8" />}
                            </div>
                            <div>
                                <div style={{ fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{item.title}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: '1.4' }}>{item.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
