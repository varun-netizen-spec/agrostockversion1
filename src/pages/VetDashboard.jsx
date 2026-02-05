import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CattleService } from '../services/CattleService';
import {
    Stethoscope,
    FileText,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ChevronRight,
    MessageSquare,
    Save,
    Search,
    User,
    Activity,
    Shield
} from 'lucide-react';

export default function VetDashboard() {
    const { userData } = useAuth();
    const [sharedReports, setSharedReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [feedback, setFeedback] = useState({
        note: '',
        urgency: 'Medium',
        treatment: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (userData?.uid) {
            fetchSharedReports();
        }
    }, [userData]);

    const fetchSharedReports = async () => {
        try {
            setLoading(true);
            const reports = await CattleService.getSharedReportsForVet(userData.uid);
            setSharedReports(reports);
        } catch (err) {
            console.error("Error fetching shared reports:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (!selectedReport || !feedback.note) return;

        setIsSubmitting(true);
        try {
            await CattleService.submitVetFeedback(
                selectedReport.reportId,
                selectedReport.id,
                {
                    vetId: userData.uid,
                    vetName: userData.email.split('@')[0], // Simplified name for demo
                    note: feedback.note,
                    urgency: feedback.urgency,
                    treatment: feedback.treatment
                }
            );

            setSuccessMessage("Feedback submitted successfully!");
            setTimeout(() => setSuccessMessage(''), 3000);

            // Refresh the list and close details
            await fetchSharedReports();
            setSelectedReport(null);
            setFeedback({ note: '', urgency: 'Medium', treatment: '' });
        } catch (err) {
            console.error("Error submitting feedback:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Activity className="animate-spin" size={48} color="var(--accent-primary)" />
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title">Veterinarian Portal</h1>
                    <p className="page-subtitle">Expert consultation for AgroStock cattle health</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <Stethoscope size={24} color="var(--accent-primary)" />
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Registered Veterinarian</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{userData?.email}</div>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: selectedReport ? '1fr 1.5fr' : '1fr', gap: '2rem' }}>
                {/* 🔹 Shared Reports List */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={20} color="var(--accent-primary)" />
                            Pending Consultations
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Total: {sharedReports.length}</span>
                    </div>

                    {sharedReports.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                            <Shield size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>No reports shared for review at this time.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {sharedReports.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedReport(item)}
                                    className="glass-panel"
                                    style={{
                                        padding: '1rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        border: selectedReport?.id === item.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                                        background: selectedReport?.id === item.id ? 'rgba(74, 222, 128, 0.05)' : 'rgba(255,255,255,0.02)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '8px',
                                            background: item.reportDetails.severity === 'Red' ? 'rgba(239, 68, 68, 0.1)' : (item.reportDetails.severity === 'Yellow' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)'),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: item.reportDetails.severity === 'Red' ? '#ef4444' : (item.reportDetails.severity === 'Yellow' ? '#f59e0b' : '#10b981')
                                        }}>
                                            <Activity size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Tag: {item.reportDetails.tagId}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{new Date(item.timestamp).toLocaleDateString()} • {item.reportDetails.condition}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.65rem',
                                            fontWeight: 'bold',
                                            background: item.status === 'Reviewed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: item.status === 'Reviewed' ? '#10b981' : '#f59e0b'
                                        }}>
                                            {item.status.toUpperCase()}
                                        </div>
                                        <ChevronRight size={16} color="var(--text-dim)" style={{ marginTop: '0.25rem' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 🔹 Consultation Details & Feedback Form */}
                {selectedReport && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '2rem', borderTop: `4px solid ${selectedReport.reportDetails.severity === 'Red' ? '#ef4444' : (selectedReport.reportDetails.severity === 'Yellow' ? '#f59e0b' : '#10b981')}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Review Health Report</h2>
                                    <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Source: AI Intelligence Scan • {selectedReport.reportDetails.timestamp.slice(0, 10)}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Health Score: {selectedReport.reportDetails.healthScore}%</div>
                                    <div style={{ fontSize: '0.875rem', color: selectedReport.reportDetails.severity === 'Red' ? '#ef4444' : (selectedReport.reportDetails.severity === 'Yellow' ? '#f59e0b' : '#10b981') }}>Condition: {selectedReport.reportDetails.condition}</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>CATTLE INFORMATION</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Tag ID:</span>
                                            <span style={{ fontWeight: 'bold' }}>{selectedReport.reportDetails.tagId}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Breed:</span>
                                            <span style={{ fontWeight: 'bold' }}>{selectedReport.reportDetails.breed}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Age:</span>
                                            <span style={{ fontWeight: 'bold' }}>{selectedReport.reportDetails.age}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>AI DETECTION RESULTS</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {Object.entries(selectedReport.reportDetails.risks).map(([name, risk]) => (
                                            <div key={name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{name}:</span>
                                                <span style={{ fontWeight: 'bold', color: risk > 50 ? '#ef4444' : 'inherit' }}>{risk}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--accent-primary)', marginBottom: '2rem' }}>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Shield size={16} /> AI Explanation
                                </h4>
                                <p style={{ fontSize: '1rem', lineHeight: '1.6', fontStyle: 'italic', color: 'var(--text-main)' }}>
                                    "{selectedReport.reportDetails.explanation.en}"
                                </p>
                            </div>

                            <form onSubmit={handleFeedbackSubmit}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MessageSquare size={20} color="var(--accent-primary)" />
                                    Professional Feedback
                                </h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div className="input-group">
                                        <label className="input-label">Urgency Level</label>
                                        <select
                                            className="input-field"
                                            value={feedback.urgency}
                                            onChange={(e) => setFeedback({ ...feedback, urgency: e.target.value })}
                                        >
                                            <option value="Low">Low - Normal monitoring</option>
                                            <option value="Medium">Medium - Follow-up needed</option>
                                            <option value="High">High - Urgent visit required</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Treatment Suggestion</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. Paracetamol, Isolation"
                                            value={feedback.treatment}
                                            onChange={(e) => setFeedback({ ...feedback, treatment: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Clinical Notes</label>
                                    <textarea
                                        className="input-field"
                                        rows="4"
                                        placeholder="Add your professional observations and advice for the farmer..."
                                        required
                                        value={feedback.note}
                                        onChange={(e) => setFeedback({ ...feedback, note: e.target.value })}
                                        style={{ resize: 'none' }}
                                    ></textarea>
                                </div>

                                {successMessage && (
                                    <div style={{
                                        padding: '1rem',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10b981',
                                        borderRadius: '8px',
                                        marginBottom: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <CheckCircle2 size={18} />
                                        {successMessage}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={isSubmitting}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        {isSubmitting ? 'Submitting...' : <><Save size={18} /> Submit Consultation</>}
                                    </button>
                                    <button
                                        type="button"
                                        className="glass-panel"
                                        onClick={() => setSelectedReport(null)}
                                        style={{ padding: '0 2rem', color: 'var(--text-dim)' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
