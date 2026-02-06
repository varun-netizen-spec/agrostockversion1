
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    UserCircle,
    Beef,
    Activity,
    LogOut,
    ShoppingBag,
    ClipboardList,
    Package,
    ScanLine,
    Stethoscope,
    Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import logo from '../assets/logo.jpg';

export default function Sidebar() {
    const { logout, userData } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch {
            console.error('Failed to log out');
        }
    };

    return (
        <aside className="sidebar">
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <img
                        src={logo}
                        alt="AgroStock Logo"
                        style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'contain',
                            borderRadius: '12px',
                            margin: '0 auto 0.5rem'
                        }}
                    />
                    <h2 style={{ color: 'var(--accent-primary)', fontSize: '1.25rem', fontWeight: '800', letterSpacing: '1px' }}>
                        AGROSTOCK
                    </h2>
                </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" end />

                {/* Farmer Only Links */}
                {(userData?.role === 'farmer' || userData?.role === 'admin') && (
                    <>
                        <SidebarLink to="/farm-profile" icon={<UserCircle size={20} />} label="Farm Profile" />
                        <SidebarLink to="/cattle" icon={<Beef size={20} />} label="My Cattle" />
                        <SidebarLink to="/health" icon={<Activity size={20} />} label="Health & AI Vet" />
                        <SidebarLink to="/scan" icon={<ScanLine size={20} />} label="Health Scanner" />
                        <SidebarLink to="/inventory" icon={<Package size={20} />} label="My Products" />
                        <SidebarLink to="/cooperative" icon={<Users size={20} />} label="Co-op Network" />
                    </>
                )}

                {/* Vet Specific Links are now handled via Dashboard View, but we can give them shortcuts */}
                {(userData?.role === 'vet' || userData?.role === 'admin') && (
                    <SidebarLink to="/scan" icon={<ScanLine size={20} />} label="Scan Tool" />
                )}

                <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border-color)', opacity: 0.5 }} />

                {/* Common Links (Marketplace) - Hidden for Vets */}
                {userData?.role !== 'vet' && (
                    <>
                        {/* Hide Buy Marketplace for Farmers */}
                        {userData?.role !== 'farmer' && (
                            <SidebarLink to="/marketplace" icon={<ShoppingBag size={20} />} label="Marketplace" />
                        )}
                        <SidebarLink to="/orders" icon={<ClipboardList size={20} />} label="Orders" />
                    </>
                )}
                {/* Buyer Only Link */}
                {userData?.role === 'buyer' && (
                    <SidebarLink to="/buyer-profile" icon={<UserCircle size={20} />} label="My Profile" />
                )}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                <button
                    onClick={handleLogout}
                    className="glass-panel"
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        color: '#f87171',
                        border: '1px solid rgba(248, 113, 113, 0.2)'
                    }}
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}

function SidebarLink({ to, icon, label, end }) {
    return (
        <NavLink
            to={to}
            end={end}
            style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: isActive ? '#fff' : 'var(--text-muted)',
                background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                border: isActive ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
            })}
        >
            {icon}
            <span style={{ fontWeight: '500' }}>{label}</span>
        </NavLink>
    );
}
