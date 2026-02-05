import React, { useState, useEffect } from 'react';
import { ClipboardList, Clock, CheckCircle2, Package, MapPin, Phone, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MarketplaceService } from '../services/MarketplaceService';

export default function Orders() {
    const { userData } = useAuth();
    const [activeTab, setActiveTab] = useState('My Orders');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();

        // Optimized Polling (3s) for "Real-time" order status feel
        const interval = setInterval(() => {
            if (!document.hidden) {
                fetchOrders(true);
            }
        }, 3000); // 3 seconds - Super fast updates

        return () => clearInterval(interval);
    }, [userData, activeTab]);

    const fetchOrders = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            let data = [];
            if (activeTab === 'My Orders') {
                data = await MarketplaceService.getBuyerOrders(userData.uid);
            } else {
                data = await MarketplaceService.getFarmerOrders(userData.uid);
            }

            // Only update if data changed (Simple check to avoid re-renders)
            setOrders(prev => {
                const prevStr = JSON.stringify(prev.map(o => o.status)); // Check status changes specifically
                const newStr = JSON.stringify(data.map(o => o.status));
                if (prev.length === data.length && prevStr === newStr) return prev;
                return data;
            });
        } catch (error) {
            console.error(error);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId, status) => {
        try {
            await MarketplaceService.updateOrderStatus(orderId, status);
            fetchOrders(true); // Immediate refresh
        } catch (error) {
            console.error(error);
        }
    };

    // Timeline Helper for Buyers
    const getStatusStep = (status) => {
        const steps = ['Placed', 'Accepted', 'Out for Delivery', 'Delivered'];
        if (status === 'Negotiating') return 0; // Special case
        return steps.indexOf(status) + 1;
    };

    return (
        <div style={{ maxWidth: '1000px' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {activeTab === 'Sales' ? 'Manage Orders' : 'Live Order Tracking'}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Real-time updates on your transactions.</p>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                {['My Orders', 'Sales'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setOrders([]); setLoading(true); }}
                        className={activeTab === tab ? "btn-primary" : "glass-panel"}
                        style={{ width: 'auto', padding: '0.6rem 2rem' }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading && orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Loader size={32} className="animate-spin" />
                    <p>Syncing orders...</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {orders.map(order => (
                        <div key={order.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: activeTab === 'Sales' && order.status === 'Placed' ? '4px solid #facc15' : '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Order #{order.id.slice(-6).toUpperCase()}</h3>
                                    <p style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
                                        {new Date(order.timestamp).toLocaleString()}
                                    </p>
                                    {order.status === 'Negotiating' && (
                                        <div style={{ marginTop: '0.5rem', padding: '4px 8px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-block' }}>
                                            ⚠️ Negotiation in Progress
                                        </div>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '99px',
                                        fontSize: '0.75rem',
                                        background: ['Placed', 'Negotiating'].includes(order.status) ? 'rgba(250, 204, 21, 0.1)' : order.status === 'Rejected' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                        color: ['Placed', 'Negotiating'].includes(order.status) ? '#facc15' : order.status === 'Rejected' ? '#f87171' : 'var(--accent-primary)',
                                        fontWeight: '600',
                                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                                    }}>
                                        {order.status === 'Placed' && <Clock size={12} />}
                                        {order.status === 'Out for Delivery' && <Package size={12} />}
                                        {order.status === 'Delivered' && <CheckCircle2 size={12} />}
                                        {order.status}
                                    </span>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.5rem' }}>
                                        ₹{order.total}
                                        {order.originalTotal && order.originalTotal > order.total && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '0.5rem' }}>₹{order.originalTotal}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Order Details Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Package size={16} /> Items
                                    </h4>
                                    <p style={{ fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                                        {order.productName} x {order.quantity}
                                    </p>
                                </div>
                                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
                                    {/* Location/Contact Info similar to previous */}
                                    {/* ... (Kept simple for this snippet to focus on logic) ... */}
                                    <div style={{ fontSize: '0.9rem' }}>
                                        {activeTab === 'My Orders' ? order.shopName : (order.buyerName || 'Customer')}
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                            {activeTab === 'My Orders' ? order.farmerLocation : order.buyerLocation}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BUYER TIMELINE UI */}
                            {activeTab === 'My Orders' && order.status !== 'Rejected' && order.status !== 'Negotiating' && (
                                <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                                    {/* Line */}
                                    <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', background: 'var(--border-color)', zIndex: 0 }}></div>
                                    <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', background: 'var(--accent-primary)', width: `${(getStatusStep(order.status) - 1) * 33}%`, transition: 'width 0.5s', zIndex: 0 }}></div>

                                    {['Placed', 'Accepted', 'Out for Delivery', 'Delivered'].map((step, idx) => {
                                        const currentStep = getStatusStep(order.status);
                                        const isCompleted = idx + 1 <= currentStep;
                                        return (
                                            <div key={step} style={{ position: 'relative', zIndex: 1, textAlign: 'center', background: 'var(--bg-card)', padding: '0 0.5rem' }}>
                                                <div style={{
                                                    width: '24px', height: '24px', borderRadius: '50%',
                                                    background: isCompleted ? 'var(--accent-primary)' : 'var(--bg-main)',
                                                    border: `2px solid ${isCompleted ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                                    margin: '0 auto 0.5rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontSize: '10px'
                                                }}>
                                                    {isCompleted && <CheckCircle2 size={14} />}
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: isCompleted ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: isCompleted ? '600' : '400' }}>{step}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* FARMER ACTIONS */}
                            {activeTab === 'Sales' && (
                                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    {/* Action: Place -> Accepted */}
                                    {(order.status === 'Placed' || order.status === 'Negotiating') && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(order.id, 'Rejected')}
                                                className="glass-panel"
                                                style={{ width: 'auto', fontSize: '0.875rem', color: '#f87171', border: '1px solid #f87171' }}
                                            >
                                                Reject {order.status === 'Negotiating' ? 'Offer' : 'Order'}
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(order.id, 'Accepted')}
                                                className="btn-primary"
                                                style={{ width: 'auto', fontSize: '0.875rem' }}
                                            >
                                                Accept {order.status === 'Negotiating' ? `₹${order.total} Offer` : 'Order'}
                                            </button>
                                        </>
                                    )}

                                    {/* Action: Accepted -> Out for Delivery */}
                                    {order.status === 'Accepted' && (
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')}
                                            className="btn-primary" style={{ width: 'auto', fontSize: '0.875rem' }}
                                        >
                                            Mark as Shipped
                                        </button>
                                    )}

                                    {/* Action: Out -> Delivered */}
                                    {order.status === 'Out for Delivery' && (
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                                            className="btn-primary" style={{ width: 'auto', fontSize: '0.875rem' }}
                                        >
                                            Complete Delivery
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {orders.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-dim)' }}>No orders found.</p>}
                </div>
            )}
        </div>
    );
}

