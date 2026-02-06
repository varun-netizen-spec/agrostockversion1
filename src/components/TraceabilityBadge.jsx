import React, { useState } from 'react';
import { ShieldCheck, MapPin, Tag, Info } from 'lucide-react';

export default function TraceabilityBadge({ product }) {
    const [showDetails, setShowDetails] = useState(false);

    if (!product.sourceCattleTag && !product.farmName) return null;

    return (
        <div style={{ marginTop: '0.75rem' }}>
            {/* Badge Trigger */}
            <div
                onClick={() => setShowDetails(!showDetails)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid #38bdf8',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#0284c7',
                    width: 'fit-content'
                }}
            >
                <ShieldCheck size={14} />
                <span style={{ fontWeight: '600' }}>Trace Origin</span>
                <Info size={12} />
            </div>

            {/* Expanded Details */}
            {showDetails && (
                <div className="glass-panel" style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    fontSize: '0.8rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    position: 'absolute',
                    zIndex: 10,
                    width: '200px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                        Product Passport
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                            <MapPin size={12} />
                            <span>{product.farmName || 'Unknown Farm'}</span>
                        </div>

                        {product.sourceCattleTag && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                <Tag size={12} />
                                <span>Tag: {product.sourceCattleTag}</span>
                            </div>
                        )}

                        {product.healthVerified && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: '500' }}>
                                <ShieldCheck size={12} />
                                <span>Health Verified Source</span>
                            </div>
                        )}

                        {product.productionDate && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                                Collected: {new Date(product.productionDate).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
