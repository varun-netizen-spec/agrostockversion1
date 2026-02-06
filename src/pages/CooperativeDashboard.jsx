import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CooperativeService } from '../services/CooperativeService';
import { Users, Package, TrendingUp, ShieldCheck, PlusCircle, Share2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export default function CooperativeDashboard() {
    const { userData } = useAuth();
    const [coopData, setCoopData] = useState(null);
    const [pooledInventory, setPooledInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joinCode, setJoinCode] = useState('');
    const [createName, setCreateName] = useState('');
    const [view, setView] = useState('dashboard'); // 'dashboard' | 'setup'

    useEffect(() => {
        if (userData?.uid) {
            checkMembership();
        }
    }, [userData]);

    const checkMembership = async () => {
        setLoading(true);
        // User's cooperativeId link would ideally be in their auth profile or we fetch fresh
        const userDoc = await getDoc(doc(db, 'users', userData.uid));
        if (userDoc.exists() && userDoc.data().cooperativeId) {
            const details = await CooperativeService.getCoopDetails(userDoc.data().cooperativeId);
            setCoopData(details);
            const inventory = await CooperativeService.getPooledInventory(userDoc.data().cooperativeId);
            setPooledInventory(inventory);
            setView('dashboard');
        } else {
            setView('setup');
        }
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!createName) return;
        try {
            await CooperativeService.createCooperative(createName, userData.uid);
            checkMembership();
        } catch (e) {
            console.error(e);
            alert("Failed to create cooperative");
        }
    };

    const handleJoin = async () => {
        if (!joinCode) return;
        try {
            await CooperativeService.joinCooperative(joinCode, userData.uid);
            checkMembership();
        } catch (e) {
            console.error(e);
            alert("Failed to join cooperative. Check ID.");
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading Network...</div>;

    // View 1: Setup (Create or Join)
    if (view === 'setup') {
        return (
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
                <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>Cooperative Network</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Join forces with other farmers to fulfill bigger orders and increase earnings.</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Create Card */}
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                        <div style={{ margin: '0 auto 1.5rem', width: '60px', height: '60px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PlusCircle size={32} color="var(--accent-primary)" />
                        </div>
                        <h2 style={{ marginBottom: '1rem' }}>Start a New Union</h2>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter Union Name (e.g. Green Valley)"
                            value={createName}
                            onChange={e => setCreateName(e.target.value)}
                        />
                        <button className="btn-primary" style={{ width: '100%' }} onClick={handleCreate}>Create Network</button>
                    </div>

                    {/* Join Card */}
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                        <div style={{ margin: '0 auto 1.5rem', width: '60px', height: '60px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={32} color="#3b82f6" />
                        </div>
                        <h2 style={{ marginBottom: '1rem' }}>Join Existing</h2>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter Cooperative ID"
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value)}
                        />
                        <button className="btn-primary" style={{ width: '100%', background: '#3b82f6' }} onClick={handleJoin}>Join Network</button>
                    </div>
                </div>
            </div>
        );
    }

    // View 2: Dashboard
    return (
        <div style={{ maxWidth: '1200px' }}>
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{coopData.name} <span style={{ fontSize: '1rem', background: '#e0f2fe', color: '#0284c7', padding: '0.2rem 0.6rem', borderRadius: '12px', verticalAlign: 'middle' }}>Active</span></h1>
                    <p style={{ color: 'var(--text-muted)' }}>Cooperative Network Dashboard</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldCheck size={18} color="var(--accent-primary)" />
                        <span style={{ fontWeight: '600' }}>Admin: {coopData.adminId === userData.uid ? 'You' : 'Member'}</span>
                    </div>
                    <button className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => { navigator.clipboard.writeText(coopData.id); alert('ID Copied!'); }}>
                        <Share2 size={18} />
                        <span>Copy ID: {coopData.id}</span>
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => setView('dashboard')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: view === 'dashboard' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                        color: view === 'dashboard' ? 'white' : 'var(--text-muted)',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Overview
                </button>
                <button
                    onClick={() => setView('find_partners')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: view === 'find_partners' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                        color: view === 'find_partners' ? 'white' : 'var(--text-muted)',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Find Partners
                </button>
            </div>

            {view === 'find_partners' ? (
                <PartnerSearchSection />
            ) : (
                <>
                    {/* Stats Overview */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                        <div className="glass-panel">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3 style={{ color: 'var(--text-muted)' }}>Network Members</h3>
                                <Users size={20} color="var(--accent-primary)" />
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{coopData.members?.length || 1}</div>
                        </div>
                        <div className="glass-panel">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3 style={{ color: 'var(--text-muted)' }}>Pooled Products</h3>
                                <Package size={20} color="#f59e0b" />
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{pooledInventory.reduce((acc, i) => acc + i.totalQuantity, 0)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Units</span></div>
                        </div>
                        <div className="glass-panel">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3 style={{ color: 'var(--text-muted)' }}>Avg Network Price</h3>
                                <TrendingUp size={20} color="#3b82f6" />
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700' }}>₹{Math.round(pooledInventory.reduce((acc, i) => acc + i.avgPrice, 0) / (pooledInventory.length || 1))}</div>
                        </div>
                    </div>

                    {/* Pooled Inventory Table */}
                    {/* ... (Existing Table Code) ... */}
                </>
            )}
        </div>
    );
}

function PartnerSearchSection() {
    const [queryStr, setQueryStr] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        const res = await CooperativeService.searchFarmers(queryStr);
        setResults(res);
        setLoading(false);
    };

    return (
        <div className="glass-panel">
            <h2 style={{ marginBottom: '1.5rem' }}>Find & Invite Partners</h2>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <input
                    type="text"
                    className="input-field"
                    placeholder="Search by Location (e.g. Madurai) or Name..."
                    value={queryStr}
                    onChange={e => setQueryStr(e.target.value)}
                />
                <button className="btn-primary" onClick={handleSearch} disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {results.map(farmer => (
                    <div key={farmer.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <div>
                            <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{farmer.displayName || 'Farmer'}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <ShieldCheck size={14} /> {farmer.address || 'Location Hidden'}
                            </div>
                        </div>
                        <button className="btn-secondary" onClick={() => alert(`Invitation sent to ${farmer.displayName}!`)}>
                            Invite to Join
                        </button>
                    </div>
                ))}
                {results.length === 0 && !loading && <p style={{ color: 'var(--text-muted)' }}>No farmers found matching your criteria.</p>}
            </div>
        </div>
    );
}
