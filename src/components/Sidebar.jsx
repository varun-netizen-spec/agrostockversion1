import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    UserCircle,
    Beef,
    Stethoscope,
    TrendingUp,
    LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const { logout } = useAuth();

    return (
        <aside className="sidebar">
            <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ color: 'var(--accent-primary)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Beef size={28} />
                    AgroStock
                </h2>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" end />
                <SidebarLink to="/farm-profile" icon={<UserCircle size={20} />} label="Farm Profile" />
                <SidebarLink to="/cattle" icon={<Beef size={20} />} label="Cattle Records" />
                <SidebarLink to="/health" icon={<Stethoscope size={20} />} label="Health records" />
                <SidebarLink to="/feed" icon={<TrendingUp size={20} />} label="Feed Optimizer" />
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                <button
                    onClick={logout}
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
