// ====================================
// VAULT API SERVICE
// ====================================

// Get base URL - should include /api
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    console.warn('⚠️ No authentication token found in localStorage');
    console.log('💡 Please log in to access this feature');
  }
  return token;
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // Special handling for 403 Forbidden
    if (response.status === 403) {
      console.error('🔒 Access Forbidden - Token issue detected');
      console.log('Current token:', localStorage.getItem('token')?.substring(0, 20) + '...');
      console.log('💡 Try logging out and logging back in');
      
      // Optionally redirect to login
      // window.location.href = '/login';
    }
    
    throw new Error(data.message || 'Something went wrong');
  }
  
  return data;
};

// ====================================
// VAULT API FUNCTIONS
// ====================================

export const vaultApi = {
  // Fetch all vaults for the authenticated user
  getAllVaults: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vaults`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        credentials: 'include',
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching vaults:', error);
      throw error;
    }
  },

  // Fetch a single vault by ID
  getVaultById: async (vaultId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        credentials: 'include',
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching vault:', error);
      throw error;
    }
  },

  // Create a new vault
  createVault: async (vaultData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vaults/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify(vaultData),
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Error creating vault:', error);
      throw error;
    }
  },

  // Verify vault password
  verifyVaultPassword: async (vaultId, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Error verifying vault password:', error);
      throw error;
    }
  },

  // Update vault
  updateVault: async (vaultId, updateData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Error updating vault:', error);
      throw error;
    }
  },

  // Delete vault
  deleteVault: async (vaultId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        credentials: 'include',
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Error deleting vault:', error);
      throw error;
    }
  },

  // Update vault stats (file count and total size)
  updateVaultStats: async (vaultId, stats) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}/stats`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify(stats),
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Error updating vault stats:', error);
      throw error;
    }
  },

  // Get user profile
  getUserProfile: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        credentials: 'include',
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Get audit logs
  getAuditLogs: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/audit-logs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        credentials: 'include',
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },
};

export default vaultApi;