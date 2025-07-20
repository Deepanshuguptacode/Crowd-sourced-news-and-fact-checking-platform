import { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { apiUtils } from "../services/api";

const UserContext = createContext();

const UserProvider = ({ children = "" }) => {
  const [userType, setUserType] = useState(""); 
  const [userInfo, setUserInfo] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize user state from localStorage on app start
  useEffect(() => {
    const initializeUser = () => {
      const token = apiUtils.getAuthToken();
      const savedUserInfo = apiUtils.getUserInfo();
      const savedUserType = apiUtils.getUserType();

      if (token && savedUserInfo && savedUserType) {
        setUserType(savedUserType);
        setUserInfo(savedUserInfo);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    initializeUser();
  }, []);

  // Login function
  const login = (userData, token) => {
    // Handle guest login differently
    if (userData.userType === 'guest') {
      setUserType('guest');
      setUserInfo({ 
        name: 'Guest User',
        email: 'guest@example.com',
        userType: 'guest'
      });
      setIsAuthenticated(true);
      // Don't store guest session in localStorage
      return;
    }
    
    apiUtils.setAuthToken(token);
    apiUtils.setUserInfo(userData);
    setUserType(userData.userType);
    setUserInfo(userData);
    setIsAuthenticated(true);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userType');
    setUserType("");
    setUserInfo(null);
    setIsAuthenticated(false);
  };

  // Update user info
  const updateUserInfo = (newUserInfo) => {
    const updatedInfo = { ...userInfo, ...newUserInfo };
    setUserInfo(updatedInfo);
    apiUtils.setUserInfo(updatedInfo);
  };

  const contextValue = {
    userType,
    setUserType,
    userInfo,
    setUserInfo: updateUserInfo,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUserInfo, // Add this for direct access
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { UserContext, UserProvider };