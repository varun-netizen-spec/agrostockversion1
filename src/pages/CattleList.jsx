import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, Beef, Calendar, ChevronRight } from 'lucide-react';

export default function CattleList() {
    const { userData } = useAuth();
    const [cattle, setCattle] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Sample data for demonstration
    useEffect(() => {
        setCattle([
            { id: '1', tagId: 'C-1024', breed: 'Jersey', age: '3 yrs', gender: 'Female', status: 'Healthy' },
            { id: '2', tagId: 'C-1025', breed: 'Holstein', age: '2 yrs', gender: 'Female', status: 'Vaccination Due' },
            { id: '3', tagId: 'C-1026', breed: 'Gir', age: '5 yrs', gender: 'Male', status: 'Treatment' },
        ]);
    }, [userData]);

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
                            <InfoItem label="Last Checkup" value="Jan 12, 2026" />
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
            </div>
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
