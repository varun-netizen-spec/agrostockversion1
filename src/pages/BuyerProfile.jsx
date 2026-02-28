import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { User, MapPin, Phone, Mail, Wallet, Clock, Save, Edit2, ShoppingBag, CreditCard, Package } from 'lucide-react';

export default function BuyerProfile() {
    const { userData } = useAuth();
    const [profile, setProfile] = useState({
        displayName: '',
        email: '',
        phone: '',
        address: '',
        businessType: 'retail',
        requirements: '',
        deliveryZones: '',
        paymentMethods: ''
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
            const userDoc = await getDoc(doc(db, 'users', userData.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setProfile({
                    displayName: data.displayName || userData.displayName || '',
                    email: data.email || userData.email || '',
                    phone: data.phoneNumber || '',
                    address: data.address || '',
                    businessType: data.businessType || 'retail',
                    requirements: data.requirements || '',
                    deliveryZones: data.deliveryZones || '',
                    paymentMethods: data.paymentMethods || ''
                });
            }

            const walletDoc = await getDoc(doc(db, 'wallets', userData.uid));
            if (walletDoc.exists()) {
                setWalletBalance(walletDoc.data().balance || 0);
            }

            // 3. Fetch Recent Orders (With fallback for missing index)
            try {
                const q = query(
                    collection(db, 'orders'),
                    where('buyerId', '==', userData.uid),
                    orderBy('createdAt', 'desc'),
                    limit(3)
                );
                const orderSnaps = await getDocs(q);
                setRecentOrders(orderSnaps.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (indexError) {
                console.warn("Retrying query without ordering due to missing index...");
                const fallbackQ = query(
                    collection(db, 'orders'),
                    where('buyerId', '==', userData.uid),
                    limit(3)
                );
                const orderSnaps = await getDocs(fallbackQ);
                setRecentOrders(orderSnaps.docs.map(d => ({ id: d.id, ...d.data() })));
            }

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
                address: profile.address,
                businessType: profile.businessType,
                requirements: profile.requirements,
                deliveryZones: profile.deliveryZones,
                paymentMethods: profile.paymentMethods
            });
            setIsEditing(false);
            alert("Profile Updated!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Loading Profile...</div>;

    return (
        <div style={{ maxWidth: '850px', margin: '0 auto', padding: '2rem 1rem' }}>
            {/* Minimal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>Account Settings</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '1rem' }}>Manage your buyer profile and business preferences</p>
                </div>
                <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={isEditing ? "btn-primary" : "btn-secondary"}
                    style={{ padding: '0.6rem 1.5rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600' }}
                >
                    {isEditing ? <><Save size={18} style={{ marginRight: '0.5rem' }} /> Save Changes</> : <><Edit2 size={18} style={{ marginRight: '0.5rem' }} /> Edit Profile</>}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                {/* 1. Wallet Quick Glance */}
                <div className="glass-panel" style={{
                    padding: '1.5rem 2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.15)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'var(--accent-primary)', borderRadius: '12px', color: 'white' }}>
                            <Wallet size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: '600', textTransform: 'uppercase' }}>Available Balance</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>₹{walletBalance.toLocaleString()}</div>
                        </div>
                    </div>
                    <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Top Up</button>
                </div>

                {/* 2. Personal Information Section */}
                <section>
                    <SectionHeader title="Personal Information" />
                    <div className="glass-panel" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label className="input-label">Full Name</label>
                            {isEditing ? (
                                <input type="text" className="input-field" value={profile.displayName} onChange={e => setProfile({ ...profile, displayName: e.target.value })} />
                            ) : (
                                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{profile.displayName}</div>
                            )}
                        </div>
                        <div>
                            <label className="input-label">Email Address</label>
                            <div style={{ color: 'var(--text-dim)', fontSize: '1rem' }}>{profile.email}</div>
                        </div>
                        <div>
                            <label className="input-label">Phone Number</label>
                            {isEditing ? (
                                <input type="tel" className="input-field" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                            ) : (
                                <div style={{ fontSize: '1rem' }}>{profile.phone || 'Not provided'}</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 3. Business Details Section */}
                <section>
                    <SectionHeader title="Business Details" />
                    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label className="input-label">Business Type</label>
                            {isEditing ? (
                                <select className="input-field" value={profile.businessType} onChange={e => setProfile({ ...profile, businessType: e.target.value })}>
                                    <option value="retail">Retailer</option>
                                    <option value="wholesaler">Wholesaler</option>
                                </select>
                            ) : (
                                <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: '6px', fontWeight: '600', textTransform: 'capitalize' }}>{profile.businessType}</div>
                            )}
                        </div>
                        <div>
                            <label className="input-label">Delivery Address</label>
                            {isEditing ? (
                                <textarea className="input-field" rows="2" value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} />
                            ) : (
                                <div style={{ fontSize: '1rem', lineHeight: '1.5', maxWidth: '500px' }}>{profile.address || 'No address saved.'}</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 4. Operational Preferences */}
                <section>
                    <SectionHeader title="Operational Preferences" />
                    <div className="glass-panel" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label className="input-label">Product Requirements</label>
                            {isEditing ? (
                                <textarea className="input-field" rows="2" value={profile.requirements} onChange={e => setProfile({ ...profile, requirements: e.target.value })} placeholder="e.g. Daily milk procurement volume" />
                            ) : (
                                <div style={{ fontSize: '1rem' }}>{profile.requirements || 'None specified'}</div>
                            )}
                        </div>
                        <div>
                            <label className="input-label">Delivery Zones</label>
                            {isEditing ? (
                                <input type="text" className="input-field" value={profile.deliveryZones} onChange={e => setProfile({ ...profile, deliveryZones: e.target.value })} />
                            ) : (
                                <div style={{ fontSize: '1rem' }}>{profile.deliveryZones || 'Not set'}</div>
                            )}
                        </div>
                        <div>
                            <label className="input-label">Preferred Payment</label>
                            {isEditing ? (
                                <input type="text" className="input-field" value={profile.paymentMethods} onChange={e => setProfile({ ...profile, paymentMethods: e.target.value })} />
                            ) : (
                                <div style={{ fontSize: '1rem' }}>{profile.paymentMethods || 'Not specified'}</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 5. Minimal Recent Activity */}
                <section style={{ marginBottom: '2rem' }}>
                    <SectionHeader title="Recent Activity" />
                    <div className="glass-panel" style={{ padding: '1rem' }}>
                        {recentOrders.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>No recent activity to show.</p>
                        ) : (
                            recentOrders.map((order, index) => (
                                <div key={order.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    borderBottom: index === recentOrders.length - 1 ? 'none' : '1px solid var(--border-color)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                            <Package size={20} color="var(--text-dim)" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{order.productName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '700' }}>₹{order.total}</div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: order.status === 'Completed' ? '#10b981' : '#f59e0b' }}>{order.status}</div>
                                    </div>
                                </div>
                            ))
                        )}
                        <button className="btn-secondary" style={{ width: '100%', marginTop: '0.5rem', border: 'none', background: 'transparent', color: 'var(--accent-primary)', fontWeight: '600' }}>
                            View Full History
                        </button>
                    </div>
                </section>

            </div>
        </div>
    );
}

function SectionHeader({ title }) {
    return (
        <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '700',
            marginBottom: '1rem',
            paddingLeft: '0.5rem',
            borderLeft: '4px solid var(--accent-primary)',
            color: 'var(--text-primary)'
        }}>
            {title}
        </h3>
    );
}
