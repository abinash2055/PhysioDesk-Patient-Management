"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("physiodesk_token");

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/api/auth/me")
      .then((response) => {
        setUser(response.data);
      })
      .catch(() => {
        localStorage.removeItem("physiodesk_token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function login(email, password) {
    const response = await api.post("/api/auth/login", {
      email,
      password,
    });

    const token = response.data.access_token;

    localStorage.setItem(
      "physiodesk_token",
      token
    );

    const meResponse = await api.get(
      "/api/auth/me"
    );

    setUser(meResponse.data);

    return meResponse.data;
  }

  function logout() {
    localStorage.removeItem("physiodesk_token");
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}