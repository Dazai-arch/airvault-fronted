// ====================================
// VAULT API SERVICE
// ====================================

// Get base URL - should include /api
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    console.warn('⚠️ No authentication token found');
    console.log('💡 Redirecting to login page...');
    window.location.href = '/login';
    return null;
  }
  return token;
};

// Helper function to clear auth data and redirect to login
const handleAuthError = (errorMessage = 'Session expired. Please login again.') => {
  console.error('🔒 Authentication Error:', errorMessage);
  
  // Clear all auth data
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Redirect to login page
  window.location.href = '/login';
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  // Handle authentication errors (401 Unauthorized, 403 Forbidden)
  if (response.status === 401 || response.status === 403) {
    const data = await response.json().catch(() => ({ message: 'Authentication failed' }));
    
    console.error('🔒 Authentication failed - Token expired or invalid');
    console.log('Status:', response.status);
    console.log('Message:', data.message);
    
    // Clear auth and redirect to login
    handleAuthError(data.message);
    
    // Throw error to stop further execution
    throw new Error(data.message || 'Session expired');
  }
  
  const data = await response.json();
  
  if (!response.ok) {
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
      const token = getAuthToken();
      if (!token) return; // Will redirect to login
      
      const response = await fetch(`${API_BASE_URL}/vaults`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/vaults/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}/stats`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/user/audit-logs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  // Validate token (optional - for manual checks)
  // Validate token (optional - for manual checks)
validateToken: async () => {
  try {
    const token = getAuthToken();
    if (!token) return null; // Return null instead of false
    
    const response = await fetch(`${API_BASE_URL}/validate-token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
    
    if (response.status === 401 || response.status === 403) {
      handleAuthError('Token validation failed');
      return null;
    }
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data; // Return the full response with user data
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
},

  // Manual logout function
  logout: () => {
    handleAuthError('Logging out...');
  }
};

export default vaultApi;