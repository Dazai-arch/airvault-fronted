import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import CreateVault from "./pages/CreateVault";
import VaultSelector from "./pages/VaultSelector";
import VaultDashboard from "./pages/VaultDashboard";
import { VaultProvider } from "./context/VaultContext";
import AuthPage from "./pages/AuthPage";
import AirVaultHomepage from "./pages/AirVaultHomePage";
import { ThemeProvider } from './context/ThemeContext';
import MainDashboard from "./pages/MainDashboard";
import LoadingScreen from "./components/LoadingScreen";
import AirDrop from "./pages/AirDrop"

// Enhanced Protected Route Component with Token Validation
const ProtectedRoute = ({ children }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateAuth = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
      if (!token) {
        setIsAuthenticated(false);
        setIsValidating(false);
        return;
      }

      // Optional: Validate token with backend
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_URL}/auth/validate-token`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Token is invalid or expired
          console.log('Token validation failed, clearing auth data');
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Token validation error:', error);
        // On network error, assume token is valid to prevent blocking user
        // The vaultApi will handle actual auth errors
        setIsAuthenticated(true);
      } finally {
        setIsValidating(false);
      }
    };

    validateAuth();
  }, []);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
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
            {/* <Route path="/" element={<AirDrop />} /> */}
            <Route 
              path="/auth" 
              element={<AuthPage />} 
            />

            <Route 
              path="/maindashboard" 
              element={
                <ProtectedRoute>
                  <MainDashboard />
                </ProtectedRoute>
              } 
            />

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