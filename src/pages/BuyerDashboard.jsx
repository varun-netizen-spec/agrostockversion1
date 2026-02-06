import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MarketplaceService } from '../services/MarketplaceService';
import { ShoppingBag, Clock, MapPin, Search, Star, Zap, ChevronRight, RefreshCw, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export default function BuyerDashboard() {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [recentOrders, setRecentOrders] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [nearbyFarms, setNearbyFarms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userData?.uid) {
            fetchDashboardData();
        }
    }, [userData]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Recent Orders for Reorder
            const q = query(collection(db, 'orders'), where('buyerId', '==', userData.uid), orderBy('createdAt', 'desc'), limit(5));
            const orderSnaps = await getDocs(q);
            const orders = orderSnaps.docs.map(d => ({ id: d.id, ...d.data() }));
            setRecentOrders(orders);

            // 2. Fetch "Trending" (Simulated by getting high-rated or random products)
            const allProducts = await MarketplaceService.getAllProducts();
            // Shuffle for "Trending" feel
            const shuffled = allProducts.sort(() => 0.5 - Math.random()).slice(0, 4);
            setTrendingProducts(shuffled);

            setLoading(false);
        } catch (error) {
            console.error("Dashboard Load Error:", error);
            setLoading(false);
        }
    };

    const handleReorder = (order) => {
        // Logic to instantly add to cart and go to checkout (simplified for now)
        const cartItem = [{
            id: order.productId,
            name: order.productName,
            price: order.price,
            qty: order.quantity,
            itemTotal: order.total,
            farmerId: order.farmerId,
            farmName: order.farmName
        }];
        navigate('/payment', { state: { cartItems: cartItem, totalAmount: order.total } });
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* 1. Header & Greeting */}
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(90deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Good Morning, {userData?.displayName?.split(' ')[0] || 'Foodie'}! 🌿
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>What are you looking for today?</p>
                </div>
                <div
                    className="glass-panel"
                    style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    onClick={() => navigate('/buyer-profile')}
                >
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                        {userData?.displayName?.[0] || 'U'}
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Profile</span>
                </div>
            </header>

            {/* 2. Search & Categories Banner */}
            <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
                <input
                    type="text"
                    placeholder="Search for 'Organic Milk', 'Ghee'..."
                    className="input-field"
                    style={{ paddingLeft: '3rem', height: '50px', borderRadius: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 'none' }}
                />
                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>

            {/* 3. Smart Suggestions (AI Placeholder) */}
            <div className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ padding: '0.75rem', background: 'white', borderRadius: '50%', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <Zap size={24} color="#f59e0b" fill="#f59e0b" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.2rem' }}>Smart Insight</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                            You usually buy <strong>Fresh Milk</strong> on Fridays. Stock is running low at <strong>Vetri Farms</strong> – order soon!
                        </p>
                    </div>
                </div>
            </div>

            {/* 4. Quick Reorder (Horizontal Scroll) */}
            <section style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Order Again</h2>
                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: '600', cursor: 'pointer' }} onClick={() => navigate('/orders')}>View History</span>
                </div>

                {recentOrders.length > 0 ? (
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                        {recentOrders.map(order => (
                            <div key={order.id} className="glass-panel" style={{ minWidth: '260px', padding: '1rem', flexShrink: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>{order.productName}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>x{order.quantity}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                                    <Clock size={14} /> Delivered {new Date(order.createdAt).toLocaleDateString()}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '700' }}>₹{order.total}</span>
                                    <button
                                        onClick={() => handleReorder(order)}
                                        style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-tertiary)', color: 'var(--accent-primary)', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                    >
                                        <RefreshCw size={14} /> Reorder
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No past orders yet. Start shopping!</p>
                )}
            </section>

            {/* 5. Trending / Fresh Drops */}
            <section style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Fresh Drops Near You</h2>
                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: '600', cursor: 'pointer' }} onClick={() => navigate('/marketplace')}>See All</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                    {trendingProducts.map(product => (
                        <div key={product.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate('/marketplace')}>
                            <div style={{ height: '140px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                                {product.category === 'Milk' ? '🥛' : product.category === 'Ghee' ? '🍯' : '🧀'}
                            </div>
                            <div style={{ padding: '1rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: '600', marginBottom: '0.25rem' }}>{product.farmName || 'Local Farm'}</div>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{product.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                    <Clock size={12} /> {product.quantity > 0 ? 'In Stock' : 'Sold Out'}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '700' }}>₹{product.price}</span>
                                    <div style={{ padding: '0.2rem', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                                        <ChevronRight size={16} color="var(--text-dim)" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 6. Active Delivery (Sticky Bottom if Active) */}
            {/* Logic to check active orders would go here */}
            {recentOrders.some(o => ['Placed', 'Accepted', 'Out for Delivery'].includes(o.status)) && (
                <div className="glass-panel" style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '600px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid var(--accent-primary)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '1rem', zIndex: 100 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%' }}>
                                <Truck size={24} color="var(--accent-primary)" />
                            </div>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Order in Progress</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Arriving in ~25 mins</div>
                            </div>
                        </div>
                        <button onClick={() => navigate('/orders')} style={{ padding: '0.5rem 1rem', background: 'var(--accent-primary)', color: 'white', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}>Track</button>
                    </div>
                </div>
            )}
        </div>
    );
}
