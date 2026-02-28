import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import FarmProfile from './pages/FarmProfile';
import CattleList from './pages/CattleList';
import HealthRecords from './pages/HealthRecords';
import Marketplace from './pages/Marketplace';
import ProductManagement from './pages/ProductManagement';
import Orders from './pages/Orders';
import CattleHealthScanner from './pages/CattleHealthScanner';
import Payment from './pages/Payment';
import VetDashboard from './pages/VetDashboard';
import BuyerProfile from './pages/BuyerProfile';
import DoctorProfile from './pages/DoctorProfile';


// Protected Layout Component
function ProtectedLayout({ children }) {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
                    <Route path="/farm-profile" element={<ProtectedLayout><FarmProfile /></ProtectedLayout>} />
                    <Route path="/cattle" element={<ProtectedLayout><CattleList /></ProtectedLayout>} />
                    <Route path="/health" element={<ProtectedLayout><HealthRecords /></ProtectedLayout>} />
                    <Route path="/marketplace" element={<ProtectedLayout><Marketplace /></ProtectedLayout>} />
                    <Route path="/inventory" element={<ProtectedLayout><ProductManagement /></ProtectedLayout>} />
                    <Route path="/orders" element={<ProtectedLayout><Orders /></ProtectedLayout>} />
                    <Route path="/payment" element={<ProtectedLayout><Payment /></ProtectedLayout>} />
                    <Route path="/scan" element={<ProtectedLayout><CattleHealthScanner /></ProtectedLayout>} />
                    <Route path="/vet-portal" element={<ProtectedLayout><VetDashboard /></ProtectedLayout>} />
                    <Route path="/doctor-profile" element={<ProtectedLayout><DoctorProfile /></ProtectedLayout>} />

                    {/* Buyer Routes */}
                    <Route path="/buyer-profile" element={<ProtectedLayout><BuyerProfile /></ProtectedLayout>} />


                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
