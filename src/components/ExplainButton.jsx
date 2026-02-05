import React, { useState } from 'react';
import { MessageSquare, X, Loader2, Sparkles } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

export default function ExplainButton({ context, data, title }) {
    const [explanation, setExplanation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleExplain = async () => {
        if (explanation) {
            setIsOpen(true);
            return;
        }

        setLoading(true);
        setIsOpen(true);
        try {
            const prompt = `
                Explain this specific chart/data to a farmer in simple Tamil and English.
                Context: ${context}
                Data: ${JSON.stringify(data)}
                
                Keep it very short (max 2 sentences each language).
            `;
            const result = await GeminiService.getSimpleExplanation(prompt);
            setExplanation(result);
        } catch (error) {
            setExplanation("Unable to analyze right now.");
        }
        setLoading(false);
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={handleExplain}
                className="glass-panel"
                style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--accent-primary)',
                    border: '1px solid var(--accent-primary)',
                    background: 'rgba(16, 185, 129, 0.05)'
                }}
            >
                <Sparkles size={14} />
                Explain This
            </button>

            {isOpen && (
                <div className="glass-panel" style={{
                    position: 'absolute',
                    bottom: '120%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '300px',
                    padding: '1rem',
                    zIndex: 100,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    border: '1px solid var(--accent-primary)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>AI Insight ({title})</span>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <X size={14} />
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            <Loader2 className="animate-spin" size={14} />
                            Analyzing data...
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                            {explanation}
                        </div>
                    )}

                    {/* Triangle pointer */}
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        marginLeft: '-8px',
                        borderWidth: '8px',
                        borderStyle: 'solid',
                        borderColor: 'var(--bg-secondary) transparent transparent transparent'
                    }} />
                </div>
            )}
        </div>
    );
}
