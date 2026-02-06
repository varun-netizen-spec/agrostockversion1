import { collection, query, where, getDocs, doc, updateDoc, getDoc, arrayUnion, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const HEALTH_RECORDS = 'health_records'; // Assuming this collection stores the scan results/cases

export const VetCaseService = {

    // 1. Get Cases Assigned to Vet
    async getAssignedCases(vetId) {
        try {
            // In a real app, we might filter by 'status' != 'Resolved' to only show active
            const q = query(
                collection(db, HEALTH_RECORDS),
                where('vetAssignedId', '==', vetId),
                orderBy('timestamp', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching vet cases:", error);
            // Fallback if index missing or other error
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
        // This checks all records for a farm to compute a "Health Score"
        // Mock logic for now as it requires complex aggregation
        return {
            herdHealthScore: 85,
            activeCases: 3,
            riskTrend: 'Stable'
        };
    }
};
