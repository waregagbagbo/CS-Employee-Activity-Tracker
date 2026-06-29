import React, { createContext, useState, useEffect } from "react";
import { loginUser as apiLogin, logoutUser as apiLogout } from "../services/auth"; // Adjust path to your auth.js file

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  // Checks localStorage automatically whenever the app boots or refreshes
  useEffect(() => {
    const savedType = localStorage.getItem("user_type");
    if (savedType) {
      setUserType(savedType);
    }
    setLoading(false);
  }, []);

  // Use this function in your Login Form component
  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    if (data.employee_profile && data.employee_profile.user_type) {
      setUserType(data.employee_profile.user_type);
    }
    return data;
  };

  // Use this function in your Logout button
  const logout = async () => {
    await apiLogout();
    setUserType(null);
  };

  return (
    <AuthContext.Provider value={{ userType, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
