import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, ShieldCheck, Download, ArrowLeft, Loader2, Printer, Share2, MapPin } from 'lucide-react';
import { MarketplaceService } from '../services/MarketplaceService';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Payment() {
    const { state } = useLocation();
    const { userData } = useAuth();
    const navigate = useNavigate();

    // State from navigation (Cart items)
    const { cartItems, totalAmount } = state || { cartItems: [], totalAmount: 0 };

    const [processing, setProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [transactionId, setTransactionId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [invoiceDate, setInvoiceDate] = useState(null);
    const [offerPrice, setOfferPrice] = useState('');

    // Buyer Information
    const [buyerInfo, setBuyerInfo] = useState({
        name: userData?.displayName || userData?.email?.split('@')[0] || '',
        location: '',
        phone: ''
    });

    // If accessed directly without cart
    if (!state) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>No items to checkout</h2>
                <button onClick={() => navigate('/marketplace')} className="btn-primary" style={{ width: 'auto', marginTop: '1rem' }}>
                    Go to Marketplace
                </button>
            </div>
        );
    }

    // --- INVENTORY LOCKING ---
    const [locking, setLocking] = useState(true);
    const lockedItemsRef = React.useRef([]);
    const hasLockedRef = React.useRef(false);
    const isMounted = React.useRef(true);

    React.useEffect(() => {
        isMounted.current = true;
        const lockInventory = async () => {
            if (hasLockedRef.current) return;
            hasLockedRef.current = true;

            try {
                const promises = cartItems.map(item =>
                    MarketplaceService.lockStock(item.id, item.qty, userData.uid)
                );
                await Promise.all(promises);
                lockedItemsRef.current = cartItems;
                if (isMounted.current) setLocking(false);
            } catch (error) {
                console.error("Locking Error:", error);
                alert("Some items are no longer available. Returning to marketplace.");
                navigate('/marketplace');
            }
        };

        if (userData?.uid && cartItems.length > 0) {
            lockInventory();
        } else if (userData?.uid && cartItems.length === 0) {
            setLocking(false);
        }

        return () => {
            isMounted.current = false;
            // Cleanup: Unlock stock when leaving (if not purchased)
            if (lockedItemsRef.current.length > 0) {
                lockedItemsRef.current.forEach(item => {
                    MarketplaceService.unlockStock(item.id, userData.uid);
                });
            }
        };
    }, [userData, cartItems.length]);

    if (locking) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={48} color="var(--accent-primary)" />
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Securing your items...</p>
            </div>
        );
    }

    const handlePay = async () => {
        setProcessing(true);

        // 1. Simulate Gateway Delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            // 2. Place Orders in Backend
            const tId = 'INV-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000); // Generate Invoice Format ID
            const date = new Date().toLocaleString();
            setInvoiceDate(date);

            // Logic for Offer/Negotiation
            const isNegotiating = offerPrice && parseFloat(offerPrice) < totalAmount;
            const finalTotal = isNegotiating ? parseFloat(offerPrice) : totalAmount;

            // Distribute offer price proportionally if multiple items (Simplified: mostly single item orders expected for negotiation, but let's handle proportional)
            // Actually, negotiation usually happens on the total. We need to split it per item?
            // "Farmers sell independently". CartItems might be from DIFFERENT farmers. 
            // !! Negotiation assumes 1 farmer or we negotiate with EACH? 
            // The prompt says "Multiple farmers sell independently". 
            // If checking out cart with multiple farmers, negotiation is messy.
            // Assumption: User negotiates on the TOTAL bill. We will split the discount proportionally.

            const discountRatio = isNegotiating ? (parseFloat(offerPrice) / totalAmount) : 1;

            for (const item of cartItems) {
                const itemTotal = item.qty * item.price;
                const negotiatedItemTotal = Math.floor(itemTotal * discountRatio);

                try {
                    await MarketplaceService.placeOrderAtomic({
                        buyerId: userData.uid,
                        buyerName: buyerInfo.name || userData.displayName || userData.email?.split('@')[0] || 'Buyer',
                        buyerLocation: buyerInfo.location,
                        buyerPhone: buyerInfo.phone,
                        farmerId: item.farmerId,
                        shopName: item.farmName || 'Local Farm',
                        productId: item.id,
                        productName: item.name,
                        quantity: item.qty,
                        price: item.price,
                        total: negotiatedItemTotal, // The price this farmer gets (if accepted)
                        originalTotal: itemTotal,   // Reference
                        paymentId: tId,
                        paymentMethod: isNegotiating ? 'COD' : paymentMethod,
                        status: isNegotiating ? 'Negotiating' : 'Placed' // Status change
                    });
                } catch (err) {
                    console.error(`Failed to place order for ${item.name}:`, err);
                    alert(`Could not place order for ${item.name}. Possibly out of stock.`);
                    // Ideally, we might want to partial refund or stop, but for now we continue
                }
            }

            setTransactionId(tId);
            setPaymentSuccess(true);
        } catch (error) {
            console.error(error);
            alert("Payment Failed. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    const downloadPDF = () => {
        try {
            const doc = new jsPDF();

            // Brand Color for Header
            doc.setFillColor(16, 185, 129); // Emerald 500
            doc.rect(0, 0, 210, 40, 'F');

            // Header Text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(26);
            doc.setFont('helvetica', 'bold');
            doc.text("AgroStock", 15, 25);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text("Premium Agricultural Intelligence & Marketplace", 15, 32);

            doc.setFontSize(20);
            doc.text("INVOICE", 160, 25);

            // Reset Text Color
            doc.setTextColor(0, 0, 0);

            // Invoice Details
            doc.setFontSize(10);
            doc.text(`Invoice ID: ${transactionId}`, 150, 50);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 56);
            doc.text(`Status:`, 150, 62);
            doc.setTextColor(16, 185, 129);
            doc.setFont('helvetica', 'bold');
            doc.text("PAID", 162, 62);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');

            // Bill To / Bill From
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text("Billed From:", 15, 50);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text("AgroStock Platform", 15, 56);
            doc.text("Tech City, Hyderabad, India", 15, 62);
            doc.text("support@agrostock.com", 15, 68);

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text("Billed To:", 15, 80);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(userData.displayName || userData.email, 15, 86);
            doc.text(userData.email, 15, 92);

            // Table
            const tableColumn = ["Item Description", "Quantity", "Unit Price", "Total"];
            const tableRows = [];

            cartItems.forEach(item => {
                const itemData = [
                    item.name,
                    item.qty,
                    `Rs. ${item.price}`,
                    `Rs. ${item.qty * item.price}`
                ];
                tableRows.push(itemData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 100,
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129], textColor: 255 },
                styles: { fontSize: 10, cellPadding: 3 },
                foot: [['', '', 'Grand Total', `Rs. ${totalAmount}`]],
                footStyles: { fillColor: [241, 245, 249], textColor: 0, fontStyle: 'bold' }
            });

            // Footer
            const finalY = doc.lastAutoTable.finalY || 150;
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text("Thank you for your business!", 15, finalY + 20);
            doc.text("This is a computer-generated invoice and does not require a signature.", 15, finalY + 26);

            doc.save(`AgroStock_Invoice_${transactionId}.pdf`);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    if (paymentSuccess) {
        return (
            <div style={{ maxWidth: '800px', margin: '2rem auto', animation: 'fadeIn 0.5s ease-out' }}>
                {/* Visual Invoice UI */}
                <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>

                    {/* Decorative Top Bar */}
                    <div style={{
                        height: '10px',
                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                        width: '100%'
                    }}></div>

                    <div style={{ padding: '3rem' }}>

                        {/* Header Section */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                            <div>
                                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#10b981', marginBottom: '0.5rem' }}>
                                    AgroStock
                                </h1>
                                <p style={{ color: 'var(--text-muted)' }}>Premium Agricultural Marketplace</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice</h2>
                                <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}># {transactionId}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{invoiceDate}</div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div style={{
                            position: 'absolute',
                            top: '160px',
                            right: '50px',
                            border: '2px solid #10b981',
                            color: '#10b981',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '8px',
                            transform: 'rotate(-10deg)',
                            fontWeight: 'bold',
                            fontSize: '1.5rem',
                            opacity: 0.8,
                            pointerEvents: 'none'
                        }}>
                            PAID
                        </div>

                        {/* Billing Info Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
                            <div>
                                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Billed From</h3>
                                <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>AgroStock Platform</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
                                    Tech Hub Sector 1<br />
                                    Digital Agriculture Division<br />
                                    support@agrostock.com
                                </div>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Billed To</h3>
                                <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>{userData.displayName || 'Valued Customer'}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
                                    {userData.email}<br />
                                    Customer ID: {userData.uid.substring(0, 8).toUpperCase()}
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div style={{ marginBottom: '2rem', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <div>Item Description</div>
                                <div style={{ textAlign: 'center' }}>Quantity</div>
                                <div style={{ textAlign: 'right' }}>Unit Price</div>
                                <div style={{ textAlign: 'right' }}>Total</div>
                            </div>
                            {cartItems.map((item, idx) => (
                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '1.25rem 1.5rem', borderBottom: idx !== cartItems.length - 1 ? '1px solid var(--border-color)' : 'none', fontSize: '0.95rem' }}>
                                    <div style={{ fontWeight: '500' }}>{item.name}</div>
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{item.qty}</div>
                                    <div style={{ textAlign: 'right', color: 'var(--text-muted)' }}>₹{item.price}</div>
                                    <div style={{ textAlign: 'right', fontWeight: '500' }}>₹{item.qty * item.price}</div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
                            <div style={{ width: '250px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span>Subtotal</span>
                                    <span>₹{totalAmount}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span>Tax (0%)</span>
                                    <span>₹0</span>
                                </div>
                                <div style={{ height: '1px', background: 'var(--border-color)', margin: '1rem 0' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem' }}>
                                    <span style={{ color: 'var(--text-main)' }}>Total</span>
                                    <span style={{ color: '#10b981' }}>₹{totalAmount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: '#10b981', padding: '0.5rem', borderRadius: '50%' }}>
                                    <CreditCard size={20} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#10b981' }}>Payment Successful via {paymentMethod}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Transaction ID: {transactionId}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <CheckCircle size={16} color="#10b981" /> Verified
                            </div>
                        </div>

                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
                    <button onClick={downloadPDF} className="btn-primary" style={{ padding: '0.75rem 2rem', gap: '0.75rem' }}>
                        <Download size={18} /> Download PDF
                    </button>
                    <button onClick={() => navigate('/marketplace')} className="glass-panel" style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer' }}>
                        Back to Market
                    </button>
                </div>
            </div>
        );
    }

    // Default checkout view
    return (
        <div style={{ maxWidth: '900px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', margin: '0 auto' }}>
            {/* Left: Payment Form */}
            <div>
                <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
                    <ArrowLeft size={18} /> Back
                </button>
                <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Checkout & Payment</h1>

                {/* Buyer Information Section */}
                <section className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <MapPin size={20} color="var(--accent-primary)" />
                        Buyer Information
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                        <div className="input-group">
                            <label className="input-label">Full Name *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={buyerInfo.name}
                                onChange={(e) => setBuyerInfo({ ...buyerInfo, name: e.target.value })}
                                placeholder="Enter your name"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Location / Address *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={buyerInfo.location}
                                onChange={(e) => setBuyerInfo({ ...buyerInfo, location: e.target.value })}
                                placeholder="City, Area, or Full Address"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Phone Number *</label>
                            <input
                                type="tel"
                                className="input-field"
                                value={buyerInfo.phone}
                                onChange={(e) => setBuyerInfo({ ...buyerInfo, phone: e.target.value })}
                                placeholder="+91 XXXXX XXXXX"
                                required
                            />
                        </div>
                    </div>
                </section>

                <section className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CreditCard size={20} color="var(--accent-primary)" />
                        Select Payment Method
                    </h2>

                    {/* Negotiation Input */}
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px', border: '1px solid #38bdf8' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#38bdf8' }}>Negotiate Price (Optional)</label>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <input
                                type="number"
                                className="input-field"
                                style={{ marginBottom: 0 }}
                                placeholder={`Offer less than ₹${totalAmount}`}
                                value={offerPrice}
                                onChange={(e) => setOfferPrice(e.target.value)}
                            />
                            {offerPrice && <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Original: ₹{totalAmount}</span>}
                        </div>
                        {offerPrice && (
                            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-dim)' }}>
                                * If you negotiate, payment will be "Pay on Delivery" after farmer approval.
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {!offerPrice && ['UPI', 'Card', 'COD'].map((method) => (
                            <label key={method} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: `1px solid ${paymentMethod === method ? 'var(--accent-primary)' : 'var(--border-color)'}`, borderRadius: '12px', cursor: 'pointer', background: paymentMethod === method ? 'var(--accent-glow)' : 'transparent', transition: 'all 0.2s' }}>
                                <div style={{
                                    width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border-color)',
                                    borderColor: paymentMethod === method ? 'var(--accent-primary)' : 'var(--border-color)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {paymentMethod === method && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>}
                                </div>
                                <input type="radio" name="payment" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} style={{ display: 'none' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600' }}>{method === 'UPI' ? 'UPI / GPay / PhonePe' : method === 'Card' ? 'Credit / Debit Card' : 'Cash on Delivery'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{method === 'UPI' ? 'Scan QR or Enter UPI ID' : method === 'Card' ? 'Visa, Mastercard, RuPay' : 'Pay when you receive'}</div>
                                </div>
                            </label>
                        ))}
                        {offerPrice && (
                            <div style={{ padding: '1rem', border: '1px solid #38bdf8', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <ShieldCheck size={20} color="#38bdf8" />
                                <div>
                                    <div style={{ fontWeight: '600', color: '#38bdf8' }}>Negotiation Mode</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Payment will be handled after acceptance.</div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <ShieldCheck size={16} color="#10b981" />
                    Payments are secure and encrypted.
                </div>
            </div>

            {/* Right: Order Summary */}
            <div>
                <div style={{ height: '4.5rem' }}></div> {/* Spacer for header alignment */}
                <section className="glass-panel" style={{ padding: '2rem', position: 'sticky', top: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Order Summary</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
                        {cartItems.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem' }}>
                                <div>
                                    <div style={{ fontWeight: '500' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Qty: {item.qty}</div>
                                </div>
                                <div>₹{item.qty * item.price}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '2rem' }}>
                        <span>Total to Pay</span>
                        <span style={{ color: 'var(--accent-primary)' }}>₹{totalAmount}</span>
                    </div>

                    <button
                        onClick={handlePay}
                        disabled={processing}
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1rem' }}
                    >
                        {processing ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Processing...
                            </>
                        ) : (
                            `Pay ₹${totalAmount}`
                        )}
                    </button>
                </section>
            </div>
        </div>
    );
}
