import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Filter, Star, Clock, MapPin, Plus, Minus, CheckCircle, Zap, Repeat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MarketplaceService } from '../services/MarketplaceService';

export default function Marketplace() {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState({});
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [filters, setFilters] = useState({
        maxPrice: 500,
        minQty: 0,
        onlyFresh: false
    });

    useEffect(() => {
        fetchProducts();

        // Smart Polling Strategy:
        // 1. High frequency (5s) when tab is active for "near real-time" feel.
        // 2. Stop entirely when tab is hidden to save reads.
        const intervalId = setInterval(() => {
            if (!document.hidden) {
                fetchProducts(true);
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [userData]);

    const fetchProducts = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const data = await MarketplaceService.getAllProducts();

            // Only update state if data actually changed to prevent unnecessary re-renders
            setProducts(prev => {
                if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
                return data;
            });

            if (!isSilent) setLoading(false);
        } catch (error) {
            console.error("Products Fetch Error:", error);
            if (!isSilent) setLoading(false);
        }
    };



    const toggleCart = (id, delta) => {
        setCart(prev => {
            const current = prev[id] || 0;
            const next = Math.max(0, current + delta);
            if (next === 0) {
                const { [id]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [id]: next };
        });
    };

    const handleCheckout = () => {
        if (!userData) {
            return alert('Please login to place an order.');
        }

        const cartItems = [];
        let totalAmount = 0;

        for (const id in cart) {
            const product = products.find(p => p.id === id);
            if (product) {
                const qty = cart[id];
                const itemTotal = qty * product.price;
                cartItems.push({
                    ...product,
                    qty,
                    itemTotal
                });
                totalAmount += itemTotal;
            }
        }

        navigate('/payment', { state: { cartItems, totalAmount } });
    };

    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

    return (
        <div style={{ maxWidth: '1200px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Dairy Marketplace</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Fresh farm-to-table dairy products direct from local farmers.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={fetchProducts} className="glass-panel" style={{ padding: '0.75rem', color: 'var(--text-dim)' }} title="Refresh Products">
                        <Repeat size={20} />
                    </button>
                    {orderSuccess && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '0.875rem' }}>
                            <CheckCircle size={18} />
                            Order Placed Successfully!
                        </div>
                    )}
                    <button
                        onClick={handleCheckout}
                        disabled={cartCount === 0}
                        className="glass-panel"
                        style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', opacity: cartCount === 0 ? 0.5 : 1 }}
                    >
                        <ShoppingCart size={20} color="var(--accent-primary)" />
                        <span style={{ fontWeight: '600' }}>{cartCount > 0 ? `Checkout (${cartCount})` : 'Cart'}</span>
                    </button>
                </div>
            </header>

            <div className="glass-panel" style={{ padding: '1rem', marginBottom: '3rem', display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                        type="text"
                        className="input-field"
                        style={{ paddingLeft: '3rem', marginBottom: 0 }}
                        placeholder="Search for Milk, Ghee, Curd..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Max Price: ₹{filters.maxPrice}</span>
                    <input
                        type="range"
                        min="0"
                        max="500"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                        style={{ accentColor: 'var(--accent-primary)' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Min Qty:</span>
                    <input
                        type="number"
                        min="0"
                        value={filters.minQty}
                        onChange={(e) => setFilters({ ...filters, minQty: Number(e.target.value) })}
                        className="input-field"
                        style={{ width: '60px', padding: '0.25rem', height: 'auto', marginBottom: 0 }}
                    />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: filters.onlyFresh ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: '8px', border: filters.onlyFresh ? '1px solid var(--accent-primary)' : 'none' }}>
                    <input
                        type="checkbox"
                        checked={filters.onlyFresh}
                        onChange={(e) => setFilters({ ...filters, onlyFresh: e.target.checked })}
                        style={{ accentColor: 'var(--accent-primary)' }}
                    />
                    <span style={{ fontSize: '0.875rem', color: filters.onlyFresh ? 'var(--accent-primary)' : 'var(--text-muted)' }}>Active</span>
                </label>
            </div>



            {
                loading ? <p>Loading products...</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                        {products.filter(p => {
                            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
                            const matchesPrice = p.price <= filters.maxPrice;
                            const matchesQty = p.quantity >= filters.minQty;
                            // Fresh goods usually refers to perishable items like Milk/Curd, or just checking date (but we don't have expiration logic yet, so assume category)
                            const matchesFresh = filters.onlyFresh ? ['Milk', 'Curd', 'Paneer'].includes(p.category) : true;
                            return matchesSearch && matchesPrice && matchesQty && matchesFresh;
                        }).map(product => (
                            <div key={product.id} className="glass-panel cattle-card" style={{ padding: 0, overflow: 'hidden', border: product.healthRisk === 'High' ? '1px solid #ef4444' : product.healthRisk === 'Medium' ? '1px solid #f59e0b' : 'none' }}>
                                <div style={{
                                    height: '180px',
                                    background: 'var(--bg-tertiary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '4rem',
                                    position: 'relative'
                                }}>
                                    {product.category === 'Milk' ? '🥛' : product.category === 'Ghee' ? '🍯' : '🧀'}

                                    {/* Health Risk Badge */}
                                    {product.healthRisk && product.healthRisk !== 'Low' && (
                                        <div style={{
                                            position: 'absolute', top: '10px', right: '10px',
                                            background: product.healthRisk === 'High' ? '#ef4444' : '#f59e0b',
                                            color: '#fff', padding: '4px 8px', borderRadius: '6px',
                                            fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            <AlertTriangle size={12} />
                                            {product.healthRisk === 'High' ? 'Safety Risk' : 'Advisory'}
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '1.25rem' }}>
                                    {/* ... existing header ... */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1.125rem' }}>{product.name}</h3>
                                        {/* ... existing rating ... */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <MapPin size={12} />
                                                {product.farmName || 'Local Farm'}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--accent-glow)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                                                <Star size={12} fill="var(--accent-primary)" />
                                                <span>4.8</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Advisory Text */}
                                    {product.healthRisk === 'Medium' && (
                                        <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <AlertTriangle size={12} /> Check farm health status
                                        </div>
                                    )}
                                    {product.healthRisk === 'High' && (
                                        <div style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <AlertTriangle size={12} /> Seller Temporarily Restricted
                                        </div>
                                    )}

                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <MapPin size={14} />
                                        {product.category} Section
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>₹{product.price}</span>
                                            <span style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}> /{product.unit}</span>
                                        </div>

                                        {cart[product.id] ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--accent-primary)', borderRadius: '6px', padding: '0.25rem' }}>
                                                <button onClick={() => toggleCart(product.id, -1)} style={{ color: 'var(--accent-primary)' }}><Minus size={16} /></button>
                                                <span style={{ fontWeight: '600', minWidth: '20px', textAlign: 'center' }}>{cart[product.id]}</span>
                                                <button onClick={() => toggleCart(product.id, 1)} style={{ color: 'var(--accent-primary)' }}><Plus size={16} /></button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => product.healthRisk !== 'High' && toggleCart(product.id, 1)}
                                                disabled={product.healthRisk === 'High'}
                                                style={{
                                                    background: product.healthRisk === 'High' ? '#ccc' : 'var(--accent-primary)',
                                                    color: '#fff',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    cursor: product.healthRisk === 'High' ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {product.healthRisk === 'High' ? 'Blocked' : 'ADD'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {products.length === 0 && <p>No products available right now.</p>}
                    </div>

                )
            }
        </div>
    );
}
