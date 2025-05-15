import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { ArrowRight, Shield, Coins, FileText } from "lucide-react";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

export default function Home() {
  const [, navigate] = useLocation();
  const { connected, connect } = useSolanaWallet();

  useEffect(() => {
    if (connected) {
      navigate("/dashboard");
    }
  }, [connected, navigate]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const fadeInStaggered = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const handleConnect = async () => {
    await connect();
    if (connected) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/90">
      <Navbar />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInStaggered}
        className="pt-12 sm:pt-20 pb-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <motion.div
              variants={fadeIn}
              className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
                <Shield className="w-4 h-4 mr-2" /> Internal Team Dashboard
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                <span className="block">Stablecoin</span>
                <span className="block text-primary">Token Manager</span>
              </h1>
              <p className="mt-6 text-base text-gray-300 sm:text-lg md:text-xl">
                Create and manage SPL tokens for small currencies such as pesos
                on Solana. An internal tool for authorized team members only.
              </p>
              <div className="mt-10 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Button
                    onClick={handleConnect}
                    className="w-full px-8 py-3 md:py-4 md:text-lg md:px-10 flex items-center"
                    size="lg"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="2"
                        y="6"
                        width="20"
                        height="12"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M22 10H18C16.8954 10 16 10.8954 16 12V12C16 13.1046 16.8954 14 18 14H22"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    Connect Phantom Wallet
                  </Button>
                </div>
              </div>
            </motion.div>
            <motion.div
              variants={fadeIn}
              className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
            >
              <Card className="w-full p-6 bg-muted/50 border border-border">
                <h3 className="text-xl font-bold text-white mb-4">
                  Internal Use Guidelines
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                      <span className="text-primary text-sm font-medium">
                        1
                      </span>
                    </div>
                    <p className="ml-3 text-sm text-gray-300">
                      Authenticate with your Phantom wallet connected to the
                      Solana devnet
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                      <span className="text-primary text-sm font-medium">
                        2
                      </span>
                    </div>
                    <p className="ml-3 text-sm text-gray-300">
                      Use the dashboard to create and monitor tokens for small
                      currencies
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                      <span className="text-primary text-sm font-medium">
                        3
                      </span>
                    </div>
                    <p className="ml-3 text-sm text-gray-300">
                      Set proper token parameters (decimals, supply) according
                      to the currency specs
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                      <span className="text-primary text-sm font-medium">
                        4
                      </span>
                    </div>
                    <p className="ml-3 text-sm text-gray-300">
                      Keep track of all created tokens in the monitoring
                      dashboard
                    </p>
                  </li>
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>

        <motion.div
          variants={fadeIn}
          className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-muted border border-border">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Small Currency Support
                </h3>
                <p className="text-sm text-gray-300">
                  Specially designed for creating tokens that represent local
                  currencies like pesos that need digital representation.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted border border-border">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Secure Management
                </h3>
                <p className="text-sm text-gray-300">
                  Internal team access only. All token operations are secured
                  with Phantom wallet authentication.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted border border-border">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Token Registry
                </h3>
                <p className="text-sm text-gray-300">
                  Comprehensive dashboard of all tokens created by the team with
                  detailed metadata and management options.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <motion.div
          variants={fadeIn}
          className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="bg-muted rounded-xl overflow-hidden shadow-xl border border-border">
            <div className="px-4 py-5 sm:p-6 md:flex md:items-center md:justify-between">
              <div className="max-w-xl">
                <h3 className="text-2xl font-bold text-white">
                  Team Member Access
                </h3>
                <p className="mt-3 text-lg text-gray-300">
                  Connect your authorized Phantom wallet to access the token
                  management dashboard.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:ml-6">
                <Button
                  onClick={handleConnect}
                  className="w-full md:w-auto flex items-center"
                  size="lg"
                >
                  Connect & Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
