import { createContext, useContext, useState, useEffect } from "react";

const VaultContext = createContext();

const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

export const VaultProvider = ({ children }) => {
  const [activeVault, setActiveVault] = useState(null);
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all vaults on mount
  const fetchVaults = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      if (!token) {
        setVaults([]);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/vaults`, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        credentials: "include"
      });

      const data = await response.json();
      
      if (response.ok) {
        setVaults(data.vaults || []);
      } else {
        console.error("Failed to fetch vaults:", data.message);
        setError(data.message);
        setVaults([]);
      }
    } catch (err) {
      console.error("Error fetching vaults:", err);
      setError("Network error. Please try again.");
      setVaults([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch vaults on mount
  useEffect(() => {
    fetchVaults();
  }, []);

  // Refresh vaults function
  const refreshVaults = () => {
    fetchVaults();
  };

  // Add a new vault to the list
  const addVault = (vault) => {
    setVaults(prev => [...prev, vault]);
  };

  // Update a vault in the list
  const updateVault = (vaultId, updates) => {
    setVaults(prev => 
      prev.map(vault => 
        vault.id === vaultId ? { ...vault, ...updates } : vault
      )
    );
  };

  // Remove a vault from the list
  const removeVault = (vaultId) => {
    setVaults(prev => prev.filter(vault => vault.id !== vaultId));
    if (activeVault?.id === vaultId) {
      setActiveVault(null);
    }
  };

  return (
    <VaultContext.Provider 
      value={{ 
        activeVault, 
        setActiveVault,
        vaults,
        setVaults,
        loading,
        error,
        fetchVaults,
        refreshVaults,
        addVault,
        updateVault,
        removeVault
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
};