import { collection, query, where, getDocs, doc, updateDoc, getDoc, arrayUnion, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const HEALTH_RECORDS = 'health_records';

export const VetCaseService = {

    // 1. Get Cases Assigned to Vet
    async getAssignedCases(vetId) {
        try {
            // Try with ordering (Requires composite index)
            const q = query(
                collection(db, HEALTH_RECORDS),
                where('vetAssignedId', '==', vetId),
                orderBy('timestamp', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            // Fallback for missing index
            if (error.code === 'failed-precondition' || error.message.includes('index')) {
                console.warn("VetCaseService: Index missing, falling back to unordered results.");
                const fallbackQ = query(
                    collection(db, HEALTH_RECORDS),
                    where('vetAssignedId', '==', vetId),
                    limit(50)
                );
                const snapshot = await getDocs(fallbackQ);
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
            console.error("Error fetching vet cases:", error);
            return [];
        }
    },

    // 2. Update Case Status & Severity
    async updateCaseStatus(caseId, status, severity) {
        const ref = doc(db, HEALTH_RECORDS, caseId);
        await updateDoc(ref, {
            status,
            severity,
            lastUpdated: new Date().toISOString()
        });
    },

    // 3. Add Treatment/Clinical Note
    async addClinicalNote(caseId, noteObj) {
        // noteObj: { text, author, type: 'Treatment'|'Note'|'Diagnosis' }
        const ref = doc(db, HEALTH_RECORDS, caseId);
        await updateDoc(ref, {
            clinicalNotes: arrayUnion({
                ...noteObj,
                timestamp: new Date().toISOString()
            })
        });
    },

    // 4. Get Farm Aggregated Health Stats
    async getFarmHealthSummary(farmId) {
        // Mock logic for farm health score
        return {
            herdHealthScore: 85,
            activeCases: 3,
            riskTrend: 'Stable'
        };
    }
};
