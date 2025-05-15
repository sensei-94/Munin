import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import TokenCreationForm from "@/components/TokenCreationForm";
import CreateTokenSuccess from "@/components/CreateTokenSuccess";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { TokenDetails } from "@/types";

export default function TokenCreator() {
  const [, navigate] = useLocation();
  const { connected } = useSolanaWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Creating your token...");
  const [tokenCreated, setTokenCreated] = useState(false);
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);

  useEffect(() => {
    if (!connected) {
      navigate("/");
    }
  }, [connected, navigate]);

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleTokenCreationSuccess = (details: TokenDetails) => {
    setTokenDetails(details);
    setIsLoading(false);
    setTokenCreated(true);
  };

  const handleReturnToDashboard = () => {
    setTokenCreated(false);
    navigate("/dashboard");
  };

  if (!connected) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="py-12"
      >
        {!tokenCreated ? (
          <TokenCreationForm 
            onBackToDashboard={handleBackToDashboard}
            onLoading={setIsLoading}
            setLoadingText={setLoadingText}
            onTokenCreationSuccess={handleTokenCreationSuccess}
          />
        ) : (
          <CreateTokenSuccess 
            tokenDetails={tokenDetails!}
            onReturnToDashboard={handleReturnToDashboard}
          />
        )}
      </motion.div>

      {isLoading && (
        <LoadingOverlay loadingText={loadingText} />
      )}
    </div>
  );
}
