"use client"

import { Inter } from "next/font/google";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useMemo } from "react";
import { AuthProvider } from "@/contexts/AuthContext";

require('@solana/wallet-adapter-react-ui/styles.css');

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

    const network = WalletAdapterNetwork.Devnet;
   
    const endpoint = "YOUR_RPC_API_KEY"

    const wallets = useMemo(
        () => [],
        [network]
    );

  return (
    <AuthProvider>
        <ConnectionProvider endpoint={endpoint}>
              <WalletProvider wallets={wallets} autoConnect>
                  <WalletModalProvider>
                      {children}
                  </WalletModalProvider>
              </WalletProvider>
          </ConnectionProvider>  
    </AuthProvider>
  );
}