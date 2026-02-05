import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    async function signup(email, password, role = 'farmer') {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const user = res.user;

        // Initialize user doc in Firestore
        const userData = {
            uid: user.uid,
            email: user.email,
            role: role,
            createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'users', user.uid), userData);
        setUserData(userData);
        return res;
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    async function updateUserRole(newRole) {
        if (!currentUser) return;
        const roleLower = newRole.toLowerCase();
        await setDoc(doc(db, 'users', currentUser.uid), { role: roleLower }, { merge: true });
        setUserData(prev => ({ ...prev, role: roleLower }));
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
            } else {
                setUserData(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userData,
        signup,
        login,
        logout,
        updateUserRole
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
