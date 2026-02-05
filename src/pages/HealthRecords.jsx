import React, { useState, useEffect } from 'react';
import { Stethoscope, Calendar, Pill, Syringe, Heart, ChevronRight, AlertCircle, Plus, X, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CattleService } from '../services/CattleService';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function HealthRecords() {
    const { userData } = useAuth();
    const [records, setRecords] = useState([]);
    const [cattle, setCattle] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCattleId, setSelectedCattleId] = useState('');

    const [formData, setFormData] = useState({
        cattleId: '',
        type: 'Vaccination',
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        doctor: ''
    });
    const [showReport, setShowReport] = useState(false);
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
        if (userData?.uid) {
            fetchInitialData();
        }
    }, [userData]);

    async function fetchInitialData() {
        try {
            setLoading(true);
            const isAdmin = userData?.role?.toLowerCase() === 'admin';
            const cattleData = await CattleService.getAllCattle(isAdmin ? null : userData.uid);
            setCattle(cattleData);

            const allRecords = [];
            for (const animal of cattleData) {
                const recs = await CattleService.getHealthRecords(animal.id);
                allRecords.push(...recs.map(r => ({ ...r, tagId: animal.tagId })));
            }
            allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
            setRecords(allRecords);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddRecord(e) {
        e.preventDefault();
        try {
            await CattleService.addHealthRecord(formData);
            setShowAddModal(false);
            setFormData({
                cattleId: '',
                type: 'Vaccination',
                title: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                status: 'Completed',
                doctor: ''
            });
            fetchInitialData();
        } catch (err) {
            console.error(err);
        }
    }

    const generateReport = async (animal) => {
        try {
            const animalRecords = await CattleService.getHealthRecords(animal.id);
            const latestFeed = 'Standard Diet';

            const hasIllness = animalRecords.some(r => r.type === 'Illness' && r.status !== 'Recovered');
            const status = hasIllness ? 'Abnormal' : 'Healthy';
            const severity = hasIllness ? 'Needs more attention' : 'Normal';

            setReportData({
                ...animal,
                records: animalRecords,
                diet: 'Standard Diet',
                status,
                severity
            });
            setShowReport(true);
        } catch (error) {
            console.error(error);
        }
    };

    const exportHealthPDF = () => {
        if (!reportData) return;
        const doc = new jsPDF();

        // 🔹 1. Colorful Header Band (Red-Orange for Health/Urgency if needed)
        const isHealthy = reportData.status === 'Healthy';
        const brandColor = isHealthy ? [16, 185, 129] : [248, 113, 113]; // Green or Red

        doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text('AGROSTOCK HEALTH', 14, 22);

        doc.setFontSize(14);
        doc.text(`Medical Record: ${reportData.tagId}`, 14, 32);

        doc.setFontSize(10);
        doc.text(`Status: ${reportData.status.toUpperCase()}`, 160, 22);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 160, 32);

        // 🔹 2. Animal Profile Table
        autoTable(doc, {
            startY: 50,
            head: [['Tag ID', 'Breed', 'Age', 'Sex', 'Diet Strategy']],
            body: [[
                reportData.tagId,
                reportData.breed,
                `${reportData.age} Years`,
                reportData.sex || 'Female',
                reportData.diet
            ]],
            headStyles: { fillColor: brandColor, textColor: [255, 255, 255] }
        });

        // 🔹 3. Health Timeline
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Medical History & Incident Timeline', 14, doc.lastAutoTable.finalY + 15);

        if (reportData.records.length > 0) {
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Date', 'Clinical Event', 'Type', 'Outcome']],
                body: reportData.records.map(r => [
                    r.date,
                    r.title,
                    r.type,
                    { content: r.status, styles: { textColor: r.status === 'Completed' || r.status === 'Recovered' ? [16, 185, 129] : [248, 113, 113] } }
                ]),
                theme: 'grid',
                headStyles: { fillColor: [75, 85, 99], textColor: [255, 255, 255] }
            });
        } else {
            doc.setFontSize(11);
            doc.setTextColor(150);
            doc.text('No historical medical records available for this animal.', 14, doc.lastAutoTable.finalY + 25);
        }

        // 🔹 4. Signature Line
        const finalY = doc.lastAutoTable.finalY + 30;
        doc.setDrawColor(200);
        doc.line(14, finalY, 80, finalY);
        doc.setFontSize(9);
        doc.text('Authorized Vet/Farm Manager Signature', 14, finalY + 5);

        doc.save(`HealthReport_${reportData.tagId}_Color.pdf`);
    };
    return (
        <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Health History</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Track vaccinations, illnesses, and treatments across your herd.</p>
                </div>
                <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowAddModal(true)}>
                    <Plus size={20} />
                    Log Health Event
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>Recent Records Timeline</h2>
                    {loading ? <p>Loading records...</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {records.map((rec, index) => (
                                <div key={rec.id} style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
                                    {index !== records.length - 1 && (
                                        <div style={{ position: 'absolute', left: '20px', top: '40px', bottom: '-25px', width: '2px', background: 'var(--border-color)' }} />
                                    )}
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '12px',
                                        background: rec.type === 'Illness' ? 'rgba(248, 113, 113, 0.1)' : 'var(--accent-glow)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: rec.type === 'Illness' ? '#f87171' : 'var(--accent-primary)', flexShrink: 0, zIndex: 1
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
                                            <span>Status: <span style={{ color: rec.type === 'Illness' ? '#f87171' : 'var(--accent-primary)' }}>{rec.status}</span></span>
                                            {rec.doctor && <span>Administered by: {rec.doctor}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {records.length === 0 && <p>No health records found.</p>}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <section className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Stethoscope size={18} color="var(--accent-primary)" />
                            Health Reports
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {cattle.map(animal => (
                                <button
                                    key={animal.id}
                                    onClick={() => generateReport(animal)}
                                    className="glass-panel cattle-card"
                                    style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', cursor: 'pointer', border: '1px solid var(--border-color)' }}
                                >
                                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{animal.tagId}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{animal.breed}</div>
                                </button>
                            ))}
                            {cattle.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>No cattle found.</p>}
                        </div>
                    </section>
                </div>
            </div>

            {showAddModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ width: '500px', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)' }}><X size={20} /></button>
                        <h2 style={{ marginBottom: '1.5rem' }}>Log Health Event</h2>
                        <form onSubmit={handleAddRecord} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Select Cattle</label>
                                <select className="input-field" required value={formData.cattleId} onChange={e => setFormData({ ...formData, cattleId: e.target.value })}>
                                    <option value="">Select an animal</option>
                                    {cattle.map(c => <option key={c.id} value={c.id}>{c.tagId} ({c.breed})</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Title / Diagnosis</label>
                                <input className="input-field" required placeholder="e.g. FMD Vaccination" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Date</label>
                                    <input type="date" className="input-field" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Type</label>
                                    <select className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="Vaccination">Vaccination</option>
                                        <option value="Illness">Illness</option>
                                        <option value="Treatment">Treatment</option>
                                        <option value="Deworming">Deworming</option>
                                        <option value="Routine">Routine Checkup</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary" disabled={!formData.cattleId}>Save Record</button>
                        </form>
                    </div>
                </div>
            )}

            {showReport && reportData && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>Health Report: {reportData.tagId}</h2>
                            <button onClick={() => setShowReport(false)} style={{ color: 'var(--text-dim)' }}><X size={24} /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                            <div>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Breed</label>
                                <div style={{ fontSize: '1.125rem' }}>{reportData.breed}</div>
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Age & Sex</label>
                                <div style={{ fontSize: '1.125rem' }}>{reportData.age} Years • {reportData.sex || 'Female'}</div>
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</label>
                                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: reportData.status === 'Healthy' ? 'var(--accent-primary)' : '#ef4444' }}>{reportData.status}</div>
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Diet</label>
                                <div style={{ fontSize: '1.125rem' }}>{reportData.diet}</div>
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Severity</label>
                                <div style={{ fontSize: '1.125rem', fontWeight: '600', color: reportData.severity === 'Normal' ? 'inherit' : '#f59e0b' }}>{reportData.severity}</div>
                            </div>
                        </div>
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>Medical History</h3>
                            {reportData.records.length > 0 ? reportData.records.map(rec => (
                                <div key={rec.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                    <div style={{ fontWeight: '600' }}>{rec.title} ({rec.date})</div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>{rec.type} - {rec.status}</div>
                                </div>
                            )) : <p style={{ color: 'var(--text-dim)' }}>No medical records found.</p>}
                        </div>
                        <button className="btn-primary" onClick={exportHealthPDF} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Download size={18} />
                            Download PDF Report
                        </button>
                    </div>
                </div>
            )}
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
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Soon</div>
            </div>
        </div>
    );
}
