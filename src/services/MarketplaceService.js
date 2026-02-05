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
    async placeOrderAtomic(orderData) {
        // Atomic Transaction:
        // 1. Check Product Stock (Read)
        // 2. Fetch Farmer Wallet (Read)
        // 3. Fetch Farmer Profile (Read)
        // 4. Decrement Stock (Write)
        // 5. Update/Create Farmer Wallet (Write)
        // 6. Create Order (Write)

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

                const currentStock = productDoc.data().quantity;
                const buyQty = orderData.quantity;

                if (currentStock < buyQty) {
                    throw new Error(`Insufficient stock! Only ${currentStock} left.`);
                }

                const newStock = currentStock - buyQty;

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

                // 4. Update Product Stock
                transaction.update(productRef, {
                    quantity: newStock,
                    status: newStock === 0 ? 'Out of Stock' : 'Active'
                });

                // 5. Update/Create Wallet
                if (walletDoc.exists()) {
                    const newBalance = (walletDoc.data().balance || 0) + orderData.total;
                    transaction.update(walletRef, {
                        balance: newBalance,
                        updatedAt: new Date().toISOString()
                    });
                } else {
                    transaction.set(walletRef, {
                        farmerId: orderData.farmerId,
                        balance: orderData.total,
                        updatedAt: new Date().toISOString()
                    });
                }

                // 6. Create Order
                const newOrderRef = doc(collection(db, ORDERS));
                transaction.set(newOrderRef, {
                    ...orderData,
                    shopName: orderData.shopName || 'Local Farm',
                    // Farmer/Seller Details
                    farmerName: farmerDetails.farmerName,
                    farmerPhone: farmerDetails.farmerPhone,
                    farmerLocation: farmerDetails.farmerLocation,
                    // Buyer Details (passed from frontend)
                    buyerLocation: orderData.buyerLocation || '',
                    buyerPhone: orderData.buyerPhone || '',
                    status: 'Pending',
                    timestamp: new Date().toISOString(),
                    transactionId: newOrderRef.id // Store ID inside
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

    async updateOrderStatus(orderId, status) {
        await updateDoc(doc(db, ORDERS, orderId), { status });
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
