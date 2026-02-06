import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { VetCaseService } from '../services/VetCaseService';
import {
    Activity, AlertTriangle, Clipboard, CheckCircle, Clock,
    Stethoscope, FileText, ChevronRight, Save, User
} from 'lucide-react';
import { db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function VetDashboard() {
    const { userData } = useAuth();
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userData?.uid) {
            loadCases();
        }
    }, [userData]);

    const loadCases = async () => {
        setLoading(true);
        const data = await VetCaseService.getAssignedCases(userData.uid);
        //Sort logic: Critical first, then by date
        const sorted = data.sort((a, b) => {
            const severityWeight = { 'Critical': 3, 'Medium': 2, 'Low': 1 };
            const wA = severityWeight[a.severity] || 0;
            const wB = severityWeight[b.severity] || 0;
            return wB - wA; // Descending severity
        });
        setCases(sorted);
        setLoading(false);
    };

    const handleUpdateStatus = async (status) => {
        if (!selectedCase) return;
        await VetCaseService.updateCaseStatus(selectedCase.id, status, selectedCase.severity);
        setSelectedCase(prev => ({ ...prev, status }));
        loadCases(); // Refresh list
    };

    const criticalCases = cases.filter(c => c.severity === 'Critical' && c.status !== 'Resolved');

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem', height: 'calc(100vh - 100px)' }}>

            {/* LEFT COLUMN: Case List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>My Cases</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{cases.length} active records</p>
                </div>

                {/* Emergency Queue */}
                {criticalCases.length > 0 && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                        <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                            <AlertTriangle size={16} /> EMERGENCY QUEUE
                        </h3>
                        {criticalCases.map(c => (
                            <div
                                key={c.id}
                                onClick={() => setSelectedCase(c)}
                                style={{
                                    background: 'white', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem', cursor: 'pointer',
                                    border: selectedCase?.id === c.id ? '2px solid #ef4444' : '1px solid #fee2e2'
                                }}
                            >
                                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{c.cattleId || 'Unknown Cattle'}</div>
                                <div style={{ fontSize: '0.85rem', color: '#ef4444' }}>High Fever / Critical</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* All Cases List */}
                {cases.filter(c => c.severity !== 'Critical' || c.status === 'Resolved').map(c => (
                    <div
                        key={c.id}
                        onClick={() => setSelectedCase(c)}
                        className="glass-panel"
                        style={{
                            padding: '1rem', cursor: 'pointer',
                            borderLeft: selectedCase?.id === c.id ? '4px solid var(--accent-primary)' : 'none',
                            background: selectedCase?.id === c.id ? 'var(--bg-secondary)' : 'var(--bg-primary)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: '600' }}>{c.cattleId || 'Cattle #N/A'}</span>
                            <span style={{ fontSize: '0.8rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: c.status === 'Resolved' ? '#dcfce7' : '#fef9c3', color: c.status === 'Resolved' ? '#166534' : '#854d0e' }}>
                                {c.status || 'Pending'}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {c.farmName || 'Unknown Farm'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={12} /> {c.timestamp ? new Date(c.timestamp).toLocaleDateString() : 'Recent'}
                        </div>
                    </div>
                ))}
            </div>

            {/* RIGHT COLUMN: Case Detail & Workspace */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                {selectedCase ? (
                    <>
                        {/* Detail Header */}
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    Case #{selectedCase.id.slice(0, 6)}
                                    {selectedCase.severity === 'Critical' && <span style={{ fontSize: '0.8rem', background: '#ef4444', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>CRITICAL</span>}
                                </h2>
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><User size={16} /> Farmer: {selectedCase.farmName || 'Unknown'}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Activity size={16} /> Detection: {selectedCase.diseaseName || 'Analysis Pending'}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {['Pending', 'In Progress', 'Resolved'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleUpdateStatus(s)}
                                        style={{
                                            padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer',
                                            background: selectedCase.status === s ? 'var(--accent-primary)' : 'transparent',
                                            color: selectedCase.status === s ? 'white' : 'var(--text-muted)'
                                        }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Workspace Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                            {/* Left: Clinical Data */}
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>Clinical Report</h3>
                                <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                                    {selectedCase.imageUrl && (
                                        <img src={selectedCase.imageUrl} alt="Scan" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />
                                    )}
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Confidence Score</label>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedCase.confidence ? (selectedCase.confidence * 100).toFixed(1) + '%' : 'N/A'}</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Symptoms Detected</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            {selectedCase.symptoms ? selectedCase.symptoms.map(s => (
                                                <span key={s} style={{ background: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem', border: '1px solid var(--border-color)' }}>{s}</span>
                                            )) : <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No specific symptoms logged</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Treatment & Notes */}
                            <TreatmentPanel caseId={selectedCase.id} existingNotes={selectedCase.clinicalNotes || []} />

                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', flexDirection: 'column', gap: '1rem' }}>
                        <Stethoscope size={48} opacity={0.2} />
                        <p>Select a case from the list to view details.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function TreatmentPanel({ caseId, existingNotes }) {
    const [note, setNote] = useState('');
    const [notesList, setNotesList] = useState(existingNotes);

    const handleAddNote = async () => {
        if (!note.trim()) return;
        const noteObj = { text: note, author: 'Vet', type: 'Note', timestamp: new Date().toISOString() };
        await VetCaseService.addClinicalNote(caseId, noteObj);
        setNotesList([...notesList, noteObj]);
        setNote('');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>Initial Treatment & Notes</h3>

            {/* Notes History */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {notesList.length > 0 ? notesList.map((n, i) => (
                    <div key={i} style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{n.text}</p>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                            {new Date(n.timestamp).toLocaleString()} • {n.author}
                        </div>
                    </div>
                )) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                        No clinical notes added yet.
                    </div>
                )}
            </div>

            {/* Input */}
            <div style={{ marginTop: 'auto' }}>
                <textarea
                    className="input-field"
                    rows="4"
                    placeholder="Type clinical observations or treatment plan..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    style={{ marginBottom: '1rem' }}
                />
                <button
                    className="btn-primary"
                    onClick={handleAddNote}
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Save size={18} /> Add Clinical Note
                </button>
            </div>
        </div>
    );
}
