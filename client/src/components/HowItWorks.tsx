import { motion } from "framer-motion";
import { Compass, Edit, Check } from "lucide-react";

export default function HowItWorks() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <motion.div 
      id="how-it-works"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeIn}
      className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="text-center mb-16">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          How It Works
        </h2>
        <p className="mt-4 max-w-2xl text-xl text-gray-300 mx-auto">
          Creating your own stablecoin is simple with our platform
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-muted rounded-xl p-8 border border-border shadow-lg">
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-5">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white">1. Connect Your Wallet</h3>
          <p className="mt-4 text-muted-foreground">
            Connect your Phantom wallet to our platform with a single click for secure authentication.
          </p>
        </div>

        <div className="bg-muted rounded-xl p-8 border border-border shadow-lg">
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-5">
            <Edit className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white">2. Customize Your Token</h3>
          <p className="mt-4 text-muted-foreground">
            Specify token details like name, symbol, supply, and decimals through our guided form process.
          </p>
        </div>

        <div className="bg-muted rounded-xl p-8 border border-border shadow-lg">
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-5">
            <Check className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white">3. Deploy on Solana</h3>
          <p className="mt-4 text-muted-foreground">
            With one click, deploy your SPL token to the Solana blockchain and receive your token details instantly.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
