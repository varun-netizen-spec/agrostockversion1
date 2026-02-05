import { db } from '../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const SalesAnalyticsService = {
    async getAggregatedSalesData(farmerId) {
        try {
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, where('farmerId', '==', farmerId));
            const snapshot = await getDocs(q);

            const orders = snapshot.docs.map(doc => doc.data());

            // 1. Product Performance
            const productStats = {};
            // 2. Time Analysis
            const timeStats = Array(24).fill(0);

            orders.forEach(order => {
                // Product Stats
                const pName = order.name || 'Unknown Product';
                if (!productStats[pName]) {
                    productStats[pName] = { quantity: 0, revenue: 0 };
                }
                productStats[pName].quantity += Number(order.quantity || 0);
                productStats[pName].revenue += Number(order.total || 0);

                // Time Stats (Peak Hours)
                if (order.timestamp) {
                    const hour = new Date(order.timestamp).getHours();
                    timeStats[hour] += 1;
                }
            });

            // Convert product stats to array
            const topProducts = Object.entries(productStats)
                .map(([name, stat]) => ({ name, ...stat }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5); // Top 5

            // Find peak hours
            const peakHourIndex = timeStats.indexOf(Math.max(...timeStats));
            const peakTimeLabel = `${peakHourIndex}:00 - ${peakHourIndex + 1}:00`;

            return {
                totalOrders: orders.length,
                topProducts,
                peakSalesTime: peakTimeLabel,
                hourlyDistribution: timeStats
            };
        } catch (error) {
            console.error("Sales Analytics Error:", error);
            return { error: true };
        }
    }
};
