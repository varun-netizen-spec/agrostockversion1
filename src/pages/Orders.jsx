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

        // Optimized Polling (10s) for "Real-time" order status feel
        const interval = setInterval(() => {
            if (!document.hidden) {
                fetchOrders(true);
            }
        }, 10000);

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

            // Only update if data changed
            setOrders(prev => {
                if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
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
            fetchOrders();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSeedData = async () => {
        try {
            setLoading(true);
            await MarketplaceService.simulateSampleOrders(userData.uid);
            await fetchOrders();
            alert('Sample orders (Murugan agro foods, etc.) added successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to seed data.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1000px' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Order History</h1>
                <p style={{ color: 'var(--text-muted)' }}>Track and manage your dairy marketplace transactions.</p>
                <div style={{ marginTop: '1rem' }}>
                    <button className="glass-panel" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => {
                        if (orders.length === 0) {
                            alert('No orders found to export.');
                            return;
                        }
                        const headers = ['Order ID', 'Date', 'Shop/Buyer', 'Product', 'Quantity', 'Total (₹)', 'Status'];
                        const csvRows = [
                            headers.join(','),
                            ...orders.map(o => [
                                `"${o.id}"`,
                                `"${new Date(o.timestamp).toLocaleDateString()}"`,
                                `"${(activeTab === 'My Orders' ? o.shopName : (o.buyerName || 'Client')).replace(/"/g, '""')}"`,
                                `"${o.productName.replace(/"/g, '""')}"`,
                                o.quantity,
                                o.total,
                                `"${o.status}"`
                            ].join(','))
                        ].join('\n');
                        const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.setAttribute('hidden', '');
                        a.setAttribute('href', url);
                        a.setAttribute('download', `agrostock_orders_${activeTab.toLowerCase().replace(' ', '_')}.csv`);
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }}>
                        Download CSV Report
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                {['My Orders', 'Sales'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={activeTab === tab ? "btn-primary" : "glass-panel"}
                        style={{ width: 'auto', padding: '0.6rem 2rem' }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Loader size={32} className="animate-spin" />
                    <p>Fetching orders...</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {orders.map(order => (
                        <div key={order.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Order #{order.id.slice(-6).toUpperCase()}</h3>
                                    <p style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>Placed on {new Date(order.timestamp).toLocaleDateString()}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '99px',
                                        fontSize: '0.75rem',
                                        background: order.status === 'Delivered' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                                        color: order.status === 'Delivered' ? 'var(--accent-primary)' : '#38bdf8',
                                        fontWeight: '600'
                                    }}>
                                        {order.status}
                                    </span>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.5rem' }}>₹{order.total}</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Package size={16} />
                                        Items Summary
                                    </h4>
                                    <p style={{ fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                                        {order.productName} x {order.quantity}
                                    </p>
                                </div>
                                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
                                    <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {activeTab === 'My Orders' ? <MapPin size={16} /> : <Phone size={16} />}
                                        {activeTab === 'My Orders' ? 'Seller Details' : 'Buyer Details'}
                                    </h4>
                                    <div style={{ fontSize: '0.9375rem' }}>
                                        {activeTab === 'My Orders' ? (
                                            <div>
                                                <div style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', fontWeight: '600' }}>{order.shopName || 'Local Farm'}</div>
                                                {order.farmerName && (
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                                                        Farmer: {order.farmerName}
                                                    </div>
                                                )}
                                                {order.farmerLocation && (
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', marginBottom: '0.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
                                                        <MapPin size={12} style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                                                        <span>{order.farmerLocation}</span>
                                                    </div>
                                                )}
                                                {order.farmerPhone && (
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Phone size={12} />
                                                        <a href={`tel:${order.farmerPhone}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                                                            {order.farmerPhone}
                                                        </a>
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>Farmer ID: {order.farmerId.substring(0, 8)}</div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', fontWeight: '600' }}>{order.buyerName || 'Direct Customer'}</div>
                                                {order.buyerLocation && (
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', marginBottom: '0.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
                                                        <MapPin size={12} style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                                                        <span>{order.buyerLocation}</span>
                                                    </div>
                                                )}
                                                {order.buyerPhone && (
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Phone size={12} />
                                                        <a href={`tel:${order.buyerPhone}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                                                            {order.buyerPhone}
                                                        </a>
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>Buyer ID: {order.buyerId.substring(0, 8)}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {activeTab === 'Sales' && order.status !== 'Delivered' && (
                                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                    {order.status === 'Pending' && (
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')}
                                            className="btn-primary" style={{ width: 'auto', fontSize: '0.875rem' }}
                                        >
                                            Mark as Shipped
                                        </button>
                                    )}
                                    {order.status === 'Out for Delivery' && (
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                                            className="btn-primary" style={{ width: 'auto', fontSize: '0.875rem' }}
                                        >
                                            Mark as Delivered
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

