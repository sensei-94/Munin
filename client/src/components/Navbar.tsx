import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { truncateAddress } from "@/lib/utils";
import { Wallet, Info } from "lucide-react";

export default function Navbar() {
  const [location, navigate] = useLocation();
  const { connected, publicKey, connect, disconnect, connecting } =
    useSolanaWallet();

  const handleConnectWallet = async () => {
    console.log("Connecting to wallet...");
    try {
      await connect();
      console.log("Connection success or handler completed");
    } catch (error) {
      console.error("Connection error in Navbar:", error);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    navigate("/");
  };

  const goHome = () => {
    navigate("/");
  };

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={goHome}>
            <div className="flex-shrink-0 flex items-center">
              <svg
                className="h-8 w-8 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 18V12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 8H12.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 12H17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="ml-2 text-xl font-bold text-white">Munin</span>
            </div>
          </div>
          <div className="flex items-center">
            {connected && publicKey ? (
              <div
                className="hidden md:flex items-center bg-muted rounded-full py-1 px-3 border border-border mr-2 cursor-pointer hover:bg-muted/80"
                onClick={handleDisconnect}
              >
                <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                <span className="text-sm text-gray-300 font-medium">
                  {truncateAddress(publicKey.toString())}
                </span>
              </div>
            ) : null}

            {!connected ? (
              <Button
                onClick={handleConnectWallet}
                disabled={connecting}
                className="ml-4 flex items-center"
              >
                <Wallet className="w-5 h-5 mr-2" />
                {connecting ? "Connecting..." : "Connect Phantom"}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="md:hidden"
              >
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
