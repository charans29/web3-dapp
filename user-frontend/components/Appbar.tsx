"use client"
import { BACKEND_URL } from '@/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import axios from 'axios';
import { useEffect } from 'react';

function Appbar() {
  const { publicKey, signMessage }= useWallet();

  async function signToAuth() {
    if (!publicKey) {
            return;
        }      
    const message = new TextEncoder().encode("Sign to Auth mechanical Tasks");
    const sign = await signMessage?.(message);
    const res = await axios.post(`${BACKEND_URL}/v1/user/signin`, {
      sign,
      publicKey: publicKey?.toString()
    })
    localStorage.setItem("token", res.data.token)
  }

  useEffect(() => {
    signToAuth()
  }, [publicKey]);

  return (
    <div className="border-blue-700 border-b flex justify-between items-center h-14 px-5 bg-slate-900">
      <div className="font-thin pl-4">
        Taskify
      </div>
      <div className="flex pb-2 pt-2 pr-4">
        { publicKey ? <WalletDisconnectButton /> : <WalletMultiButton /> }
      </div>
    </div>
  );
}

export default Appbar;