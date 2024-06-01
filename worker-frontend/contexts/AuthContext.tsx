import React, { createContext, useContext, useState } from 'react';

interface AuthContextProps {
    isSignedIn: boolean;
    setSignedIn: (signedIn: boolean) => void;
    balance: number,
    setBalance: (balance: number) => void;
  }

export const AuthContext = createContext<AuthContextProps>({
  isSignedIn: false,
  setSignedIn: () => {},
  balance: 0,
  setBalance: () => {}
});

interface AuthProviderProps {
    children: React.ReactNode;
  }

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isSignedIn, setSignedIn] = useState<boolean>(false);
    const [balance, setBalance] = useState(0);
  
    return (
      <AuthContext.Provider value={{ isSignedIn, setSignedIn, balance, setBalance }}>
        {children}
      </AuthContext.Provider>
    );
  }

export const useAuth = () => useContext(AuthContext);