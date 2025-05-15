import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { truncateAddress, getTokenExplorerUrl } from "@/lib/utils";
import { fetchWalletTokens, TokenData } from "@/lib/fetchTokens";
import { useToast } from "@/hooks/use-toast";

export default function MyTokens() {
  const [, navigate] = useLocation();
  const { connected, publicKey, connection } = useSolanaWallet();
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Redirect if not connected
  useEffect(() => {
    if (!connected) {
      navigate("/");
    }
  }, [connected, navigate]);

  // Fetch the user's tokens when the component loads
  useEffect(() => {
    async function loadTokens() {
      if (!publicKey) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log("Fetching tokens for wallet:", publicKey.toString());
        const walletTokens = await fetchWalletTokens(connection, publicKey);
        console.log("Fetched tokens:", walletTokens);
        setTokens(walletTokens);
      } catch (err) {
        console.error("Error loading tokens:", err);
        setError("Failed to load your tokens. Please try again.");
        toast({
          title: "Error Loading Tokens",
          description: "There was a problem loading your tokens from the Solana blockchain.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadTokens();
  }, [publicKey, connection, toast]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  // We no longer have the teamTokens variable
  // Instead, we're using the tokens state that's fetched from the blockchain

  if (!connected || !publicKey) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="py-12"
      >
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Page Header */}
          <motion.div variants={fadeIn} className="px-4 sm:px-0 mb-6 flex items-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="mr-4 items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">My Team's Tokens</h1>
              <p className="mt-2 text-sm text-gray-400">
                View and manage stablecoins created by your team
              </p>
            </div>
          </motion.div>

          {/* Tokens List */}
          <motion.div
            variants={fadeIn}
            className="mt-8 px-4 sm:px-0"
          >
            <Card className="bg-muted shadow-lg border border-border overflow-hidden">
              <CardHeader>
                <CardTitle>SPL Tokens In Your Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mr-2" />
                    <p className="text-muted-foreground">Loading your tokens from the Solana blockchain...</p>
                  </div>
                ) : error ? (
                  <div className="bg-destructive/10 p-6 rounded-md text-center">
                    <p className="text-destructive">{error}</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => window.location.reload()}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : tokens.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      You don't have any tokens in your wallet yet.
                    </p>
                    <Button 
                      onClick={() => navigate("/create-token")}
                      className="items-center"
                    >
                      Create Your First Token
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase border-b border-border">
                        <tr>
                          <th scope="col" className="px-6 py-3">Token</th>
                          <th scope="col" className="px-6 py-3">Symbol</th>
                          <th scope="col" className="px-6 py-3">Balance</th>
                          <th scope="col" className="px-6 py-3">Decimals</th>
                          <th scope="col" className="px-6 py-3">Created</th>
                          <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tokens.map((token, index) => (
                          <tr key={token.address} className="border-b border-border hover:bg-muted/50">
                            <td className="px-6 py-4 font-medium">
                              {token.name}
                              <div className="text-xs text-muted-foreground mt-1">
                                {truncateAddress(token.address)}
                              </div>
                            </td>
                            <td className="px-6 py-4">{token.symbol}</td>
                            <td className="px-6 py-4">{token.totalSupply}</td>
                            <td className="px-6 py-4">{token.decimals}</td>
                            <td className="px-6 py-4">{token.createdAt}</td>
                            <td className="px-6 py-4">
                              <a 
                                href={getTokenExplorerUrl(token.address)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 inline-flex items-center"
                              >
                                View
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}