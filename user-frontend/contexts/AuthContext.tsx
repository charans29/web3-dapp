import React, { createContext, useContext, useState } from 'react';

interface AuthContextProps {
    isSignedIn: boolean;
    setSignedIn: (signedIn: boolean) => void;
  }

export const AuthContext = createContext<AuthContextProps>({
  isSignedIn: false,
  setSignedIn: () => {},
});

interface AuthProviderProps {
    children: React.ReactNode;
  }

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isSignedIn, setSignedIn] = useState<boolean>(false);
  
    return (
      <AuthContext.Provider value={{ isSignedIn, setSignedIn }}>
        {children}
      </AuthContext.Provider>
    );
  }

export const useAuth = () => useContext(AuthContext);