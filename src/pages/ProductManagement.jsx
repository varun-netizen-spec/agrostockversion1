import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Package, Check, X, AlertCircle } from 'lucide-react';
import { db } from '../firebase/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { MarketplaceService } from '../services/MarketplaceService';

export default function ProductManagement() {
    const { userData } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', category: 'Milk', price: '', quantity: '', unit: 'Liter', status: 'Active' });
    const [farmName, setFarmName] = useState('');

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
            await MarketplaceService.addProduct({
                ...newProduct,
                price: parseFloat(newProduct.price),
                quantity: parseFloat(newProduct.quantity),
                farmerId: userData.uid,
                farmName: farmName || 'Local Farm'
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
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
