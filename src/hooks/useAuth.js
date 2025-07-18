import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/config/authConfig";
import { useState, useEffect } from "react";

export const useAuth = () => {
  const { instance, accounts } = useMsal();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (accounts.length > 0) {
      setUser(accounts[0]);
    }
    setIsLoading(false);
  }, [accounts]);

  const login = async () => {
    try {
      const response = await instance.loginPopup(loginRequest);
      setUser(response.account);
      return response;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    instance.logoutPopup({
      postLogoutRedirectUri: "/",
      mainWindowRedirectUri: "/"
    });
  };

  const isAuthenticated = accounts.length > 0;

  return {
    user,
    isAuthenticated,
    login,
    logout,
    isLoading
  };
};