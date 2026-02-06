import { collection, query, where, getDocs, addDoc, orderBy, doc, updateDoc, deleteDoc, increment, setDoc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const PRODUCTS = 'products';
const ORDERS = 'orders';

export const MarketplaceService = {
    // Product Management (Farmer side)
    async getFarmerProducts(farmerId) {
        const q = query(collection(db, PRODUCTS), where('farmerId', '==', farmerId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addProduct(productData) {
        const docRef = await addDoc(collection(db, PRODUCTS), {
            ...productData,
            status: 'Active',
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    },

    async deleteProduct(id) {
        await deleteDoc(doc(db, PRODUCTS, id));
    },

    // Marketplace (Buyer side)
    async getAllProducts() {
        const snapshot = await getDocs(collection(db, PRODUCTS));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Order Management
    // --- INVENTORY LOCKING ENGINE ---

    async lockStock(productId, quantity, userId) {
        try {
            await runTransaction(db, async (transaction) => {
                const productRef = doc(db, PRODUCTS, productId);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists()) throw new Error("Product not found");

                const data = productDoc.data();
                const currentStock = data.quantity || 0;
                const currentLocked = data.lockedQuantity || 0;
                const locks = data.locks || [];

                // Check existing lock for this user to avoid double locking
                const existingLockIndex = locks.findIndex(l => l.userId === userId);
                let lockQtyAdjustment = quantity;

                if (existingLockIndex !== -1) {
                    // Update existing lock
                    lockQtyAdjustment = quantity - locks[existingLockIndex].quantity;
                }

                // Check availability
                if ((currentStock - currentLocked) < lockQtyAdjustment) {
                    throw new Error("Insufficient stock to lock.");
                }

                const newLocks = [...locks];
                if (existingLockIndex !== -1) {
                    newLocks[existingLockIndex] = { userId, quantity, expiresAt: Date.now() + 10 * 60 * 1000 }; // 10 min lock
                } else {
                    newLocks.push({ userId, quantity, expiresAt: Date.now() + 10 * 60 * 1000 });
                }

                transaction.update(productRef, {
                    lockedQuantity: currentLocked + lockQtyAdjustment,
                    locks: newLocks
                });
            });
            return { success: true };
        } catch (e) {
            console.error("Lock Stock Failed:", e);
            throw e;
        }
    },

    async unlockStock(productId, userId) {
        try {
            await runTransaction(db, async (transaction) => {
                const productRef = doc(db, PRODUCTS, productId);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists()) return;

                const data = productDoc.data();
                const locks = data.locks || [];
                const userLock = locks.find(l => l.userId === userId);

                if (userLock) {
                    const newLocks = locks.filter(l => l.userId !== userId);
                    const newLockedQty = Math.max(0, (data.lockedQuantity || 0) - userLock.quantity);

                    transaction.update(productRef, {
                        locks: newLocks,
                        lockedQuantity: newLockedQty
                    });
                }
            });
        } catch (e) {
            console.error("Unlock Stock Failed:", e);
        }
    },

    async placeOrderAtomic(orderData) {
        // Atomic Transaction with Lock Consumption:
        // 1. Read Product & Locks
        // 2. Read Wallet & Farm
        // 3. Logic: Consume lock if exists, else check free stock
        // 4. Update Product (Quantity & Locks)
        // 5. Update Wallet
        // 6. Create Order

        try {
            await runTransaction(db, async (transaction) => {
                // --- READ OPERATIONS ---

                // 1. Read Product
                const productRef = doc(db, PRODUCTS, orderData.productId);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists()) {
                    throw new Error("Product does not exist!");
                }

                // 2. Read Wallet
                const walletRef = doc(db, 'wallets', orderData.farmerId);
                const walletDoc = await transaction.get(walletRef);

                // 3. Read Farm Profile
                const farmRef = doc(db, 'farms', orderData.farmerId);
                const farmDoc = await transaction.get(farmRef);

                // --- LOGIC & VALIDATION ---

                const pData = productDoc.data();
                const currentStock = pData.quantity;
                const buyQty = orderData.quantity;
                const userId = orderData.buyerId;

                // Lock Consumption Logic
                const locks = pData.locks || [];
                const userLock = locks.find(l => l.userId === userId);

                // Determine valid stock deduction
                let newStock = currentStock - buyQty;
                let newLockedQty = pData.lockedQuantity || 0;
                let newLocks = [...locks];

                if (userLock) {
                    // Scenario A: User HAS A LOCK (Expected path)
                    // We consume their lock.
                    // The stock was already "reserved" via lockedQuantity, but physically it's still in 'quantity'.
                    // So we reduce 'quantity' by buyQty.
                    // And we reduce 'lockedQuantity' by the lock amount (releasing the reservation).

                    newLockedQty = Math.max(0, newLockedQty - userLock.quantity);
                    newLocks = newLocks.filter(l => l.userId !== userId);

                    // Sanity check: ensure even with lock, physical stock exists (it should)
                    if (currentStock < buyQty) throw new Error("Critical Stock Error: Lock exists but physical stock missing.");

                } else {
                    // Scenario B: Direct Buy (No Lock)
                    // Must check against (Total - Locked)
                    const freeStock = currentStock - newLockedQty;
                    if (freeStock < buyQty) {
                        throw new Error(`Insufficient stock! Available: ${freeStock}`);
                    }
                }

                // Prepare Farmer Details
                let farmerDetails = {
                    farmerName: 'Farmer',
                    farmerPhone: '',
                    farmerLocation: ''
                };

                if (farmDoc.exists()) {
                    const farmData = farmDoc.data();
                    farmerDetails = {
                        farmerName: farmData.farmerName || farmData.farmName || 'Farmer',
                        farmerPhone: farmData.mobile || '',
                        farmerLocation: [farmData.village, farmData.district, farmData.state]
                            .filter(Boolean)
                            .join(', ') || ''
                    };
                }

                // --- WRITE OPERATIONS ---

                // 4. Update Product Stock & Locks
                transaction.update(productRef, {
                    quantity: newStock,
                    lockedQuantity: newLockedQty,
                    locks: newLocks,
                    status: newStock === 0 ? 'Out of Stock' : 'Active'
                });

                // 5. Update Wallet (Only if NOT Negotiating - Negotiation implies pay later/COD)
                // If status is 'Negotiating', we don't deduct/add money yet.
                if (orderData.status !== 'Negotiating' && orderData.paymentMethod !== 'COD') {
                    const sellerWalletRef = doc(db, 'wallets', orderData.farmerId);
                    const sellerWallet = await transaction.get(sellerWalletRef);

                    if (sellerWallet.exists()) {
                        transaction.update(sellerWalletRef, {
                            balance: (sellerWallet.data().balance || 0) + orderData.total,
                            updatedAt: new Date().toISOString()
                        });
                    } else {
                        transaction.set(sellerWalletRef, {
                            farmerId: orderData.farmerId,
                            balance: orderData.total,
                            updatedAt: new Date().toISOString()
                        });
                    }
                }
                // 6. Create Order (This should be done regardless of payment method)
                const orderRef = collection(db, 'orders');
                transaction.set(doc(orderRef), {
                    ...orderData,
                    farmerDetails,
                    freshnessScore: Math.floor(Math.random() * (100 - 90 + 1)) + 90, // Mock 90-100% freshness
                    timestamp: new Date().toISOString()
                });
            });
            return { success: true };
        } catch (e) {
            console.error("Transaction Failed: ", e);
            throw e;
        }
    },

    async getFarmerOrders(farmerId) {
        const q = query(collection(db, ORDERS), where('farmerId', '==', farmerId));
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    async getBuyerOrders(buyerId) {
        const q = query(collection(db, ORDERS), where('buyerId', '==', buyerId));
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    async getAllOrders() {
        const snapshot = await getDocs(query(collection(db, ORDERS), orderBy('timestamp', 'desc')));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // 🔹 Update Order Status (For Farmer Acceptance)
    async updateOrderStatus(orderId, status) {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const updateData = { status };

            if (status === 'Accepted') updateData.acceptedAt = new Date().toISOString();
            if (status === 'Rejected') updateData.rejectedAt = new Date().toISOString();
            if (status === 'Out for Delivery') {
                updateData.deliveryStartedAt = new Date().toISOString();
                // Simulate 30-min delivery
                updateData.estimatedDeliveryTime = new Date(Date.now() + 30 * 60000).toISOString();
            }
            if (status === 'Delivered') updateData.deliveredAt = new Date().toISOString();

            await updateDoc(orderRef, updateData);
        } catch (error) {
            console.error("Error updating status:", error);
            throw error;
        }
    },

    async completeOrder(orderId, paymentMethod, amount, farmerId) {
        try {
            await runTransaction(db, async (transaction) => {
                // 1. READS FIRST
                const orderRef = doc(db, 'orders', orderId);
                const orderDoc = await transaction.get(orderRef);

                if (!orderDoc.exists()) throw new Error("Order not found!");
                const orderData = orderDoc.data();

                if (orderData.status === 'Completed') throw new Error("Order already completed.");

                let walletRef;
                let walletSnap;

                if (paymentMethod === 'COD') {
                    walletRef = doc(db, 'wallets', farmerId);
                    walletSnap = await transaction.get(walletRef);
                }

                // 2. WRITES SECOND
                transaction.update(orderRef, {
                    status: 'Completed',
                    completedAt: new Date().toISOString()
                });

                if (paymentMethod === 'COD') {
                    if (walletSnap.exists()) {
                        transaction.update(walletRef, {
                            balance: (walletSnap.data().balance || 0) + amount,
                            updatedAt: new Date().toISOString()
                        });
                    } else {
                        transaction.set(walletRef, {
                            farmerId: farmerId,
                            balance: amount,
                            updatedAt: new Date().toISOString()
                        });
                    }
                }
            });
            return { success: true };
        } catch (error) {
            console.error("Order Completion Failed:", error);
            throw error;
        }
    },

    async updateFarmerWallet(farmerId, amount) {
        const walletRef = doc(db, 'wallets', farmerId);
        const walletSnap = await getDoc(walletRef);

        if (walletSnap.exists()) {
            await updateDoc(walletRef, {
                balance: increment(amount),
                updatedAt: new Date().toISOString()
            });
        } else {
            await setDoc(walletRef, {
                farmerId,
                balance: amount,
                updatedAt: new Date().toISOString()
            });
        }
    },

    async simulateBulkProducts(farmerId) {
        const categories = ['Milk', 'Ghee', 'Paneer', 'Curd', 'Butter'];
        const units = { 'Milk': 'Liter', 'Ghee': 'Kg', 'Paneer': 'Kg', 'Curd': 'Kg', 'Butter': 'Kg' };
        const productsToAdd = [];

        const farmNames = ['Murugan agro foods', 'vinaygam farm Fresh', 'Sri Lakshmi Dairy', 'Green Valley Farm', 'Organic Meadows'];
        for (let i = 1; i <= 50; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const chosenFarm = farmNames[Math.floor(Math.random() * farmNames.length)];
            productsToAdd.push({
                name: `${category} Batch #${i}`,
                category: category,
                price: Math.floor(Math.random() * (500 - 40 + 1)) + 40,
                quantity: Math.floor(Math.random() * 100) + 10,
                unit: units[category],
                status: 'Active',
                farmerId: farmerId,
                farmName: chosenFarm,
                createdAt: new Date().toISOString()
            });
        }

        const promises = productsToAdd.map(p => addDoc(collection(db, PRODUCTS), p));
        await Promise.all(promises);
    },

    async simulateSampleOrders(userId) {
        const sampleOrders = [
            {
                buyerId: userId,
                farmerId: 'sim_farmer_1',
                shopName: 'Murugan agro foods',
                productName: 'Fresh A2 Milk',
                quantity: 5,
                price: 60,
                total: 300,
                status: 'Delivered',
                timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
                buyerId: userId,
                farmerId: 'sim_farmer_2',
                shopName: 'vinaygam farm Fresh',
                productName: 'Pure Cow Ghee',
                quantity: 1,
                price: 450,
                total: 450,
                status: 'Out for Delivery',
                timestamp: new Date(Date.now() - 86400000).toISOString()
            },
            {
                buyerId: userId,
                farmerId: 'sim_farmer_1',
                shopName: 'Murugan agro foods',
                productName: 'Organic Curd',
                quantity: 2,
                price: 40,
                total: 80,
                status: 'Pending',
                timestamp: new Date().toISOString()
            }
        ];

        const promises = sampleOrders.map(order => addDoc(collection(db, ORDERS), order));
        await Promise.all(promises);
    },

    // 🔹 New: Mock Shop Order Data for Demand Intelligence
    async getDemandInsights() {
        const ordersSnapshot = await getDocs(query(collection(db, ORDERS)));
        const orders = ordersSnapshot.docs.map(doc => doc.data());

        // 1. Calculate High Demand Products (Top 3 by frequency)
        const productCounts = {};
        orders.forEach(o => {
            productCounts[o.productName] = (productCounts[o.productName] || 0) + (parseInt(o.quantity) || 1);
        });
        const highDemandProducts = Object.keys(productCounts)
            .sort((a, b) => productCounts[b] - productCounts[a])
            .slice(0, 3);

        // 2. Count Active Shops (Unique Buyers)
        const uniqueShops = new Set(orders.map(o => o.buyerId));
        const shopsOrdering = uniqueShops.size;

        // 3. Determine Festival Context (Simple Date Logic)
        const today = new Date();
        const month = today.getMonth(); // 0 = Jan
        let festivalContext = "Regular Season";
        if (month === 0) festivalContext = "Pongal (Harvest Festival)";
        if (month === 9 || month === 10) festivalContext = "Diwali Season";
        if (month === 3) festivalContext = "Tamil New Year";

        // 4. Rising Trend (Simple: items ordered in last 24h)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const recentOrders = orders.filter(o => new Date(o.timestamp) > yesterday);
        const risingTrend = [...new Set(recentOrders.map(o => o.productName))].slice(0, 2);

        return {
            highDemandProducts,
            risingTrend: risingTrend.length > 0 ? risingTrend : ['Milk'], // Default fallback if no recent data
            shopsOrdering,
            festivalContext,
            recentOrdersCount: recentOrders.length
        };
    }
};
