export const validateToken = async () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token) {
    return false;
  }

  try {
    const API_URL = import.meta.env.VITE_API_URL || 
      (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");
    
    const response = await fetch(`${API_URL}/auth/validate-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      // Token is invalid or expired
      logout();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    logout();
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};