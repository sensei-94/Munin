import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, Clock, Folder } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { truncateAddress } from "@/lib/utils";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { connected, publicKey, connect } = useSolanaWallet();

  useEffect(() => {
    if (!connected) {
      navigate("/");
    }
  }, [connected, navigate]);

  const handleCreateToken = () => {
    navigate("/create-token");
  };

  const handleViewTokens = () => {
    navigate("/my-tokens");
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

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
              staggerChildren: 0.1,
            },
          },
        }}
        className="py-12"
      >
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <motion.div variants={fadeIn} className="px-4 sm:px-0">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-400">
              Connected with: {truncateAddress(publicKey.toString())}
            </p>
          </motion.div>

          {/* Dashboard Grid */}
          <motion.div
            variants={fadeIn}
            className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 px-4 sm:px-0"
          >
            <Card className="bg-muted overflow-hidden shadow-lg border border-border">
              <CardContent className="p-6">
                <img
                  className="w-full h-40 object-cover rounded mb-5"
                  src="https://images.unsplash.com/photo-1622630998477-20aa696ecb05?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
                  alt="Digital wallet interface"
                />
                <h3 className="text-lg font-medium text-white">
                  Create Stablecoin
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Launch your own SPL token on Solana blockchain
                </p>
                <Button
                  onClick={handleCreateToken}
                  className="mt-4 inline-flex items-center"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-muted overflow-hidden shadow-lg border border-border">
              <CardContent className="p-6">
                <img
                  className="w-full h-40 object-cover rounded mb-5"
                  src="https://images.unsplash.com/photo-1639322537504-6427a16b0a28?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
                  alt="Blockchain transaction visualization"
                />
                <h3 className="text-lg font-medium text-white">My Tokens</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  View and manage your created tokens
                </p>
                <Button
                  variant="outline"
                  className="mt-4 inline-flex items-center"
                  onClick={handleViewTokens}
                >
                  View Tokens
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-muted overflow-hidden shadow-lg border border-border">
              <CardContent className="p-6">
                <img
                  className="w-full h-40 object-cover rounded mb-5"
                  src="https://cdn.pixabay.com/photo/2022/12/26/11/37/bitcoin-7678812_1280.jpg"
                  alt="Cryptocurrency interface"
                />
                <h3 className="text-lg font-medium text-white">
                  Resource Center
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Learn about SPL tokens and best practices
                </p>
                <Button
                  variant="outline"
                  className="mt-4 inline-flex items-center"
                >
                  Explore Resources
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={fadeIn} className="mt-10 px-4 sm:px-0">
            <h2 className="text-xl font-semibold text-white mb-5">
              Recent Activity
            </h2>
            <Card className="bg-muted shadow-lg border border-border overflow-hidden">
              <ul className="divide-y divide-border">
                <li>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-primary truncate">
                        Connected Phantom Wallet
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Successful
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-muted-foreground">
                          <ExternalLink className="flex-shrink-0 mr-1.5 h-5 w-5 text-muted-foreground" />
                          {truncateAddress(publicKey.toString())}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-muted-foreground sm:mt-0">
                        <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-muted-foreground" />
                        <p>Connected just now</p>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
