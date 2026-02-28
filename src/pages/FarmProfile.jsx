import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Beef, Save, AlertCircle } from 'lucide-react';

export default function FarmProfile() {
    const { userData, updateUserRole } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        farmName: '',
        farmerName: '',
        mobile: '',
        email: '',
        language: 'English',
        role: 'Farmer',
        village: '',
        district: '',
        state: '',
        landArea: '',
        herdSize: '',
        cattleBreed: '',
        experience: ''
    });

    useEffect(() => {
        async function fetchInitialData() {
            if (!userData?.uid) return;
            // Fetch farm data
            const farmDoc = await getDoc(doc(db, 'farms', userData.uid));
            if (farmDoc.exists()) {
                setFormData(prev => ({ ...prev, ...farmDoc.data() }));
            } else {
                // Pre-fill from userData if farmDoc doesn't exist
                setFormData(prev => ({
                    ...prev,
                    farmerName: userData.displayName || prev.farmerName || '',
                    email: userData.email,
                    role: userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'Farmer'
                }));
            }
        }
        fetchInitialData();
    }, [userData]);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            // Update Farm Doc
            await setDoc(doc(db, 'farms', userData.uid), {
                ...formData,
                ownerId: userData.uid,
                updatedAt: new Date().toISOString()
            });

            // Sync Role to User Doc
            await updateUserRole(formData.role);

            setMessage('Profile updated successfully! Redirecting...');
            setTimeout(() => navigate('/'), 1500);
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
                    <h3 style={{ gridColumn: 'span 2', fontSize: '1.125rem', color: 'var(--accent-primary)', marginTop: '1rem' }}>Farmer Information</h3>
                    <div className="input-group">
                        <label className="input-label">Farmer Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.farmerName}
                            onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                            placeholder="Full Name"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Mobile Number</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.mobile}
                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                            placeholder="+91"
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Preferred Language</label>
                        <select
                            className="input-field"
                            value={formData.language}
                            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        >
                            <option value="English">English</option>
                            <option value="Tamil">தமிழ் (Tamil)</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Role</label>
                        <select
                            className="input-field"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="Farmer">Farmer</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Ownership Status</label>
                        <select
                            className="input-field"
                            value={formData.ownershipStatus || 'Owned'}
                            onChange={(e) => setFormData({ ...formData, ownershipStatus: e.target.value })}
                        >
                            <option value="Owned">Owned</option>
                            <option value="Leased">Leased</option>
                            <option value="Family Owned">Family Owned</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <h3 style={{ gridColumn: 'span 2', fontSize: '1.125rem', color: 'var(--accent-primary)', marginTop: '2rem' }}>Farm Overview</h3>
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
                        <label className="input-label">Village / Locality</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.village}
                            onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                            placeholder="Village"
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
                        <label className="input-label">Total Land Area (Acres)</label>
                        <input
                            type="number"
                            className="input-field"
                            value={formData.landArea}
                            onChange={(e) => setFormData({ ...formData, landArea: e.target.value })}
                            placeholder="Optional"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Experience (Years)</label>
                        <input
                            type="number"
                            className="input-field"
                            value={formData.experience}
                            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                            placeholder="Years of Farming"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Herd Size</label>
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

                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label className="input-label">Primary Cattle Breeds</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.cattleBreed}
                            onChange={(e) => setFormData({ ...formData, cattleBreed: e.target.value })}
                            placeholder="e.g. Jersey, HF, Native"
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
