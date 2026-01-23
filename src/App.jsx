import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import FarmProfile from './pages/FarmProfile';
import CattleList from './pages/CattleList';
import FeedOptimizer from './pages/FeedOptimizer';
import HealthRecords from './pages/HealthRecords';

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
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
                    <Route path="/farm-profile" element={<ProtectedLayout><FarmProfile /></ProtectedLayout>} />
                    <Route path="/cattle" element={<ProtectedLayout><CattleList /></ProtectedLayout>} />
                    <Route path="/health" element={<ProtectedLayout><HealthRecords /></ProtectedLayout>} />
                    <Route path="/feed" element={<ProtectedLayout><FeedOptimizer /></ProtectedLayout>} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
