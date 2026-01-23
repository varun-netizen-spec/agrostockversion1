import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { MapPin, Beef, Save, AlertCircle } from 'lucide-react';

export default function FarmProfile() {
    const { userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        farmName: '',
        district: '',
        state: '',
        herdSize: '',
        cattleBreed: ''
    });

    useEffect(() => {
        async function fetchFarm() {
            if (!userData?.uid) return;
            const farmDoc = await getDoc(doc(db, 'farms', userData.uid));
            if (farmDoc.exists()) {
                setFormData(farmDoc.data());
            }
        }
        fetchFarm();
    }, [userData]);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await setDoc(doc(db, 'farms', userData.uid), {
                ...formData,
                ownerId: userData.uid,
                updatedAt: new Date().toISOString()
            });
            setMessage('Profile updated successfully!');
        } catch (err) {
            console.error(err);
            setMessage('Error updating profile.');
        }
        setLoading(false);
    }

    return (
        <div style={{ maxWidth: '800px' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Farm Profile</h1>
                <p style={{ color: 'var(--text-muted)' }}>Manage your farm location and primary herd details.</p>
            </header>

            {message && (
                <div className="glass-panel" style={{
                    padding: '1rem',
                    marginBottom: '2rem',
                    background: message.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    borderColor: message.includes('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: message.includes('Error') ? '#f87171' : 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <AlertCircle size={20} />
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label className="input-label">Farm Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.farmName}
                            onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                            placeholder="e.g. Green Valley Dairy"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">District</label>
                        <div style={{ position: 'relative' }}>
                            <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input
                                type="text"
                                className="input-field"
                                style={{ paddingLeft: '3rem' }}
                                value={formData.district}
                                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                placeholder="District"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">State</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            placeholder="State"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Herd Size (Cattle count)</label>
                        <div style={{ position: 'relative' }}>
                            <Beef size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input
                                type="number"
                                className="input-field"
                                style={{ paddingLeft: '3rem' }}
                                value={formData.herdSize}
                                onChange={(e) => setFormData({ ...formData, herdSize: e.target.value })}
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Primary Breed</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.cattleBreed}
                            onChange={(e) => setFormData({ ...formData, cattleBreed: e.target.value })}
                            placeholder="e.g. Holstein Friesian"
                        />
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={loading}>
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
}
