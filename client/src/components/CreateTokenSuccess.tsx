import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { TokenDetails } from "@/types";
import { getExplorerUrl, getTokenExplorerUrl, truncateAddress } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

interface CreateTokenSuccessProps {
  tokenDetails: TokenDetails;
  onReturnToDashboard: () => void;
}

export default function CreateTokenSuccess({ 
  tokenDetails, 
  onReturnToDashboard 
}: CreateTokenSuccessProps) {
  const [open, setOpen] = useState(true);
  const { toast } = useToast();
  const { cluster } = useSolanaWallet();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    });
  };

  const handleViewInExplorer = () => {
    window.open(getExplorerUrl(tokenDetails.transactionId, cluster), "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-muted border border-border max-w-lg mx-auto">
        <DialogHeader className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">Token Created Successfully!</DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Your stablecoin has been successfully created on the Solana blockchain. You can now manage and distribute your token.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-background rounded-md p-6 text-left mb-6">
          <div className="mb-5">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Token Address</span>
            <div className="flex items-center mt-2 bg-muted/40 p-2 rounded">
              <span className="text-sm text-white font-mono truncate">{tokenDetails.tokenAddress}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-2 h-8 w-8 shrink-0"
                onClick={() => handleCopy(tokenDetails.tokenAddress, "Token address")}
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
          
          <div className="mb-5">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Transaction ID</span>
            <div className="flex items-center mt-2 bg-muted/40 p-2 rounded">
              <span className="text-sm text-white font-mono truncate">{tokenDetails.transactionId}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-2 h-8 w-8 shrink-0"
                onClick={() => handleCopy(tokenDetails.transactionId, "Transaction ID")}
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
          
          <div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Token Supply</span>
            <div className="flex items-center mt-2">
              <span className="text-sm text-white">{tokenDetails.supply} (with {tokenDetails.decimals} decimals)</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button onClick={handleViewInExplorer} className="flex-1 items-center justify-center">
            View in Explorer
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setOpen(false);
              onReturnToDashboard();
            }}
          >
            Return to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
