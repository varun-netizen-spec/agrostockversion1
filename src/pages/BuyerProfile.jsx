import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { User, MapPin, Phone, Mail, Wallet, Clock, Save, Edit2 } from 'lucide-react';

export default function BuyerProfile() {
    const { userData } = useAuth();
    const [profile, setProfile] = useState({
        displayName: '',
        email: '',
        phone: '',
        address: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userData?.uid) {
            fetchProfileData();
        }
    }, [userData]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            // 1. Fetch User Profile
            const userDoc = await getDoc(doc(db, 'users', userData.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setProfile({
                    displayName: data.displayName || userData.displayName || '',
                    email: data.email || userData.email || '',
                    phone: data.phoneNumber || '',
                    address: data.address || ''
                });
            }

            // 2. Fetch Wallet Balance
            const walletDoc = await getDoc(doc(db, 'wallets', userData.uid));
            if (walletDoc.exists()) {
                setWalletBalance(walletDoc.data().balance || 0);
            }

            // 3. Fetch Recent Orders
            const q = query(
                collection(db, 'orders'),
                where('buyerId', '==', userData.uid),
                orderBy('createdAt', 'desc'),
                limit(5)
            );
            const orderSnaps = await getDocs(q);
            setRecentOrders(orderSnaps.docs.map(d => ({ id: d.id, ...d.data() })));

            setLoading(false);
        } catch (error) {
            console.error("Error loading profile:", error);
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await updateDoc(doc(db, 'users', userData.uid), {
                displayName: profile.displayName,
                phoneNumber: profile.phone,
                address: profile.address
            });
            setIsEditing(false);
            alert("Profile Updated!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>My Profile</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem', alignItems: 'start' }}>

                {/* Left Column: Wallet & Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Wallet Card */}
                    <div className="glass-panel" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', opacity: 0.9 }}>
                            <Wallet size={24} />
                            <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>Wallet Balance</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                            ₹{walletBalance.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Available for purchases</div>
                    </div>

                    {/* Quick Stats */}
                    <div className="glass-panel">
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={18} /> Recent Orders
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {recentOrders.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>No recent orders.</p>
                            ) : (
                                recentOrders.map(order => (
                                    <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                        <div>
                                            <div style={{ fontWeight: '500' }}>{order.productName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: '600' }}>₹{order.total}</div>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: order.status === 'Completed' ? 'var(--accent-primary)' :
                                                    order.status === 'Rejected' ? '#ef4444' : '#f59e0b'
                                            }}>
                                                {order.status}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Personal Details */}
                <div className="glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Personal Details</h2>
                        <button
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            className="btn-primary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        >
                            {isEditing ? <><Save size={16} style={{ marginRight: '0.5rem' }} /> Save Changes</> : <><Edit2 size={16} style={{ marginRight: '0.5rem' }} /> Edit Profile</>}
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)' }}>
                                <User size={18} /> Full Name
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="input-field"
                                    value={profile.displayName}
                                    onChange={e => setProfile({ ...profile, displayName: e.target.value })}
                                />
                            ) : (
                                <div style={{ fontSize: '1.1rem', fontWeight: '500', padding: '0.5rem 0' }}>{profile.displayName || 'Checking...'}</div>
                            )}
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)' }}>
                                <Mail size={18} /> Email Address
                            </label>
                            <div style={{ fontSize: '1.1rem', fontWeight: '500', padding: '0.5rem 0', opacity: 0.8 }}>{profile.email}</div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)' }}>
                                <Phone size={18} /> Phone Number
                            </label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    className="input-field"
                                    value={profile.phone}
                                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                />
                            ) : (
                                <div style={{ fontSize: '1.1rem', fontWeight: '500', padding: '0.5rem 0' }}>{profile.phone || 'Not provided'}</div>
                            )}
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)' }}>
                                <MapPin size={18} /> Delivery Address
                            </label>
                            {isEditing ? (
                                <textarea
                                    className="input-field"
                                    rows="3"
                                    value={profile.address}
                                    onChange={e => setProfile({ ...profile, address: e.target.value })}
                                    placeholder="Enter your full delivery address..."
                                />
                            ) : (
                                <div style={{ fontSize: '1.1rem', fontWeight: '500', padding: '0.5rem 0', lineHeight: '1.6' }}>{profile.address || 'Not provided'}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
