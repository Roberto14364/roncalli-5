
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SostituzioniPage } from './pages/SostituzioniPage';
import { DocentiPage } from './pages/DocentiPage';
import { PermessiPage } from './pages/PermessiPage';
import { SostituzioniGiornalierePage } from './pages/SostituzioniGiornalierePage';
import { NotFound } from './pages/NotFound';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';

// Componente per le rotte protette
const ProtectedRoute = ({ children, onlyAdmin = false }: { children: React.ReactNode, onlyAdmin?: boolean }) => {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (onlyAdmin && currentUser?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <SostituzioniPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/docenti" element={
        <ProtectedRoute onlyAdmin>
          <Layout>
            <DocentiPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/permessi" element={
        <ProtectedRoute>
          <Layout>
            <PermessiPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/sostituzioni-giornaliere" element={
        <ProtectedRoute>
          <Layout>
            <SostituzioniGiornalierePage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;

