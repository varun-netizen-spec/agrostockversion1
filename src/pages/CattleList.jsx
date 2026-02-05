import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Beef, Calendar, ChevronRight, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CattleService } from '../services/CattleService';

export default function CattleList() {
    const { userData } = useAuth();
    const [cattle, setCattle] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form data for new cattle
    const [formData, setFormData] = useState({
        tagId: '',
        breed: '',
        age: '',
        gender: 'Female',
        status: 'Healthy'
    });

    useEffect(() => {
        if (userData?.uid) {
            fetchCattle();
        }
    }, [userData]);

    async function fetchCattle() {
        try {
            setLoading(true);
            const isAdmin = userData?.role?.toLowerCase() === 'admin';
            const data = await CattleService.getAllCattle(isAdmin ? null : userData.uid);
            setCattle(data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch cattle list.');
        } finally {
            setLoading(false);
        }
    }

    async function handleAddCattle(e) {
        e.preventDefault();
        try {
            await CattleService.addCattle({
                ...formData,
                ownerId: userData.uid
            });
            setShowAddModal(false);
            setFormData({ tagId: '', breed: '', age: '', gender: 'Female', status: 'Healthy' });
            fetchCattle();
        } catch (err) {
            console.error(err);
            setError('Failed to add cattle.');
        }
    }

    const filteredCattle = cattle.filter(c =>
        c.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.breed.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Cattle Inventory</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage individual cattle profiles and their health logs.</p>
                </div>
                <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowAddModal(true)}>
                    <Plus size={20} />
                    Add New Cattle
                </button>
            </header>

            {error && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '8px', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                        type="text"
                        className="input-field"
                        style={{ paddingLeft: '3rem', marginBottom: 0 }}
                        placeholder="Search by Tag ID or Breed..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="glass-panel" style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <Filter size={18} />
                    Filters
                </button>
            </div>

            {loading ? (
                <p>Loading cattle records...</p>
            ) : (
                <div className="cattle-grid">
                    {filteredCattle.map(animal => (
                        <div key={animal.id} className="cattle-card glass-panel">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ padding: '0.5rem', background: 'var(--accent-glow)', borderRadius: '8px' }}>
                                        <Beef size={20} color="var(--accent-primary)" />
                                    </div>
                                    <h3 style={{ fontSize: '1.125rem' }}>{animal.tagId}</h3>
                                </div>
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '99px',
                                    background: animal.status === 'Healthy' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                                    color: animal.status === 'Healthy' ? 'var(--accent-primary)' : '#f87171',
                                    border: '1px solid currentColor'
                                }}>
                                    {animal.status}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <InfoItem label="Breed" value={animal.breed} />
                                <InfoItem label="Age" value={animal.age} />
                                <InfoItem label="Gender" value={animal.gender} />
                                <InfoItem label="Action" value="Update Profile" />
                            </div>

                            {/* Cattle Lifecycle Timeline */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '600' }}>Lifecycle Timeline</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)' }}>Production Phase</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {[
                                        { label: 'Birth', active: true },
                                        { label: 'Growth', active: true },
                                        { label: 'Production', active: true },
                                        { label: 'Dry Period', active: false }
                                    ].map((step, idx, arr) => (
                                        <React.Fragment key={idx}>
                                            <div style={{
                                                width: '12px', height: '12px', borderRadius: '50%',
                                                background: step.active ? 'var(--accent-primary)' : 'var(--border-color)',
                                                boxShadow: step.active ? '0 0 8px var(--accent-primary)' : 'none'
                                            }} />
                                            {idx < arr.length - 1 && <div style={{ flex: 1, height: '2px', background: step.active && arr[idx + 1].active ? 'var(--accent-primary)' : 'var(--border-color)' }} />}
                                        </React.Fragment>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '10px', color: 'var(--text-dim)' }}>
                                    <span>Birth</span>
                                    <span>Dry</span>
                                </div>
                            </div>



                            <button style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                color: 'var(--text-muted)',
                                fontSize: '0.875rem'
                            }}>
                                View Full Profile
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    ))}
                    {filteredCattle.length === 0 && <p>No cattle found. Click "Add New Cattle" to start.</p>}
                </div>
            )}

            {showAddModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ width: '500px', padding: '2rem', position: 'relative' }}>
                        <button
                            onClick={() => setShowAddModal(false)}
                            style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)' }}
                        >
                            <X size={20} />
                        </button>
                        <h2 style={{ marginBottom: '1.5rem' }}>Add New Cattle</h2>
                        <form onSubmit={handleAddCattle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Unique Tag ID</label>
                                <input
                                    className="input-field"
                                    required
                                    value={formData.tagId}
                                    onChange={e => setFormData({ ...formData, tagId: e.target.value })}
                                    placeholder="e.g. C-1024"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Breed</label>
                                <input
                                    className="input-field"
                                    required
                                    value={formData.breed}
                                    onChange={e => setFormData({ ...formData, breed: e.target.value })}
                                    placeholder="e.g. Jersey"
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Age (e.g. 2 yrs)</label>
                                    <input
                                        className="input-field"
                                        required
                                        value={formData.age}
                                        onChange={e => setFormData({ ...formData, age: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Gender</label>
                                    <select
                                        className="input-field"
                                        value={formData.gender}
                                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="Female">Female</option>
                                        <option value="Male">Male</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary">Add Cattle</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoItem({ label, value }) {
    return (
        <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>{label}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{value}</span>
        </div>
    );
}

