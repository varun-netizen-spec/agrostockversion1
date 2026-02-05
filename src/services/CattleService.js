import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const CATTLE_COLLECTION = 'cattle';
const HEALTH_COLLECTION = 'health_records';
const SCANS_COLLECTION = 'health_scans';

export const CattleService = {
    // Cattle Profiles
    async getAllCattle(ownerId = null) {
        let q;
        if (ownerId) {
            q = query(collection(db, CATTLE_COLLECTION), where('ownerId', '==', ownerId));
        } else {
            q = query(collection(db, CATTLE_COLLECTION));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addCattle(cattleData) {
        const docRef = await addDoc(collection(db, CATTLE_COLLECTION), {
            ...cattleData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        return docRef.id;
    },

    async updateCattle(id, cattleData) {
        const docRef = doc(db, CATTLE_COLLECTION, id);
        await updateDoc(docRef, {
            ...cattleData,
            updatedAt: new Date().toISOString()
        });
    },

    // Health Records
    async getHealthRecords(cattleId) {
        const q = query(
            collection(db, HEALTH_COLLECTION),
            where('cattleId', '==', cattleId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    async addHealthRecord(recordData) {
        const docRef = await addDoc(collection(db, HEALTH_COLLECTION), {
            ...recordData,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    },

    // Breeding Records (can be stored in a separate collection or within cattle doc)
    // For simplicity and scalability, let's use a separate collection
    async getBreedingRecords(cattleId) {
        const q = query(
            collection(db, 'breeding_records'),
            where('cattleId', '==', cattleId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    // Health Scan Reports
    async saveScanReport(reportData) {
        const docRef = await addDoc(collection(db, SCANS_COLLECTION), {
            ...reportData,
            timestamp: new Date().toISOString()
        });

        // Also add a summary to health_records for the timeline
        await addDoc(collection(db, HEALTH_COLLECTION), {
            cattleId: reportData.cattleId,
            type: 'AI Scan',
            title: `Health Scan: ${reportData.condition}`,
            description: `AI Health Score: ${reportData.healthScore}. Detected: ${reportData.predictions.map(p => p.class).join(', ')}`,
            date: new Date().toISOString().split('T')[0],
            status: reportData.condition === 'Healthy' ? 'Completed' : 'Follow-up Required',
            scanId: docRef.id
        });

        return docRef.id;
    },

    async getScanHistory(cattleId) {
        const q = query(
            collection(db, SCANS_COLLECTION),
            where('cattleId', '==', cattleId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    async addVetNote(reportId, noteData) {
        const docRef = doc(db, SCANS_COLLECTION, reportId);
        await updateDoc(docRef, {
            vetNotes: noteData,
            updatedAt: new Date().toISOString()
        });
    },

    async getPredictiveAnalysis(cattleId) {
        const history = await this.getScanHistory(cattleId);
        if (history.length < 1) return null;

        const latest = history[0];
        const scores = history.map(h => h.healthScore);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        // Mock Predictive Logic
        let riskWindow = "Stable (Next 30 days)";
        let prediction = "Overall health looks good. Maintain standard care.";
        let riskLevel = "Low";

        if (latest.healthScore < 70 || (scores.length > 1 && scores[0] < scores[1])) {
            riskWindow = "Critical (Next 10-15 days)";
            prediction = "High chance of fever or infection based on declining health score trend.";
            riskLevel = "High";
        } else if (latest.healthScore < 90) {
            riskWindow = "Warning (Next 20 days)";
            prediction = "Moderate risk of minor illness. Increase monitoring frequency.";
            riskLevel = "Medium";
        }

        return {
            riskWindow,
            prediction,
            riskLevel,
            trend: (scores.length > 1 && scores[0] >= scores[1]) ? 'Improving' : 'Declining',
            lastScan: latest.timestamp
        };
    },

    // 🔹 Vet Collaboration Functions
    async getAllVets() {
        const q = query(collection(db, 'users'), where('role', '==', 'vet'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    },

    async shareReport(reportId, farmerId, vetId) {
        // Update the scan report to mark it as shared
        const reportRef = doc(db, SCANS_COLLECTION, reportId);
        await updateDoc(reportRef, {
            sharedWith: vetId,
            sharingStatus: 'Pending Review',
            sharedAt: new Date().toISOString()
        });

        // Also create a separate sharing record for easier querying by vets
        await addDoc(collection(db, 'shared_reports'), {
            reportId,
            farmerId,
            vetId,
            status: 'Pending Review',
            timestamp: new Date().toISOString()
        });
    },

    async getSharedReportsForVet(vetId) {
        // Query shared_reports without orderBy to avoid index requirement
        const q = query(
            collection(db, 'shared_reports'),
            where('vetId', '==', vetId)
        );
        const snapshot = await getDocs(q);
        // Sort client-side
        const sharingRecords = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // For each sharing record, fetch the actual report data
        const detailedReports = await Promise.all(sharingRecords.map(async (record) => {
            const reportDoc = await getDocs(query(collection(db, SCANS_COLLECTION), where('__name__', '==', record.reportId)));
            if (!reportDoc.empty) {
                const reportData = { id: reportDoc.docs[0].id, ...reportDoc.docs[0].data() };
                return { ...record, reportDetails: reportData };
            }
            return record;
        }));

        return detailedReports.filter(r => r.reportDetails);
    },

    async submitVetFeedback(reportId, sharedReportId, feedbackData) {
        // 1. Update the original report with vet notes
        const reportRef = doc(db, SCANS_COLLECTION, reportId);
        await updateDoc(reportRef, {
            vetNotes: {
                ...feedbackData,
                timestamp: new Date().toISOString()
            },
            sharingStatus: 'Reviewed'
        });

        // 2. Update the sharing record status
        const sharedRef = doc(db, 'shared_reports', sharedReportId);
        await updateDoc(sharedRef, {
            status: 'Reviewed',
            updatedAt: new Date().toISOString()
        });
    },

    // 🔹 Bio-Security & Market Safety
    async getFarmRiskLevel(ownerId) {
        try {
            // 1. Get all cattle
            const cattle = await this.getAllCattle(ownerId);
            if (cattle.length === 0) return 'Low';

            // 2. Check for contagious diseases in recent records
            // For MVP performance, we limit to checking last 20 animals or use a specialized query if optimized
            const recentCattle = cattle.slice(0, 20);

            let highRiskFound = false;
            let mediumRiskFound = false;

            const highRiskDiseases = ['Lumpy Skin', 'Foot & Mouth', 'Anthrax', 'Brucellosis'];
            const mediumRiskDiseases = ['Mastitis', 'Fever', 'Unknown Infection'];

            for (const cow of recentCattle) {
                // Check recent scans (e.g., last 14 days)
                const scans = await this.getScanHistory(cow.id);
                const recentScans = scans.filter(s => {
                    const diffTime = Math.abs(new Date() - new Date(s.timestamp));
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 14;
                });

                for (const scan of recentScans) {
                    if (scan.predictions?.some(p => highRiskDiseases.includes(p.class))) {
                        highRiskFound = true;
                        break;
                    }
                    if (scan.predictions?.some(p => mediumRiskDiseases.includes(p.class) || scan.healthScore < 50)) {
                        mediumRiskFound = true;
                    }
                }
                if (highRiskFound) break; // Exit early if critical
            }

            if (highRiskFound) return 'High';
            if (mediumRiskFound) return 'Medium';
            return 'Low';
        } catch (error) {
            console.error("Risk Assessment Error:", error);
            return 'Low'; // Default to allow trade but log error
        }
    }
};
