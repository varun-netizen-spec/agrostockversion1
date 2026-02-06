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
            // 2. Time Analysis (Hourly)
            const timeStats = Array(24).fill(0);

            // 3. Daily Trends (Last 30 Days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const dailySales = {}; // Format: "YYYY-MM-DD": count

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
                    const orderDate = new Date(order.timestamp);

                    // Hourly
                    const hour = orderDate.getHours();
                    timeStats[hour] += 1;

                    // Daily (Only if within last 30 days)
                    if (orderDate >= thirtyDaysAgo) {
                        const dateKey = orderDate.toISOString().split('T')[0];
                        dailySales[dateKey] = (dailySales[dateKey] || 0) + Number(order.quantity || 1);
                    }
                }
            });

            // 4. Delivery Analytics
            const deliveredOrders = orders.filter(o => o.status === 'Delivered' && o.deliveryStartedAt && o.deliveredAt);
            let totalDeliveryTime = 0;
            let onTimeCount = 0;

            deliveredOrders.forEach(o => {
                const start = new Date(o.deliveryStartedAt).getTime();
                const end = new Date(o.deliveredAt).getTime();
                const durationMins = (end - start) / 60000;
                totalDeliveryTime += durationMins;

                if (o.estimatedDeliveryTime) {
                    const eta = new Date(o.estimatedDeliveryTime).getTime();
                    if (end <= eta) onTimeCount++;
                }
            });

            const avgDeliveryTime = deliveredOrders.length > 0 ? Math.round(totalDeliveryTime / deliveredOrders.length) : 0;
            const onTimeRate = deliveredOrders.length > 0 ? Math.round((onTimeCount / deliveredOrders.length) * 100) : 0;

            // Fill missing dates for smooth time-series
            const trendData = [];
            for (let i = 0; i < 30; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateKey = d.toISOString().split('T')[0];
                trendData.unshift({
                    date: dateKey,
                    sales: dailySales[dateKey] || 0
                });
            }

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
                hourlyDistribution: timeStats,
                dailyTrend: trendData,
                avgDeliveryTime, // New Metric
                onTimeRate       // New Metric
            };


        } catch (error) {
            console.error("Sales Analytics Error:", error);
            return { error: true };
        }
    }
};
