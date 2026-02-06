import React, { useState, useEffect } from 'react';
import { ClipboardList, Clock, CheckCircle2, Package, MapPin, Phone, Loader, Truck, ThumbsUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MarketplaceService } from '../services/MarketplaceService';
import DeliveryTimer from '../components/DeliveryTimer';
import FreshnessIndicator from '../components/FreshnessIndicator';

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
                        <div key={order.id} className="glass-panel" style={{
                            padding: '0',
                            border: '1px solid var(--border-color)',
                            overflow: 'hidden',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
                        }}>
                            {/* Card Header */}
                            <div style={{
                                padding: '1.25rem 1.5rem',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(255,255,255,0.02)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '40px', height: '40px',
                                        borderRadius: '10px',
                                        background: activeTab === 'Sales' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: activeTab === 'Sales' ? 'var(--accent-primary)' : '#3b82f6'
                                    }}>
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', letterSpacing: '0.02em' }}>
                                            Order #{order.id.slice(-6).toUpperCase()}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                            <Clock size={12} /> {new Date(order.status === 'Delivered' ? order.deliveredAt : order.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        padding: '0.4rem 1rem',
                                        borderRadius: '20px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        background: ['Placed', 'Negotiating'].includes(order.status) ? 'rgba(250, 204, 21, 0.15)' :
                                            order.status === 'Rejected' ? 'rgba(248, 113, 113, 0.15)' :
                                                order.status === 'Delivered' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                        color: ['Placed', 'Negotiating'].includes(order.status) ? '#facc15' :
                                            order.status === 'Rejected' ? '#f87171' :
                                                order.status === 'Delivered' ? '#10b981' : '#3b82f6',
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                    }}>
                                        {['Placed', 'Negotiating'].includes(order.status) && <Clock size={14} />}
                                        {order.status === 'Out for Delivery' && <Truck size={14} />}
                                        {order.status === 'Delivered' && <CheckCircle2 size={14} />}
                                        {order.status === 'Rejected' && <ThumbsUp size={14} style={{ transform: 'rotate(180deg)' }} />}
                                        {order.status}
                                    </div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '0.5rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                                        ₹{order.total}
                                        {order.originalTotal && order.originalTotal > order.total && (
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '0.5rem', fontWeight: 'normal' }}>₹{order.originalTotal}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                                {/* Left Column: Product & Details */}
                                <div>
                                    <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.75rem', fontWeight: '600', letterSpacing: '0.05em' }}>Items Ordered</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                            {order.productName}
                                        </div>
                                        <div style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            x {order.quantity}
                                        </div>
                                    </div>

                                    {/* Freshness Section - Highlighted */}
                                    {order.freshnessScore && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.5rem', fontWeight: '600' }}>Quality Assurance</h4>
                                            <FreshnessIndicator score={order.freshnessScore} />
                                        </div>
                                    )}

                                    {/* Delivery Timer */}
                                    {order.status === 'Out for Delivery' && (
                                        <div style={{ marginTop: '1rem' }}>
                                            <DeliveryTimer estimatedDeliveryTime={order.estimatedDeliveryTime} status={order.status} />
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Logistics & Actions */}
                                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.75rem', fontWeight: '600', letterSpacing: '0.05em' }}>
                                            {activeTab === 'My Orders' ? 'Seller Details' : 'Customer Details'}
                                        </h4>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <div style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
                                                {activeTab === 'My Orders' ? <Package size={16} /> : <MapPin size={16} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                                                    {activeTab === 'My Orders' ? order.shopName : (order.buyerName || 'Valued Customer')}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                                                    {activeTab === 'My Orders' ? order.farmerLocation : order.buyerLocation || 'Location not provided'}
                                                </div>
                                                {order.buyerPhone && activeTab === 'Sales' && (
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Phone size={12} /> {order.buyerPhone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons Zone */}
                                    {activeTab === 'Sales' && (order.status === 'Placed' || order.status === 'Negotiating' || order.status === 'Accepted' || order.status === 'Out for Delivery') && (
                                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            {/* Placed/Negotiating Actions */}
                                            {(order.status === 'Placed' || order.status === 'Negotiating') && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'Rejected')}
                                                        className="glass-panel"
                                                        style={{
                                                            flex: 1, fontSize: '0.85rem', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.3)',
                                                            padding: '0.6rem', justifyContent: 'center', fontWeight: '600'
                                                        }}
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'Accepted')}
                                                        className="btn-primary"
                                                        style={{
                                                            flex: 1, fontSize: '0.85rem', padding: '0.6rem', justifyContent: 'center',
                                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                                                        }}
                                                    >
                                                        Accept Order
                                                    </button>
                                                </>
                                            )}

                                            {/* Accepted -> Out for Delivery */}
                                            {order.status === 'Accepted' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')}
                                                    className="btn-primary"
                                                    style={{ width: '100%', fontSize: '0.85rem', justifyContent: 'center' }}
                                                >
                                                    <Truck size={16} style={{ marginRight: '0.5rem' }} /> Mark as Shipped
                                                </button>
                                            )}

                                            {/* Out -> Delivered */}
                                            {order.status === 'Out for Delivery' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                                                    className="btn-primary"
                                                    style={{ width: '100%', fontSize: '0.85rem', justifyContent: 'center', background: '#3b82f6' }}
                                                >
                                                    <CheckCircle2 size={16} style={{ marginRight: '0.5rem' }} /> Complete Delivery
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Negotiation Warning Banner if needed */}
                            {order.status === 'Negotiating' && (
                                <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.75rem', textAlign: 'center', borderTop: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '0.85rem', color: '#38bdf8' }}>
                                    ⚠️ <strong>Negotiation Alert:</strong> Buyer offered ₹{order.total} (Original: ₹{order.originalTotal}). Accepting this will confirm the new price.
                                </div>
                            )}

                            {/* BUYER TIMELINE UI */}
                            {activeTab === 'My Orders' && order.status !== 'Rejected' && order.status !== 'Negotiating' && (
                                <div style={{ padding: '0 1.5rem 1.5rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                                    {/* Line */}
                                    <div style={{ position: 'absolute', top: '12px', left: '30px', right: '30px', height: '2px', background: 'var(--border-color)', zIndex: 0 }}></div>
                                    <div style={{ position: 'absolute', top: '12px', left: '30px', right: '30px', height: '2px', background: 'var(--accent-primary)', width: `${(getStatusStep(order.status) - 1) * 33}%`, transition: 'width 0.5s', zIndex: 0 }}></div>

                                    {['Placed', 'Accepted', 'Out for Delivery', 'Delivered'].map((step, idx) => {
                                        const currentStep = getStatusStep(order.status);
                                        const isCompleted = idx + 1 <= currentStep;
                                        return (
                                            <div key={step} style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 0.5rem' }}>
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
                                                <span style={{ fontSize: '0.7rem', color: isCompleted ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: isCompleted ? '600' : '400' }}>{step}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {/* Buyer Confirmation */}
                            {activeTab === 'My Orders' && order.status === 'Delivered' && (
                                <div style={{ padding: '0 1.5rem 1.5rem', textAlign: 'center' }}>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm("Confirm you received this order? Funds will be released to the farmer.")) {
                                                try {
                                                    await MarketplaceService.completeOrder(order.id, order.paymentMethod, order.total, order.farmerId);
                                                    fetchOrders(true);
                                                    alert("Order Verified! Thank you.");
                                                } catch (e) {
                                                    console.error(e);
                                                    alert("Error completing order.");
                                                }
                                            }
                                        }}
                                        className="btn-primary"
                                        style={{ width: '100%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981' }}
                                    >
                                        <ThumbsUp size={16} style={{ marginRight: '0.5rem' }} /> Order Received & Verified
                                    </button>
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

