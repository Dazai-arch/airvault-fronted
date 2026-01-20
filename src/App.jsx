import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CreateVault from "./pages/CreateVault";
import VaultSelector from "./pages/VaultSelector";
import VaultDashboard from "./pages/VaultDashboard";
import { VaultProvider } from "./context/VaultContext";
import AuthPage from "./pages/AuthPage";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  // Check BOTH localStorage AND sessionStorage for token
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AuthRedirect = () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  return token ? <Navigate to="/createvaults" replace /> : <AuthPage />;
};


function App() {
  return (
    <BrowserRouter>
      <VaultProvider>
        <Routes>
          {/* Public route - no wrapper needed, AuthPage handles its own navigation */}
          <Route path="/" element={<AuthRedirect />} />

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
  );
}

export default App;
