import { createContext, useContext, useState, useEffect } from "react";

const VaultContext = createContext();

const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

export const VaultProvider = ({ children }) => {
  const [activeVault, setActiveVault] = useState(null);
  const [vaults, setVaults] = useState([]);           // owned vaults
  const [sharedVaults, setSharedVaults] = useState([]); // vaults shared with me
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVaults = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        setVaults([]);
        setSharedVaults([]);
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch owned + shared in parallel
      const [ownedRes, sharedRes] = await Promise.all([
        fetch(`${API_URL}/vaults`,        { headers, credentials: "include" }),
        fetch(`${API_URL}/vaults/shared`, { headers, credentials: "include" }),
      ]);

      const ownedData  = await ownedRes.json();
      const sharedData = await sharedRes.json();

      if (ownedRes.ok)  setVaults(ownedData.vaults   || []);
      else { console.error("Failed to fetch owned vaults:", ownedData.message); setError(ownedData.message); setVaults([]); }

      if (sharedRes.ok) setSharedVaults(sharedData.vaults || []);
      else { console.warn("Failed to fetch shared vaults:", sharedData.message); setSharedVaults([]); }

    } catch (err) {
      console.error("Error fetching vaults:", err);
      setError("Network error. Please try again.");
      setVaults([]);
      setSharedVaults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVaults(); }, []);

  const refreshVaults = () => fetchVaults();

  const addVault = (vault) => setVaults(prev => [...prev, vault]);

  const updateVault = (vaultId, updates) => {
    setVaults(prev => prev.map(v => v.id === vaultId ? { ...v, ...updates } : v));
    setSharedVaults(prev => prev.map(v => v.id === vaultId ? { ...v, ...updates } : v));
  };

  const removeVault = (vaultId) => {
    setVaults(prev => prev.filter(v => v.id !== vaultId));
    setSharedVaults(prev => prev.filter(v => v.id !== vaultId));
    if (activeVault?.id === vaultId) setActiveVault(null);
  };

  // Called after owner PATCHes a member's role — updates the shared vault's
  // role badge instantly for the viewer without a full refetch.
  // vaultId: the vault being shared
  // memberId: the member whose role changed (may be the current user)
  // newRole: "viewer" | "editor"
  const updateMemberRole = (vaultId, memberId, newRole) => {
    // If the current user is the member whose role changed, update sharedVaults
    setSharedVaults(prev =>
      prev.map(v => v.id === vaultId ? { ...v, role: newRole } : v)
    );
  };

  // All vaults the user can access (owned + shared), de-duped by id
  const allVaults = [
    ...vaults,
    ...sharedVaults.filter(sv => !vaults.some(v => v.id === sv.id)),
  ];

  return (
    <VaultContext.Provider value={{
      activeVault,
      setActiveVault,
      vaults,          // owned only
      sharedVaults,    // shared with me only
      allVaults,       // owned + shared (for any component that needs both)
      setVaults,
      loading,
      error,
      fetchVaults,
      refreshVaults,
      addVault,
      updateVault,
      removeVault,
      updateMemberRole,
    }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) throw new Error("useVault must be used within a VaultProvider");
  return context;
};