import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Scan, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon, User, MapPin, ChevronRight, FileText, Download, Share2, Info, Droplets, TrendingDown, Stethoscope, Activity, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CattleService } from '../services/CattleService';
import { GeminiService } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CattleHealthScanner() {
    const { userData } = useAuth();
    const [cattleList, setCattleList] = useState([]);
    const [selectedCattle, setSelectedCattle] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [report, setReport] = useState(null);
    const [predictiveData, setPredictiveData] = useState(null);
    const [error, setError] = useState(null);
    const [language, setLanguage] = useState('en'); // en or ta
    const [isSharing, setIsSharing] = useState(false);
    const [sharedWithVet, setSharedWithVet] = useState(false);
    const [vets, setVets] = useState([]);
    const [selectedVet, setSelectedVet] = useState('');
    const fileInputRef = useRef(null);

    const ROBOFLOW_API_KEY = import.meta.env.VITE_ROBOFLOW_API_KEY;
    const MODEL_ID = import.meta.env.VITE_ROBOFLOW_MODEL_ID;

    useEffect(() => {
        if (userData?.uid) {
            fetchCattle();
        }
    }, [userData]);

    const fetchCattle = async () => {
        try {
            const data = await CattleService.getAllCattle(userData.uid);
            setCattleList(data);

            // Also fetch available vets
            const vetList = await CattleService.getAllVets();
            setVets(vetList);
        } catch (err) {
            console.error("Fetch Data Error:", err);
        }
    };

    const generateHealthReport = async (predictions) => {
        if (!selectedCattle) {
            setError("Please select a cattle first.");
            return;
        }

        // 1. Map Predictions to Risks (Mock Logic based on class names)
        const risks = {
            'Lumpy Skin Disease': 0,
            'Foot & Mouth Disease': 0,
            'Skin Infection': 0
        };

        predictions.forEach(p => {
            if (p.class.toLowerCase().includes('lumpy')) risks['Lumpy Skin Disease'] = Math.max(risks['Lumpy Skin Disease'], Math.round(p.confidence * 100));
            if (p.class.toLowerCase().includes('fmd') || p.class.toLowerCase().includes('foot')) risks['Foot & Mouth Disease'] = Math.max(risks['Foot & Mouth Disease'], Math.round(p.confidence * 100));
            if (p.class.toLowerCase().includes('skin')) risks['Skin Infection'] = Math.max(risks['Skin Infection'], Math.round(p.confidence * 100));
        });

        // 2. Health Score & Condition
        const maxRisk = Math.max(...Object.values(risks));
        const healthScore = Math.max(0, 100 - maxRisk);
        let condition = 'Healthy';
        let severity = 'Green';
        if (maxRisk > 60) { condition = 'Critical'; severity = 'Red'; }
        else if (maxRisk > 20) { condition = 'At Risk'; severity = 'Yellow'; }

        // 3. Economic Impact & Recommendations
        const yieldLoss = maxRisk > 60 ? 40 : (maxRisk > 20 ? 15 : 0);
        const financialLoss = (yieldLoss / 100) * 500; // Mock 500 INR/day potential loss

        const recommendations = [];
        if (condition === 'Critical') {
            recommendations.push("ISOLATION REQUIRED immediately.");
            recommendations.push("Contact veterinarian urgently.");
            recommendations.push("Deep clean the stable area.");
        } else if (condition === 'At Risk') {
            recommendations.push("Monitor closely for 48 hours.");
            recommendations.push("Increase vitamins in feed.");
            recommendations.push("Apply preventive skin spray.");
        } else {
            recommendations.push("Continue regular checkups.");
            recommendations.push("Ensure balanced nutrition.");
        }

        // 4. Report Object
        const fullReport = {
            cattleId: selectedCattle.id,
            tagId: selectedCattle.tagId,
            breed: selectedCattle.breed,
            age: selectedCattle.age,
            farmId: userData.uid,
            scanType: 'image',
            healthScore,
            condition,
            severity,
            risks,
            recommendations,
            economicImpact: {
                yieldReduction: yieldLoss,
                financialLoss: financialLoss
            },
            predictions,
            timestamp: new Date().toISOString()
        };

        // 5. Gemini Explanation (with resilience)
        try {
            const explanationEn = await GeminiService.getHealthExplanation(fullReport, 'en');
            const explanationTa = await GeminiService.getHealthExplanation(fullReport, 'ta');
            fullReport.explanation = { en: explanationEn, ta: explanationTa };
        } catch (geminiErr) {
            console.warn("AI Explanation failed, but saving report anyway:", geminiErr);
            fullReport.explanation = {
                en: "AI explanation is temporarily unavailable. Please refer to detection counts and recommendations.",
                ta: "AI விளக்கம் தற்போது கிடைக்கவில்லை. தயவுசெய்து மேலே உள்ள பரிந்துரைகளைப் பின்பற்றவும்."
            };
        }

        // 6. Save to Firebase & Capture ID
        const reportId = await CattleService.saveScanReport(fullReport);

        // 7. Fetch Predictive Data
        const pData = await CattleService.getPredictiveAnalysis(selectedCattle.id);
        setPredictiveData(pData);

        // 8. Set final report with ID for sharing
        setReport({ ...fullReport, id: reportId });
    };

    const handleShareWithVet = async () => {
        if (!report?.id || !selectedVet) {
            if (!selectedVet) setError("Please select a veterinarian first.");
            return;
        }

        setIsSharing(true);
        setError(null);
        try {
            await CattleService.shareReport(report.id, userData.uid, selectedVet);
            setSharedWithVet(true);
        } catch (err) {
            console.error("Sharing error:", err);
            setError("Failed to share report. Please check your connection.");
        } finally {
            setIsSharing(false);
        }
    };

    const runInference = async () => {
        if (!selectedImage) return;
        if (!selectedCattle) {
            setError("Please select a cattle from your inventory first.");
            return;
        }

        setIsScanning(true);
        setError(null);
        setReport(null);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(selectedImage);
            reader.onloadend = async () => {
                const base64Data = reader.result.split(',')[1];

                const response = await fetch(`https://detect.roboflow.com/${MODEL_ID}?api_key=${ROBOFLOW_API_KEY}`, {
                    method: "POST",
                    body: base64Data,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                });

                const data = await response.json();

                if (data.predictions) {
                    await generateHealthReport(data.predictions);
                } else {
                    setError("Failed to get a clear analysis. Please try a clearer image.");
                }
                setIsScanning(false);
            };
        } catch (err) {
            console.error("Inference Error:", err);
            setError("An error occurred during scanning. Please check your connection.");
            setIsScanning(false);
        }
    };

    const exportPDF = () => {
        if (!report) return;
        const doc = new jsPDF();

        // Header
        doc.setFillColor(report.severity === 'Red' ? 220 : (report.severity === 'Yellow' ? 245 : 16),
            report.severity === 'Red' ? 38 : (report.severity === 'Yellow' ? 158 : 185),
            report.severity === 'Red' ? 38 : (report.severity === 'Yellow' ? 11 : 129));
        doc.rect(0, 0, 210, 40, 'F');

        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text('CATTLE HEALTH REPORT', 14, 25);

        doc.setFontSize(10);
        doc.text(`Report Date: ${new Date(report.timestamp).toLocaleString()}`, 14, 35);
        doc.text(`Status: ${report.condition.toUpperCase()}`, 160, 25);

        // Cattle Info
        doc.setFontSize(14);
        doc.setTextColor(50);
        doc.text('1. Cattle Profile', 14, 50);
        autoTable(doc, {
            startY: 55,
            head: [['Tag ID', 'Breed', 'Age', 'Health Score', 'Condition']],
            body: [[report.tagId, report.breed, report.age, `${report.healthScore}/100`, report.condition]],
            headStyles: { fillColor: [75, 85, 99] }
        });

        // Disease Risks
        doc.text('2. Disease Risk Prediction', 14, doc.lastAutoTable.finalY + 15);
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Disease', 'Risk Probability (%)']],
            body: Object.entries(report.risks).map(([name, risk]) => [name, `${risk}%`]),
            headStyles: { fillColor: [56, 189, 248] }
        });

        // Recommendations
        doc.text('3. Recommendations', 14, doc.lastAutoTable.finalY + 15);
        doc.setFontSize(10);
        report.recommendations.forEach((rec, i) => {
            doc.text(`- ${rec}`, 18, doc.lastAutoTable.finalY + 22 + (i * 7));
        });

        // Economic Impact
        const impactY = doc.lastAutoTable.finalY + 22 + (report.recommendations.length * 7) + 5;
        doc.setFontSize(14);
        doc.text('4. Economic Impact Projection', 14, impactY);
        autoTable(doc, {
            startY: impactY + 5,
            head: [['Impact Type', 'Estimated Loss']],
            body: [
                ['Expected Milk Yield Reduction', `${report.economicImpact.yieldReduction}%`],
                ['Financial Loss Projection (Monthly)', `₹${(report.economicImpact.financialLoss * 30).toLocaleString()}`]
            ],
            headStyles: { fillColor: [248, 113, 113] }
        });

        doc.save(`AgroStock_Health_${report.tagId}.pdf`);
    };

    return (
        <div className="page-container" style={{ paddingBottom: '5rem' }}>
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Cattle Health Intelligence</h1>
                    <p className="page-subtitle">Early intervention & data-driven livestock monitoring</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '8px' }}>
                    <button
                        onClick={() => setLanguage('en')}
                        style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: language === 'en' ? 'var(--accent-primary)' : 'transparent', color: language === 'en' ? 'white' : 'var(--text-dim)', cursor: 'pointer' }}
                    >
                        English
                    </button>
                    <button
                        onClick={() => setLanguage('ta')}
                        style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: language === 'ta' ? 'var(--accent-primary)' : 'transparent', color: language === 'ta' ? 'white' : 'var(--text-dim)', cursor: 'pointer' }}
                    >
                        தமிழ்
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: report ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                {/* 🔹 Left/Top: Selection & Upload Section */}
                {!report && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                                <User size={18} color="var(--accent-primary)" />
                                1. Select Cattle to Scan
                            </h3>
                            <div className="input-group">
                                <select
                                    className="input-field"
                                    value={selectedCattle?.id || ''}
                                    onChange={(e) => {
                                        const c = cattleList.find(cat => cat.id === e.target.value);
                                        setSelectedCattle(c);
                                    }}
                                    style={{ marginBottom: 0 }}
                                >
                                    <option value="">-- Choose from Inventory --</option>
                                    {cattleList.map(c => (
                                        <option key={c.id} value={c.id}>{c.tagId} - {c.breed}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', textAlign: 'left' }}>
                                <Camera size={18} color="var(--accent-primary)" />
                                2. Input Source (Image/Video)
                            </h3>
                            <div
                                onClick={() => fileInputRef.current.click()}
                                style={{
                                    border: '2px dashed var(--border-color)',
                                    borderRadius: '12px',
                                    padding: '3rem 1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    background: 'rgba(255,255,255,0.02)',
                                    marginBottom: '1.5rem'
                                }}
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                                        <Upload size={48} />
                                        <p>Click or drag cattle image/video here</p>
                                        <span style={{ fontSize: '0.8rem' }}>Linked to Tag: {selectedCattle?.tagId || 'None'}</span>
                                    </div>
                                )}
                            </div>

                            <input type="file" ref={fileInputRef} onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    setSelectedImage(file);
                                    setPreviewUrl(URL.createObjectURL(file));
                                    setReport(null);
                                    setError(null);
                                }
                            }} style={{ display: 'none' }} accept="image/*,video/*" />

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button
                                    className="glass-panel"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'var(--accent-primary)', border: 'none', width: '100%', justifyContent: 'center' }}
                                    onClick={runInference}
                                    disabled={!selectedImage || isScanning || !selectedCattle}
                                >
                                    {isScanning ? <Loader2 className="animate-spin" size={20} /> : <Scan size={20} />}
                                    {isScanning ? 'Analyzing Cattle Health...' : 'Run Intelligence Scan'}
                                </button>
                            </div>
                            {error && <p style={{ color: '#f87171', marginTop: '1rem', fontSize: '0.875rem' }}>{error}</p>}
                        </div>
                    </div>
                )}

                {/* 🔹 Right/Full: Report Section */}
                {report && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Status Hero Card */}
                        <div className="glass-panel" style={{
                            padding: '2rem',
                            borderLeft: `8px solid ${report.severity === 'Red' ? '#ef4444' : (report.severity === 'Yellow' ? '#f59e0b' : '#10b981')}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: report.severity === 'Red' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '99px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        background: report.severity === 'Red' ? '#ef4444' : (report.severity === 'Yellow' ? '#f59e0b' : '#10b981'),
                                        color: 'white'
                                    }}>
                                        {report.condition.toUpperCase()}
                                    </span>
                                    <span style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Scan ID: {report.timestamp.slice(0, 10)}</span>
                                </div>
                                <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Health Score: {report.healthScore}%</h1>
                                <p style={{ color: 'var(--text-muted)' }}>Condition Trend: <span style={{ color: '#10b981' }}>Stable</span></p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <button onClick={() => setReport(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', marginBottom: '1rem' }}>
                                    <ChevronRight size={24} /> New Scan
                                </button>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {!sharedWithVet && (
                                        <select
                                            className="input-field"
                                            style={{ marginBottom: 0, fontSize: '0.8rem', padding: '0.25rem' }}
                                            value={selectedVet}
                                            onChange={(e) => setSelectedVet(e.target.value)}
                                        >
                                            <option value="">-- Select Vet --</option>
                                            {vets.map(v => (
                                                <option key={v.uid} value={v.uid}>{v.email} (Vet)</option>
                                            ))}
                                            <option value="invite">Invite via Email...</option>
                                        </select>
                                    )}
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={exportPDF} className="glass-panel" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Download size={16} /> PDF
                                        </button>
                                        <button
                                            onClick={handleShareWithVet}
                                            disabled={isSharing || sharedWithVet || !selectedVet}
                                            className="glass-panel"
                                            style={{
                                                padding: '0.5rem 1rem',
                                                fontSize: '0.875rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                flex: 1,
                                                color: sharedWithVet ? 'var(--accent-primary)' : 'inherit',
                                                borderColor: sharedWithVet ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'
                                            }}
                                        >
                                            {isSharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                                            {sharedWithVet ? 'Report Shared' : 'Share with Vet'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Report Details Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {/* Profile Info */}
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <SectionHeader icon={<User size={18} />} title="Cattle Profile" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                    <ReportItem label="Tag ID" value={report.tagId} />
                                    <ReportItem label="Breed" value={report.breed} />
                                    <ReportItem label="Age" value={report.age} />
                                    <ReportItem label="Farm ID" value={report.farmId.slice(0, 8)} />
                                </div>
                            </div>

                            {/* Risk Predictions */}
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <SectionHeader icon={<Scan size={18} />} title="Disease Risk Prediction" />
                                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {Object.entries(report.risks).map(([name, probability]) => (
                                        <div key={name}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                                <span>{name}</span>
                                                <span style={{ fontWeight: 'bold', color: probability > 50 ? '#ef4444' : 'inherit' }}>{probability}%</span>
                                            </div>
                                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                                                <div style={{ width: `${probability}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '3px' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Economic Impact */}
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <SectionHeader icon={<TrendingDown size={18} />} title="Economic Impact Estimation" />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444' }}>
                                            <Droplets size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Milk Yield Reduction</div>
                                            <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>-{report.economicImpact.yieldReduction}% Predicted</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: '#10b981' }}>
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Monthly Revenue Risk</div>
                                            <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>₹{(report.economicImpact.financialLoss * 30).toLocaleString()} Potential Loss</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Predictive Health Timeline (New Powerful Feature) */}
                        <div className="glass-panel" style={{
                            padding: '1.5rem',
                            background: predictiveData?.riskLevel === 'High' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                            border: `1px solid ${predictiveData?.riskLevel === 'High' ? '#ef4444' : '#10b981'}`
                        }}>
                            <SectionHeader
                                icon={<TrendingDown size={18} color={predictiveData?.riskLevel === 'High' ? '#ef4444' : '#10b981'} />}
                                title="Predictive Health Timeline"
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            background: predictiveData?.riskLevel === 'High' ? '#ef4444' : '#10b981',
                                            color: 'white'
                                        }}>
                                            {predictiveData?.riskWindow}
                                        </span>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Risk Level: {predictiveData?.riskLevel}</span>
                                    </div>
                                    <p style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>
                                        “{predictiveData?.prediction}”
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Trend Analysis</div>
                                    <div style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 'bold',
                                        color: predictiveData?.trend === 'Improving' ? '#10b981' : '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        justifyContent: 'flex-end'
                                    }}>
                                        {predictiveData?.trend}
                                        {predictiveData?.trend === 'Improving' ? '↑' : '↓'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Based on last {predictiveData ? 5 : 0} scans</div>
                                </div>
                            </div>

                            {/* Simple Visual Timeline */}
                            <div style={{ marginTop: '1.5rem', position: 'relative', height: '40px', display: 'flex', alignItems: 'center' }}>
                                <div style={{ position: 'absolute', width: '100%', height: '2px', background: 'var(--border-color)', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', zIndex: 2 }}>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: i === 5 ? 'var(--accent-primary)' : 'var(--text-dim)',
                                            border: '2px solid var(--bg-primary)'
                                        }} />
                                    ))}
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        background: predictiveData?.riskLevel === 'High' ? '#ef4444' : '#10b981',
                                        border: '3px solid var(--bg-primary)',
                                        boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                                    }} />
                                </div>
                                <div style={{ position: 'absolute', right: '-10px', top: '-15px', fontSize: '0.6rem', color: predictiveData?.riskLevel === 'High' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                    PREDICTION
                                </div>
                            </div>
                        </div>

                        {/* AI Explanation Bar */}
                        <div className="glass-panel" style={{
                            padding: '1.5rem',
                            background: 'var(--accent-glow)',
                            border: '1px solid var(--accent-primary)',
                            display: 'flex',
                            gap: '1.5rem',
                            alignItems: 'flex-start'
                        }}>
                            <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--accent-primary)' }}>
                                <Info size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Gemini AI Health Explanation
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 'normal' }}>({language === 'ta' ? 'தமிழ்' : 'English'})</span>
                                </h3>
                                <p style={{ fontSize: '1.125rem', lineHeight: '1.5', color: 'var(--text-main)', fontStyle: 'italic' }}>
                                    "{report.explanation[language]}"
                                </p>
                            </div>
                        </div>

                        {/* Recommendations, Feed & Vet Notes */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <SectionHeader icon={<FileText size={18} />} title="Actionable Recommendations" />
                                <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {report.recommendations.map((rec, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                                            {rec}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <SectionHeader icon={<Droplets size={18} />} title="Feed & Care" />
                                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Food Optimization</div>
                                        {report.condition === 'Healthy' ? 'Maintain current protein levels.' : 'Add vitamin-mix and soft fodder.'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Hygiene</div>
                                        {report.condition === 'Healthy' ? 'Standard cleaning.' : 'Daily antiseptic wash for patches.'}
                                    </div>
                                </div>
                            </div>
                            <div className="glass-panel" style={{
                                padding: '1.5rem',
                                border: report.vetNotes ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                background: report.vetNotes ? 'rgba(16, 185, 129, 0.02)' : 'transparent'
                            }}>
                                <SectionHeader icon={<Stethoscope size={18} />} title="Vet Professional Feedback" />
                                {report.vetNotes ? (
                                    <div style={{ marginTop: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{report.vetNotes.vetName}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{new Date(report.vetNotes.date).toLocaleDateString()}</span>
                                        </div>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontStyle: 'italic', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px' }}>
                                            "{report.vetNotes.note}"
                                        </p>
                                        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--accent-primary)' }}>
                                            <CheckCircle2 size={12} /> Verified by Livestock Department
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                                        {sharedWithVet ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                                <Loader2 size={24} className="animate-spin" />
                                                Waiting for vet review...
                                            </div>
                                        ) : (
                                            <p>Share this report to get professional advice from our network of veterinarians.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SectionHeader({ icon, title }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            {icon}
            <span style={{ fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{title}</span>
        </div>
    );
}

function ReportItem({ label, value }) {
    return (
        <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{value}</div>
        </div>
    );
}

