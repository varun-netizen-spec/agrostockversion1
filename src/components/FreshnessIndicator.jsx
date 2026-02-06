import React from 'react';
import { Zap } from 'lucide-react';

export default function FreshnessIndicator({ score }) {
    // Score should be 0-100
    // > 90: Excellent (Green)
    // > 70: Good (Yellow)
    // < 70: Fair (Red)

    let color = '#10b981'; // Green
    let label = 'Excellent';

    if (score < 90) {
        color = '#f59e0b'; // Yellow
        label = 'Good';
    }
    if (score < 70) {
        color = '#ef4444'; // Red
        label = 'Fair';
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={12} fill={color} color={color} /> Freshness Score
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: color }}>{score}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                    width: `${score}%`,
                    height: '100%',
                    background: color,
                    transition: 'width 0.5s ease-in-out'
                }}></div>
            </div>
        </div>
    );
}
