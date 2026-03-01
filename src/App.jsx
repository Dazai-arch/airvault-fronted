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
import AccessLog from "./pages/AccessLog";
import FileUpload from "./pages/FileUpload";
import Permissions from "./pages/Permissions";
import FileSharing from "./pages/FileSharing";  
import UserProfile from "./pages/UserProfile";
import Details from "./pages/Details";
import FileView from "./pages/FileView";
import FolderView from "./pages/FolderView";
// ✅ NEW: Vault join page (for link/QR/vault ID sharing)
import VaultJoinPage from "./pages/VaultJoinPage";

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
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Token validation error:', error);
        // On network error, assume valid to avoid blocking user
        setIsAuthenticated(true);
      } finally {
        setIsValidating(false);
      }
    };

    validateAuth();
  }, []);

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
            <Route path="/airdrop" element={<AirDrop />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* ✅ Public vault join route — no auth required, handles it internally */}
            <Route path="/vault/join/:vaultId" element={<VaultJoinPage />} />

            <Route 
              path="/maindashboard" 
              element={<ProtectedRoute><MainDashboard /></ProtectedRoute>} 
            />

            <Route 
              path="/createvaults" 
              element={<ProtectedRoute><CreateVault /></ProtectedRoute>} 
            />
            
            <Route 
              path="/vaults" 
              element={<ProtectedRoute><VaultSelector /></ProtectedRoute>} 
            />
            
            <Route 
              path="/vault/dashboard" 
              element={<ProtectedRoute><VaultDashboard /></ProtectedRoute>} 
            />

            <Route 
              path="/vault/accesslog" 
              element={<ProtectedRoute><AccessLog /></ProtectedRoute>} 
            />

            <Route 
              path="/vault/fileupload" 
              element={<ProtectedRoute><FileUpload /></ProtectedRoute>} 
            />

            <Route 
              path="/vault/permissions" 
              element={<ProtectedRoute><Permissions /></ProtectedRoute>} 
            />

            <Route 
              path="/vault/filesharing" 
              element={<ProtectedRoute><FileSharing /></ProtectedRoute>} 
            />

            <Route 
              path="/vault/userprofile" 
              element={<ProtectedRoute><UserProfile /></ProtectedRoute>} 
            />

            <Route 
              path="/vault/details" 
              element={<ProtectedRoute><Details /></ProtectedRoute>} 
            />

            <Route 
              path="/vault/file/:fileId" 
              element={<ProtectedRoute><FileView /></ProtectedRoute>} 
            />

            <Route 
              path="/vault/folder/:folderId" 
              element={<ProtectedRoute><FolderView /></ProtectedRoute>} 
            />

            <Route 
              path="/vault/file" 
              element={<ProtectedRoute><FileView /></ProtectedRoute>} 
            />

            <Route 
              path="/vault/folder" 
              element={<ProtectedRoute><FolderView /></ProtectedRoute>} 
            />
            
            <Route 
              path="/vault/:vaultId" 
              element={<ProtectedRoute><VaultDashboard /></ProtectedRoute>} 
            />

            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </VaultProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;