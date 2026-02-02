import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CreateVault from "./pages/CreateVault";
import VaultSelector from "./pages/VaultSelector";
import VaultDashboard from "./pages/VaultDashboard";
import { VaultProvider } from "./context/VaultContext";
import AuthPage from "./pages/AuthPage";
import AirVaultHomepage from "./pages/AirVaultHomePage";
import { ThemeProvider } from './context/ThemeContext';
import MainDashboard from "./pages/MainDashboard";
import LoadingScreen from "./components/LoadingScreen";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <VaultProvider>
          <Routes>
            <Route path="/" element={<AirVaultHomepage />} />

            <Route 
              path="/auth" 
              element={<AuthPage />} 
            />

            <Route path="/maindashboard" element={<ProtectedRoute><MainDashboard /></ProtectedRoute>} />

            <Route 
              path="/createvaults" 
              element={
                <ProtectedRoute>
                  <CreateVault />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/vaults" 
              element={
                <ProtectedRoute>
                  <VaultSelector />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/vault/dashboard" 
              element={
                <ProtectedRoute>
                  <VaultDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/vault/:vaultId" 
              element={
                <ProtectedRoute>
                  <VaultDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="*" 
              element={<Navigate to="/" replace />} 
            />
          </Routes>
        </VaultProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;