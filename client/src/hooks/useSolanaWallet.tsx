import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Connection, PublicKey, clusterApiUrl, Transaction } from "@solana/web3.js";
import { useToast } from "./use-toast";

interface PhantomEvent {
  connect: { publicKey: { toString(): string } };
  disconnect: undefined;
}

interface Phantom {
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: <T extends keyof PhantomEvent>(event: T, callback: (args: PhantomEvent[T]) => void) => void;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  isPhantom: boolean;
  publicKey: PublicKey | null;
  isConnected: boolean;
}

interface WindowWithSolana extends Window {
  solana?: Phantom;
}

interface SolanaWalletContextType {
  wallet: Phantom | null;
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  connectionError: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  connection: Connection;
  cluster: string;
}

// Create the connection
const solanaCluster = "devnet";
const solanaConnection = new Connection(clusterApiUrl(solanaCluster), "confirmed");

const SolanaWalletContext = createContext<SolanaWalletContextType | null>(null);

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<Phantom | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log("Checking for Phantom wallet...");
    const solana = (window as WindowWithSolana).solana;
    
    if (solana?.isPhantom) {
      console.log("Phantom wallet found!");
      setWallet(solana);
      
      // Check if already connected
      if (solana.publicKey && solana.isConnected) {
        console.log("Already connected with public key:", solana.publicKey.toString());
        setPublicKey(solana.publicKey);
        setConnected(true);
      } else {
        console.log("Phantom found but not connected yet");
      }

      solana.on("connect", (args) => {
        try {
          if (args && args.publicKey) {
            setPublicKey(new PublicKey(args.publicKey.toString()));
            setConnected(true);
            setConnecting(false);
            setConnectionError(null);
          } else {
            console.warn("Connect event fired but no publicKey was provided");
            // We still mark as connected since Phantom might have connected but not provided the key yet
            setConnected(true);
            setConnecting(false);
          }
        } catch (error) {
          console.error("Error during wallet connection:", error);
          setConnectionError("Failed to connect to wallet");
          setConnecting(false);
        }
      });

      solana.on("disconnect", () => {
        setPublicKey(null);
        setConnected(false);
      });
    }
  }, []);

  const connect = async () => {
    if (!wallet) {
      const errorMessage = "Phantom wallet not found! Please install the Phantom browser extension.";
      setConnectionError(errorMessage);
      toast({
        title: "Wallet Error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    try {
      setConnecting(true);
      setConnectionError(null);
      
      // Check if already connected
      if (wallet.publicKey) {
        setPublicKey(wallet.publicKey);
        setConnected(true);
        setConnecting(false);
        return;
      }

      // Attempt to connect
      const response = await wallet.connect();
      
      // Some phantom wallet versions return different responses
      if (response && response.publicKey) {
        setPublicKey(response.publicKey);
        setConnected(true);
      } else if (wallet.publicKey) {
        // Fallback to check wallet.publicKey after connection
        setPublicKey(wallet.publicKey);
        setConnected(true);
      }
    } catch (error) {
      console.error("Connection error:", error);
      const errorMessage = (error as Error)?.message || "Failed to connect to wallet";
      setConnectionError(errorMessage);
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (wallet) {
      await wallet.disconnect();
      setPublicKey(null);
      setConnected(false);
    }
  };

  const contextValue = {
    wallet,
    publicKey,
    connected,
    connecting,
    connectionError,
    connect,
    disconnect,
    connection: solanaConnection,
    cluster: solanaCluster
  };

  return (
    <SolanaWalletContext.Provider value={contextValue}>
      {children}
    </SolanaWalletContext.Provider>
  );
}

export function useSolanaWallet() {
  const context = useContext(SolanaWalletContext);
  if (!context) {
    throw new Error("useSolanaWallet must be used within a SolanaWalletProvider");
  }
  return context;
}