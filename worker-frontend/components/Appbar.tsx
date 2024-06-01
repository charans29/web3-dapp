"use client"
import { BACKEND_URL } from '@/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

function Appbar() {
  const { publicKey, signMessage }= useWallet();
  const { setSignedIn, balance, setBalance } = useAuth();
  const [isPayoutProcessing, setIsPayoutProcessing] = useState(false);
  const [TO_SOL, setToSol] = useState(Number);



  async function signToAuth() {
    if (!publicKey) {
            return;
        }      
    const message = new TextEncoder().encode("Sign to Auth for work on mechanical Tasks");
    const sign = await signMessage?.(message);
    const res = await axios.post(`${BACKEND_URL}/v1/worker/signin`, {
      sign,
      publicKey: publicKey?.toString()
    })
    localStorage.setItem("token", res.data.token);
    setSignedIn(true);
    setBalance(res.data.amount)
  }

  useEffect(() => {
    signToAuth()
  }, [publicKey]);

  return (
    <div>
      <div className="border-violet-400 border-b flex justify-between items-center h-14 px-5 bg-zinc-900">
        <div className="font-thin">
          Worker's Taskify
        </div>
        <div className="flex justify-between">
          <div>
              {publicKey ?
              <button onClick={async () => {
                        if(balance > 0) {
                          setIsPayoutProcessing(true);
                          try {
                            const req=await axios.get(`${BACKEND_URL}/v1/worker/balance`, {
                              headers: {
                                  "Authorization": localStorage.getItem("token")
                                }
                              })
                            console.log("???<<<<<>>>>>>>????????: ",req.data.pendingAmount)
                            const res = await axios.post(`${BACKEND_URL}/v1/worker/payout`, {SOL:req.data.pendingAmount}, {        
                              headers: {
                                "Authorization": localStorage.getItem("token"),
                              },
                            });
                            setBalance(res.data.amount);
                          } catch (error) {
                            alert("An unexpected error occurred. Please try again later.");
                          }
                          setIsPayoutProcessing(false);
                        } else {
                          alert("NO SOL earned: Do work before claim");
                        }
                      }} 
                    disabled={isPayoutProcessing} 
                    className="m-2 mr-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4
                          focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-1.5 me-2 dark:bg-gray-800
                          dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
                          {isPayoutProcessing? "Processing..." : `Pay me out ${balance} SOL`}
              </button> : ""}
            </div>
          { publicKey ? <WalletDisconnectButton /> : <WalletMultiButton /> }
        </div>
      </div>
    </div>
  );
}

export default Appbar;