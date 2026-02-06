import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CattleService } from '../services/CattleService';
import { MarketplaceService } from '../services/MarketplaceService';
import { SalesAnalyticsService } from '../services/SalesAnalyticsService';
import {
    Activity, AlertTriangle, Stethoscope, Clock, CheckCircle2, FileText,
    User, MapPin, TrendingUp, ShoppingBag, Zap, Bell, Settings, Beef, Truck, Wallet,
    BarChart as BarChartIcon, LineChart as LineChartIcon, PieChart as PieChartIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import autoTable from 'jspdf-autotable';
import NotificationsPanel from '../components/NotificationsPanel';
import BuyerDashboard from './BuyerDashboard';
import VetDashboard from './VetDashboard';


export default function Dashboard() {
    const { userData } = useAuth();

    // ... (Keep state stats) ...
    const [farmData, setFarmData] = useState(null);
    const [stats, setStats] = useState({
        totalCattle: 0,
        healthyCattle: 0,
        attentionNeeded: 0,
        vaccinationsDue: 0,
        avgYield: 0,
        monthlyYield: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        netProfit: 0
    });
    // ... (Keep other state) ...
    const [loading, setLoading] = useState(true);
    const [liveWalletBalance, setLiveWalletBalance] = useState(0);
    const [marketplaceStats, setMarketplaceStats] = useState({ activeListings: 0, totalOrders: 0 });
    const [vetActivity, setVetActivity] = useState([]);
    const [sharedReports, setSharedReports] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [deliveryStats, setDeliveryStats] = useState({ avgTime: 0, onTimeRate: 0 });

    useEffect(() => {
        if (userData?.uid) {
            // Only fetch Farmer stats if NOT a buyer or Vet.
            // (Buyer & Vet Dashboards handle their own data fetching)
            if (userData.role !== 'buyer' && userData.role !== 'vet') {
                fetchDashboardStats();
                const interval = setInterval(() => {
                    if (!document.hidden) {
                        fetchLiveUpdates();
                    }
                }, 10000);
                return () => clearInterval(interval);
            } else {
                setLoading(false);
            }
        }
    }, [userData]);

    // ... (Keep existing fetch functions, but ensure they don't break if not called) ...
    const fetchLiveUpdates = async () => {
        // ... (existing code) ...
        if (!userData?.uid) return;
        try {
            const walletDoc = await getDoc(doc(db, 'wallets', userData.uid));
            if (walletDoc.exists()) {
                const newBalance = walletDoc.data().balance || 0;
                setLiveWalletBalance(prev => prev !== newBalance ? newBalance : prev);
            }
            const products = await MarketplaceService.getFarmerProducts(userData.uid);
            const orders = await MarketplaceService.getFarmerOrders(userData.uid);

            setMarketplaceStats({
                activeListings: products.filter(p => p.status === 'Active').length,
                totalOrders: orders.length
            });
        } catch (e) {
            console.error("Live sync error:", e);
        }
    };

    async function fetchDashboardStats() {
        // ... (existing code, ensure it handles existing logic) ... 
        try {
            setLoading(true);
            const farmDoc = await getDoc(doc(db, 'farms', userData.uid));
            const currentFarmData = farmDoc.exists() ? farmDoc.data() : null;
            if (currentFarmData) setFarmData(currentFarmData);

            // Logic previously here... 
            // We can simplify: since this function is only called for Farmers now.

            const cattleData = await CattleService.getAllCattle(userData.uid);
            // ... (rest of stats logic) ...

            const allHealthRecords = [];
            for (const animal of cattleData) {
                const recs = await CattleService.getHealthRecords(animal.id);
                allHealthRecords.push(...recs);
            }
            const alerts = allHealthRecords.filter(r => r.type === 'Illness' && r.status !== 'Recovered').length;
            const healthyCount = cattleData.length - alerts;
            const dueVac = allHealthRecords.filter(r => r.type === 'Vaccination' && r.status === 'Scheduled').length;


            const products = await MarketplaceService.getFarmerProducts(userData.uid);
            const orders = await MarketplaceService.getFarmerOrders(userData.uid);

            setMarketplaceStats({
                activeListings: products.filter(p => p.status === 'Active').length,
                totalOrders: orders.length
            });

            setStats({
                totalCattle: cattleData.length,
                healthyCattle: healthyCount,
                attentionNeeded: alerts,
                vaccinationsDue: dueVac,
                avgYield: 0,
                monthlyYield: 0,
                monthlyIncome: 0,
                monthlyExpenses: 0,
                netProfit: 0
            });

            // ... (Vet activity & Delivery Stats) ... 
            const recentScans = [];
            for (const animal of cattleData) {
                const scans = await CattleService.getScanHistory(animal.id);
                recentScans.push(...scans);
            }
            const vetted = recentScans.filter(s => s.vetNotes).sort((a, b) => new Date(b.vetNotes.timestamp) - new Date(a.vetNotes.timestamp)).slice(0, 5);
            setVetActivity(vetted);

            const analytics = await SalesAnalyticsService.getAggregatedSalesData(userData.uid);
            if (!analytics.error) {
                setDeliveryStats({
                    avgTime: analytics.avgDeliveryTime || 0,
                    onTimeRate: analytics.onTimeRate || 0
                });
            }

        } catch (err) {
            console.error("Dashboard error:", err);
        } finally {
            setLoading(false);
        }
    }

    if (!userData) return null;

    // 1. Role Routing
    if (userData.role === 'buyer') return <BuyerDashboard />;
    if (userData.role === 'vet') return <VetDashboard />;

    // 2. Default: Farmer Dashboard
    if (loading) return <div style={{ padding: '2rem' }}>Loading Farm Stats...</div>;

    return (
        <div style={{ paddingBottom: '3rem' }}>
            {/* ... Header ... */}
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                {/* ... (keep header content) ... */}
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        Welcome back, {userData?.farmName || userData?.displayName || 'Farmer'} 👋
                    </h1>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            <User size={16} /> {farmData?.farmerName || userData?.displayName || 'Member'}
                            <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '1px 6px', borderRadius: '4px', marginLeft: '0.5rem', textTransform: 'uppercase', fontWeight: 'bold' }}>{userData?.role || 'Farmer'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            <MapPin size={16} /> {farmData?.village ? `${farmData.village}, ${farmData.district}` : farmData?.district || 'Location not set'}
                        </div>
                    </div>
                </div>

                <button onClick={() => window.location.href = '/farm-profile'} className="glass-panel" style={{ padding: '0.75rem', borderRadius: '12px', color: 'var(--text-dim)' }}>
                    <Settings size={20} />
                </button>
            </header>

            {/* 🔹 Smart Notifications */}
            <NotificationsPanel userData={userData} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>



                {/* 🔹 3. Cattle Summary */}
                <section>
                    <SectionHeader icon={<Beef size={20} />} title="Cattle Summary" />
                    <div className="cattle-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <MiniCard title="Total" value={stats.totalCattle} color="var(--accent-primary)" />
                        <MiniCard title="Healthy" value={stats.healthyCattle} color="#10b981" />
                        <MiniCard title="Attention" value={stats.attentionNeeded} color="#f87171" />
                        <MiniCard title="Vaccines Due" value={stats.vaccinationsDue} color="#fbbf24" />
                    </div>
                </section>

                {/* 🔹 4. Vet Collaboration */}
                {vetActivity.length > 0 && (
                    <section>
                        <SectionHeader icon={<Stethoscope size={20} />} title="Recent Vet Feedback" />
                        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {vetActivity.map((scan, i) => (
                                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', paddingBottom: '0.75rem', borderBottom: i === vetActivity.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                                    <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: '#10b981' }}>
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{scan.vetNotes.vetName} reviewed Tag: {scan.tagId}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>{new Date(scan.vetNotes.timestamp).toLocaleDateString()} • {scan.vetNotes.urgency} Urgency</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px' }}>
                                            "{scan.vetNotes.note.slice(0, 60)}..."
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}


                {/* 🔹 7. Marketplace Summary */}
                <section>
                    <SectionHeader icon={<ShoppingBag size={20} />} title="Marketplace Profile" />
                    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{marketplaceStats.activeListings}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Active</div>
                        </div>
                        <div style={{ borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '0 1.5rem' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>₹{liveWalletBalance.toLocaleString()}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Wallet Balance</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{marketplaceStats.totalOrders}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Orders</div>
                        </div>
                    </div>
                </section>



                {/* 🔹 8. Delivery Performance (Farmers only) - NEW */}
                {/* 🔹 8. Delivery Performance (Farmers only) - NEW */}
                <section>
                    <SectionHeader icon={<Truck size={20} />} title="Delivery Performance" />
                    <div className="cattle-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <MiniCard title="Avg Delivery Time" value={`${deliveryStats.avgTime} min`} color="#3b82f6" />
                        <MiniCard title="On-Time Rate" value={`${deliveryStats.onTimeRate}%`} color="#10b981" />
                    </div>
                </section>

                {/* 🔹 10. Alerts & Reminders */}
                <section style={{ gridColumn: 'span 2' }}>
                    <SectionHeader icon={<Bell size={20} />} title="Alerts & Reminders" />
                    <div className="glass-panel" style={{ padding: '1rem' }}>
                        {recentActivities.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                {recentActivities.map((act, i) => (
                                    <div key={i} style={{
                                        padding: '1rem',
                                        background: 'rgba(255,255,255,0.01)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '8px',
                                            background: act.icon === 'finance' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                                            color: act.icon === 'finance' ? 'var(--accent-primary)' : '#38bdf8',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {act.icon === 'finance' ? <Clock size={16} /> : <Bell size={16} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.8125rem', fontWeight: '500' }}>{act.label}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{act.date || new Date(act.timestamp).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-dim)' }}>No urgent alerts found.</p>
                        )}
                    </div>
                </section>
            </div>
        </div >
    );
}

function SectionHeader({ icon, title }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ color: 'var(--accent-primary)' }}>{icon}</div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>{title}</h2>
        </div>
    );
}

function MiniCard({ title, value, color }) {
    return (
        <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>{title}</div>
        </div>
    );
}
