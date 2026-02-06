import React, { useState, useEffect } from 'react';
import { SalesAnalyticsService } from '../services/SalesAnalyticsService';
import { GeminiService } from '../services/geminiService';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle2, Loader2, Sparkles, Calendar, ArrowRight } from 'lucide-react';

export default function AIInsightsPanel({ farmerId }) {
    const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'forecast'
    const [insights, setInsights] = useState(null);
    const [forecast, setForecast] = useState(null);
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

            // 2. Get AI Analysis (Parallel)
            const [aiResult, forecastResult] = await Promise.all([
                GeminiService.generateBusinessInsights(analytics),
                GeminiService.generateDemandForecast(analytics)
            ]);

            setInsights(aiResult);
            setForecast(forecastResult);
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
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Analyzing sales patterns & predicting demand...</p>
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
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>AI Intelligence Hub</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
                    <button
                        onClick={() => setActiveTab('insights')}
                        style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', background: activeTab === 'insights' ? 'rgba(139, 92, 246, 0.3)' : 'transparent', color: activeTab === 'insights' ? '#fff' : 'var(--text-dim)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                        Business
                    </button>
                    <button
                        onClick={() => setActiveTab('forecast')}
                        style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', background: activeTab === 'forecast' ? 'rgba(56, 189, 248, 0.3)' : 'transparent', color: activeTab === 'forecast' ? '#fff' : 'var(--text-dim)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                        Forecast
                    </button>
                </div>
            </div>

            <div style={{ padding: '1.5rem' }}>

                {/* 🔹 VIEW: BUSINESS INSIGHTS */}
                {activeTab === 'insights' && (
                    <div className="animate-fade-in">
                        <div style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '500', color: 'var(--text-main)' }}>
                            "{insights.recommendation}"
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                            {insights.insights.map((item, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '1rem' }}>
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
                )}

                {/* 🔹 VIEW: DEMAND FORECAST */}
                {activeTab === 'forecast' && forecast && (
                    <div className="animate-fade-in">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Strategy Advice</div>
                            <p style={{ fontSize: '1rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                                {forecast.pricingStrategy || "Analyze upcoming demand to optimize your pricing."}
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                            {/* Forecast List */}
                            <div>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> 7-Day Prediction</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {forecast.forecast.map((day, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: day.predictedVolume === 'High' ? '3px solid #10b981' : day.predictedVolume === 'Low' ? '3px solid #f87171' : '3px solid #fbbf24' }}>
                                            <div style={{ fontWeight: '600', width: '80px' }}>{day.day}</div>
                                            <div style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{day.reason}</div>
                                            <div style={{
                                                fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px',
                                                color: day.predictedVolume === 'High' ? '#10b981' : day.predictedVolume === 'Low' ? '#f87171' : '#fbbf24',
                                                background: day.predictedVolume === 'High' ? 'rgba(16, 185, 129, 0.1)' : day.predictedVolume === 'Low' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(251, 191, 36, 0.1)'
                                            }}>
                                                {day.predictedVolume.toUpperCase()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Inventory Actions */}
                            <div>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} /> Recommended Actions</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {forecast.inventoryActions.map((action, i) => (
                                        <div key={i} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{action.product}</span>
                                                {action.urgency === 'High' && <span style={{ fontSize: '0.7rem', color: '#f87171', border: '1px solid #f87171', padding: '1px 4px', borderRadius: '4px' }}>URGENT</span>}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                                                {action.action}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
