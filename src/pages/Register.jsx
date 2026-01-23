import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, AlertCircle, ShieldCheck } from 'lucide-react';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('farmer');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            setError('');
            setLoading(true);
            await signup(email, password, role);
            navigate('/');
        } catch (err) {
            console.error(err);
            // Provide a more descriptive error message
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else if (err.code === 'auth/operation-not-allowed') {
                setError('Email/Password auth is not enabled in Firebase Console.');
            } else if (err.code === 'permission-denied') {
                setError('Firestore permission denied. Check security rules.');
            } else {
                setError(err.message || 'Failed to create an account.');
            }
        }
        setLoading(false);
    }

    return (
        <div className="auth-container">
            <div className="auth-card glass-panel">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '1rem',
                        borderRadius: '50%',
                        background: 'var(--accent-glow)',
                        marginBottom: '1rem'
                    }}>
                        <UserPlus size={32} color="var(--accent-primary)" />
                    </div>
                    <h1>Create Account</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Join the AgroStock network</p>
                </div>

                {error && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        color: '#f87171',
                        fontSize: '0.875rem',
                        marginBottom: '1.5rem'
                    }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-dim)'
                            }} />
                            <input
                                type="email"
                                className="input-field"
                                style={{ paddingLeft: '3rem' }}
                                placeholder="farmer@agrostock.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Role</label>
                        <div style={{ position: 'relative' }}>
                            <ShieldCheck size={18} style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-dim)'
                            }} />
                            <select
                                className="input-field"
                                style={{ paddingLeft: '3rem', appearance: 'none' }}
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="farmer">Farmer</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-dim)'
                            }} />
                            <input
                                type="password"
                                className="input-field"
                                style={{ paddingLeft: '3rem' }}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-dim)'
                            }} />
                            <input
                                type="password"
                                className="input-field"
                                style={{ paddingLeft: '3rem' }}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
                    <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>Login</Link>
                </div>
            </div>
        </div>
    );
}
