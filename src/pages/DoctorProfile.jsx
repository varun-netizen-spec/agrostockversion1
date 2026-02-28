import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, BookOpen, Award, Clock, Save, AlertCircle } from 'lucide-react';

export default function DoctorProfile() {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        displayName: '',
        phoneNumber: '',
        email: '',
        expertise: '',
        education: '',
        experience: ''
    });

    useEffect(() => {
        async function fetchProfile() {
            if (!userData?.uid) return;
            const docRef = doc(db, 'users', userData.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setFormData({
                    displayName: data.displayName || '',
                    phoneNumber: data.phoneNumber || '',
                    email: data.email || userData.email || '',
                    expertise: data.expertise || '',
                    education: data.education || '',
                    experience: data.experience || ''
                });
            }
        }
        fetchProfile();
    }, [userData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await setDoc(doc(db, 'users', userData.uid), {
                ...formData,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Error updating profile.');
        }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Doctor Profile
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Manage your professional expertise and contact information.</p>
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
                    gap: '0.75rem',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <AlertCircle size={20} />
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                    {/* Basic Info */}
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={18} /> Full Name
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            placeholder="Dr. John Doe"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Phone size={18} /> Phone Number
                        </label>
                        <input
                            type="tel"
                            className="input-field"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            placeholder="+91 98765 43210"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={18} /> Email Address
                        </label>
                        <input
                            type="email"
                            className="input-field"
                            value={formData.email}
                            disabled
                            style={{ opacity: 0.7, cursor: 'not-allowed' }}
                        />
                    </div>

                    {/* Professional Info */}
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Award size={18} /> Area of Expertise
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.expertise}
                            onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                            placeholder="e.g. Livestock Health, Dairy Management"
                        />
                    </div>

                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BookOpen size={18} /> Educational Knowledge
                        </label>
                        <textarea
                            className="input-field"
                            rows="3"
                            value={formData.education}
                            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                            placeholder="e.g. BVSc & AH, MVSc in Veterinary Medicine"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={18} /> Years of Experience
                        </label>
                        <input
                            type="number"
                            className="input-field"
                            value={formData.experience}
                            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '1rem 2.5rem' }} disabled={loading}>
                        <Save size={20} style={{ marginRight: '0.5rem' }} />
                        {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
}
