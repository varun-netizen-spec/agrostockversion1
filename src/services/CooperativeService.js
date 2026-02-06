import { collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc, runTransaction, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { MarketplaceService } from './MarketplaceService';

const COOPERATIVES = 'cooperatives';
const USERS = 'users';

export const CooperativeService = {

    // 1. Create a new Cooperative
    async createCooperative(name, adminId) {
        try {
            const docRef = await addDoc(collection(db, COOPERATIVES), {
                name,
                adminId,
                members: [adminId], // Admin is the first member
                createdAt: new Date().toISOString(),
                stats: {
                    totalOrdersFulfilled: 0,
                    totalRevenue: 0
                }
            });

            // Link admin's profile to this coop
            await updateDoc(doc(db, USERS, adminId), {
                cooperativeId: docRef.id
            });

            return docRef.id;
        } catch (error) {
            console.error("Error creating cooperative:", error);
            throw error;
        }
    },

    // 2. Join an existing Cooperative (simplified without approval flow for MVP)
    async joinCooperative(coopId, farmerId) {
        try {
            const coopRef = doc(db, COOPERATIVES, coopId);
            const userRef = doc(db, USERS, farmerId);

            await runTransaction(db, async (transaction) => {
                const coopDoc = await transaction.get(coopRef);
                if (!coopDoc.exists()) throw new Error("Cooperative not found");

                const userDoc = await transaction.get(userRef);
                if (userDoc.exists() && userDoc.data().cooperativeId) {
                    throw new Error("User already in a cooperative");
                }

                transaction.update(coopRef, {
                    members: arrayUnion(farmerId)
                });
                transaction.update(userRef, {
                    cooperativeId: coopId
                });
            });
            return true;
        } catch (error) {
            console.error("Error joining cooperative:", error);
            throw error;
        }
    },

    // 3. Get Cooperative Details (including members)
    async getCoopDetails(coopId) {
        if (!coopId) return null;
        const coopDoc = await getDoc(doc(db, COOPERATIVES, coopId));
        if (!coopDoc.exists()) return null;
        return { id: coopDoc.id, ...coopDoc.data() };
    },

    // 4. Get Pooled Inventory (Aggregated Stock)
    async getPooledInventory(coopId) {
        try {
            const coopData = await this.getCoopDetails(coopId);
            if (!coopData) return [];

            const members = coopData.members || [];
            if (members.length === 0) return [];

            // Fetch products from all members
            // Note: In a real large-scale app, we wouldn't fetch ALL products. 
            // We would have a dedicated 'inventory' aggregation.
            let allProducts = [];
            for (const memberId of members) {
                const products = await MarketplaceService.getFarmerProducts(memberId);
                allProducts = [...allProducts, ...products];
            }

            // Aggregate by Category/Type
            // Logic: Group by Product Name/Category to show total availability
            const inventoryMap = {};

            allProducts.forEach(p => {
                if (p.status !== 'Active') return;
                const key = p.category; // Simple aggregation by Category for now
                if (!inventoryMap[key]) {
                    inventoryMap[key] = {
                        category: key,
                        totalQuantity: 0,
                        avgPrice: 0,
                        productCount: 0,
                        contributors: []
                    };
                }
                inventoryMap[key].totalQuantity += (p.quantity - (p.lockedQuantity || 0));
                inventoryMap[key].avgPrice += Number(p.price);
                inventoryMap[key].productCount++;
                if (!inventoryMap[key].contributors.includes(p.farmName)) {
                    inventoryMap[key].contributors.push(p.farmName);
                }
            });

            // Finalize averages
            return Object.values(inventoryMap).map(item => ({
                ...item,
                avgPrice: Math.round(item.avgPrice / item.productCount)
            }));

        } catch (error) {
            console.error("Error fetching pooled inventory:", error);
            return [];
        }
    },

    // 5. Intelligent Order Splitting Logic
    // Returns a plan: [ { farmerId, productId, quantity, price }, ... ]
    async findFulfillmentPlan(requiredCategory, requiredQty, coopId) {
        const coopData = await this.getCoopDetails(coopId);
        if (!coopData) return null;

        // 1. Fetch all potential products in this category from coop members
        let candidateProducts = [];
        for (const memberId of coopData.members) {
            const products = await MarketplaceService.getFarmerProducts(memberId);
            const matches = products.filter(p => p.category === requiredCategory && p.status === 'Active' && (p.quantity - (p.lockedQuantity || 0)) > 0);
            candidateProducts = [...candidateProducts, ...matches];
        }

        // 2. Sort by Price (Cheapest first) or Freshness strategy
        // Here we use Cheapest First strategy
        candidateProducts.sort((a, b) => Number(a.price) - Number(b.price));

        // 3. Allocate
        let remainingQty = requiredQty;
        const plan = [];

        for (const product of candidateProducts) {
            if (remainingQty <= 0) break;

            const available = product.quantity - (product.lockedQuantity || 0);
            const take = Math.min(available, remainingQty);

            plan.push({
                productId: product.id,
                farmerId: product.farmerId,
                farmName: product.farmName,
                price: product.price,
                quantity: take,
                total: take * product.price
            });

            remainingQty -= take;
        }


        if (remainingQty > 0) {
            return { possible: false, filled: requiredQty - remainingQty, plan }; // Not enough stock in entire coop
        }

        return { possible: true, plan };
    },

    // 6. Search Farmers for Partnership
    async searchFarmers(queryStr) {
        try {
            // Simple search by location or name (Client-side filtering for MVP due to Firestore limits)
            const q = query(collection(db, USERS), where('role', '==', 'farmer'));
            const snapshot = await getDocs(q);
            const allFarmers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (!queryStr) return allFarmers.slice(0, 5); // Return random 5 if no query

            const lowerQ = queryStr.toLowerCase();
            return allFarmers.filter(f =>
                (f.displayName && f.displayName.toLowerCase().includes(lowerQ)) ||
                (f.address && f.address.toLowerCase().includes(lowerQ))
            );
        } catch (error) {
            console.error("Error searching farmers:", error);
            return [];
        }
    }
};
