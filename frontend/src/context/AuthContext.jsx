import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/client";

// AuthContext holds the currently logged-in user so any page/component
// can ask "who is logged in?" without passing props down manually
// through every level — this is called "prop drilling," and Context
// is React's built-in way to avoid it.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // On first load, if a token exists in localStorage, ask the backend
  // "who does this token belong to?" via /me — this keeps the user
  // logged in even after refreshing the page.
  useEffect(() => {
    const savedToken = localStorage.getItem("gymAuthToken");

    if (!savedToken) {
      setIsCheckingSession(false);
      return;
    }

    apiClient
      .get("/me")
      .then((response) => setCurrentUser(response.data))
      .catch(() => localStorage.removeItem("gymAuthToken"))
      .finally(() => setIsCheckingSession(false));
  }, []);

  function loginWithToken(token, user) {
    localStorage.setItem("gymAuthToken", token);
    setCurrentUser(user);
  }

  function logout() {
    localStorage.removeItem("gymAuthToken");
    setCurrentUser(null);
  }

  const authContextValue = {
    currentUser,
    isCheckingSession,
    loginWithToken,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// A small custom hook so components can write `useAuth()` instead of
// `useContext(AuthContext)` everywhere — cleaner and easier to read.
export function useAuth() {
  return useContext(AuthContext);
}