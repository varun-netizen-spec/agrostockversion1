import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Package, TrendingUp, Truck, CheckCircle } from 'lucide-react';
import { MarketplaceService } from '../services/MarketplaceService';
import { CattleService } from '../services/CattleService';

export default function NotificationsPanel({ userData }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userData?.uid) {
            generateNotifications();
        }
    }, [userData]);

    const generateNotifications = async () => {
        setLoading(true);
        const newNotifs = [];

        try {
            if (userData.role === 'farmer') {
                // 1. Check Low Stock
                const products = await MarketplaceService.getFarmerProducts(userData.uid);
                const lowStock = products.filter(p => p.quantity < 10 && p.status === 'Active');
                if (lowStock.length > 0) {
                    newNotifs.push({
                        type: 'warning',
                        title: 'Low Stock Alert',
                        message: `${lowStock.length} products are running low (Milk, Curd...). Restock soon to avoid missed sales.`,
                        icon: <Package size={18} color="#f59e0b" />
                    });
                }

                // 2. Check Pending Orders
                const orders = await MarketplaceService.getFarmerOrders(userData.uid);
                const pending = orders.filter(o => o.status === 'Pending').length;
                if (pending > 0) {
                    newNotifs.push({
                        type: 'info',
                        title: 'New Orders Received',
                        message: `You have ${pending} new orders waiting to be processed.`,
                        icon: <Bell size={18} color="#3b82f6" />
                    });
                }

                // 3. Health Risk Check
                const risk = await CattleService.getFarmRiskLevel(userData.uid);
                if (risk === 'High') {
                    newNotifs.push({
                        type: 'critical',
                        title: 'Critical Bio-Security Alert',
                        message: 'High contagion risk detected in herd. Marketplace sales are temporarily restricted.',
                        icon: <AlertTriangle size={18} color="#ef4444" />
                    });
                }
            }

            if (userData.role === 'buyer') {
                // 1. Order Updates
                const orders = await MarketplaceService.getBuyerOrders(userData.uid);
                const arriving = orders.filter(o => o.status === 'Out for Delivery');
                if (arriving.length > 0) {
                    newNotifs.push({
                        type: 'success',
                        title: 'Orders Arriving Soon',
                        message: `${arriving.length} of your orders are out for delivery!`,
                        icon: <Truck size={18} color="#10b981" />
                    });
                }
            }

        } catch (error) {
            console.error("Notification Error:", error);
        } finally {
            setNotifications(newNotifs);
            setLoading(false);
        }
    };

    if (notifications.length === 0) return null;

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={20} /> Smart Notifications
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {notifications.map((notif, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        gap: '1rem',
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        borderLeft: `4px solid ${notif.type === 'critical' ? '#ef4444' : notif.type === 'warning' ? '#f59e0b' : notif.type === 'success' ? '#10b981' : '#3b82f6'}`
                    }}>
                        <div style={{ padding: '0.25rem' }}>{notif.icon}</div>
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{notif.title}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{notif.message}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
