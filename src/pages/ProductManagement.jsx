import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Package, Check, X, AlertCircle } from 'lucide-react';
import { db } from '../firebase/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { MarketplaceService } from '../services/MarketplaceService';

import { CattleService } from '../services/CattleService';

export default function ProductManagement() {
    const { userData } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', category: 'Milk', price: '', quantity: '', unit: 'Liter', status: 'Active' });
    const [farmName, setFarmName] = useState('');
    const [farmRisk, setFarmRisk] = useState('Low');
    const [cattleList, setCattleList] = useState([]);

    const fetchCattle = async () => {
        if (!userData?.uid) return;
        try {
            const cattle = await CattleService.getAllCattle(userData.uid);
            setCattleList(cattle);
        } catch (error) {
            console.error("Error fetching cattle:", error);
        }
    };

    const fetchFarmName = async () => {
        if (!userData?.uid) return;
        try {
            const farmDoc = await getDoc(doc(db, 'farms', userData.uid));
            if (farmDoc.exists()) {
                setFarmName(farmDoc.data().farmName);
            }
        } catch (error) {
            console.error("Error fetching farm name:", error);
        }
    };

    const checkFarmHealth = async () => {
        if (!userData?.uid) return;
        const risk = await CattleService.getFarmRiskLevel(userData.uid);
        setFarmRisk(risk);
    };

    const fetchProducts = async (isSilent = false) => {
        if (!userData) return;
        if (!isSilent) setLoading(true);
        try {
            const productList = await MarketplaceService.getFarmerProducts(userData.uid);

            setProducts(prev => {
                if (JSON.stringify(prev) === JSON.stringify(productList)) return prev;
                return productList;
            });

            if (productList.length > 0 && !newProduct.price) {
                // Set smart default: suggest last added product's price for new ones
                setNewProduct(prev => ({ ...prev, price: productList[0].price }));
            }
        } catch (error) {
            console.error("❌ Firestore Fetch Error:", error);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchFarmName();
        checkFarmHealth();
        fetchCattle();

        // Polling (15s) to catch stock changes from sales
        const interval = setInterval(() => {
            if (!document.hidden) {
                fetchProducts(true);
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [userData]);

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const selectedCattle = cattleList.find(c => c.id === newProduct.sourceCattleId);

            await MarketplaceService.addProduct({
                ...newProduct,
                price: parseFloat(newProduct.price),
                quantity: parseFloat(newProduct.quantity),
                farmerId: userData.uid,
                farmName: farmName || 'Local Farm',
                healthRisk: farmRisk, // Auto-tag product with current farm risk
                sourceCattleId: selectedCattle?.id || null,
                sourceCattleTag: selectedCattle?.tagId || null,
                productionDate: new Date().toISOString(),
                healthVerified: selectedCattle ? (farmRisk === 'Low') : false
            });
            setShowModal(false);
            setNewProduct({ name: '', category: 'Milk', price: '', quantity: '', unit: 'Liter', status: 'Active' });
            fetchProducts();
        } catch (error) {
            console.error("❌ Firestore Add Error:", error);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await MarketplaceService.deleteProduct(id);
                fetchProducts();
            } catch (error) {
                console.error("Error deleting product:", error);
            }
        }
    };




    return (
        <div style={{ maxWidth: '1000px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Product Management</h1>
                    <p style={{ color: 'var(--text-muted)' }}>List your dairy products for sale and manage inventory.</p>
                </div>

                <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowModal(true)}>
                    <Plus size={20} />
                    Add New Product
                </button>
            </header>

            {/* Risk Warning Banner */}
            {farmRisk !== 'Low' && (
                <div style={{
                    background: farmRisk === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    border: `1px solid ${farmRisk === 'High' ? '#ef4444' : '#f59e0b'}`,
                    padding: '1rem',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <AlertCircle size={24} color={farmRisk === 'High' ? '#ef4444' : '#f59e0b'} />
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: farmRisk === 'High' ? '#ef4444' : '#f59e0b' }}>
                            {farmRisk} Health Risk Detected
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Selected cattle in your herd have flagged health issues. New products will be marked with a health advisory.
                        </p>
                    </div>
                </div>
            )}

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        <tr>
                            <th style={{ padding: '1.25rem' }}>Product Name</th>
                            <th style={{ padding: '1.25rem' }}>Category</th>
                            <th style={{ padding: '1.25rem' }}>Price</th>
                            <th style={{ padding: '1.25rem' }}>Stock</th>
                            <th style={{ padding: '1.25rem' }}>Status</th>
                            <th style={{ padding: '1.25rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody style={{ fontSize: '0.9375rem' }}>
                        {products.map(p => (
                            <tr key={p.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                            <Package size={18} color="var(--accent-primary)" />
                                        </div>
                                        {p.name}
                                        {['Milk', 'Curd'].includes(p.category) && (
                                            <span style={{
                                                fontSize: '10px',
                                                padding: '2px 6px',
                                                background: 'rgba(16, 185, 129, 0.1)',
                                                color: '#10b981',
                                                borderRadius: '4px',
                                                marginLeft: '0.5rem'
                                            }}>Fresh: 48h</span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem' }}>{p.category}</td>
                                <td style={{ padding: '1.25rem' }}>₹{p.price}/{p.unit}</td>
                                <td style={{ padding: '1.25rem' }}>{p.quantity} {p.unit}s</td>
                                <td style={{ padding: '1.25rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '99px',
                                        fontSize: '0.75rem',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: 'var(--accent-primary)'
                                    }}>
                                        {p.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button style={{ color: 'var(--text-dim)' }}><Edit3 size={18} /></button>
                                        <button title="Delete Product" onClick={() => handleDeleteProduct(p.id)} style={{ color: '#f87171' }}><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty State Simulation */}
            {
                products.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <Package size={48} color="var(--text-dim)" style={{ marginBottom: '1rem' }} />
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Products Listed</h2>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Start your dairy business by adding your first product.</p>
                        <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowModal(true)}>Add Product</button>
                    </div>
                )
            }

            {/* Add Product Modal */}
            {
                showModal && (
                    <div className="modal-overlay" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.25rem' }}>Add New Product</h2>
                                <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-dim)' }}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleAddProduct}>
                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Product Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        placeholder="e.g. Fresh Buffalo Milk"
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Category</label>
                                        <select
                                            className="input-field"
                                            value={newProduct.category}
                                            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                        >
                                            <option>Milk</option>
                                            <option>Ghee</option>
                                            <option>Paneer</option>
                                            <option>Curd</option>
                                            <option>Butter</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Unit</label>
                                        <select
                                            className="input-field"
                                            value={newProduct.unit}
                                            onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                                        >
                                            <option>Liter</option>
                                            <option>Kg</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Source Cattle Selection */}
                                <div className="input-group" style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Source Cattle (Optional - For Traceability)</label>
                                    <select
                                        className="input-field"
                                        value={newProduct.sourceCattleId || ''}
                                        onChange={(e) => setNewProduct({ ...newProduct, sourceCattleId: e.target.value })}
                                    >
                                        <option value="">-- Select Cattle --</option>
                                        {cattleList.map(cow => (
                                            <option key={cow.id} value={cow.id}>{cow.tagId} ({cow.breed})</option>
                                        ))}
                                    </select>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                                        Linking a healthy animal adds a "Verified" badge to your product.
                                    </p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                    <div className="input-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Price (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            className="input-field"
                                            value={newProduct.price}
                                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Stock Quantity</label>
                                        <input
                                            type="number"
                                            required
                                            className="input-field"
                                            value={newProduct.quantity}
                                            onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Add Product</button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
