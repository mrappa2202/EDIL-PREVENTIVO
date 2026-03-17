import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { useAuthStore } from "./store/authStore";
import { useThemeStore } from "./store/themeStore";

// Layouts
import { MainLayout } from "./components/layout/MainLayout";

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ClientsPage from "./pages/ClientsPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import QuotesPage from "./pages/QuotesPage";
import QuoteBuilderPage from "./pages/QuoteBuilderPage";
import MaterialsPage from "./pages/MaterialsPage";
import ExpensesPage from "./pages/ExpensesPage";
import EmployeesPage from "./pages/EmployeesPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";

import "./App.css";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuthStore();
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
    const { isAuthenticated, user } = useAuthStore();
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    if (user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }
    
    return children;
};

function App() {
    const { initTheme } = useThemeStore();
    
    useEffect(() => {
        initTheme();
    }, [initTheme]);

    return (
        <BrowserRouter>
            <Toaster position="top-right" richColors />
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                
                <Route path="/" element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<DashboardPage />} />
                    <Route path="clienti" element={<ClientsPage />} />
                    <Route path="clienti/:id" element={<ClientDetailPage />} />
                    <Route path="preventivi" element={<QuotesPage />} />
                    <Route path="preventivi/nuovo" element={<QuoteBuilderPage />} />
                    <Route path="preventivi/:id" element={<QuoteBuilderPage />} />
                    <Route path="materiali" element={<MaterialsPage />} />
                    <Route path="spese" element={<ExpensesPage />} />
                    <Route path="dipendenti" element={<EmployeesPage />} />
                    <Route path="impostazioni" element={<SettingsPage />} />
                    <Route path="utenti" element={
                        <AdminRoute>
                            <UsersPage />
                        </AdminRoute>
                    } />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
