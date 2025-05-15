import React from 'react';
import { BankAccount } from '@/components/SimpleBankVerification';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Props {
  goToNextStep: () => void;
  goToPrevStep: () => void;
  updateBankAccount: (bankAccount: BankAccount) => void;
}

export default function HardcodedVerificationStep({ 
  goToNextStep, 
  goToPrevStep,
  updateBankAccount 
}: Props) {
  // Function to bypass the verification
  const handleVerify = () => {
    // Create a hardcoded bank account
    const bankAccount: BankAccount = {
      institutionName: "Bank of America",
      accountName: "Checking Account",
      accountMask: "1234",
      currentBalance: 5000, 
      availableBalance: 5000
    };
    
    // Update the parent's state
    updateBankAccount(bankAccount);
    
    // Go to next step automatically
    goToNextStep();
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-6">
      <h2 className="text-xl font-semibold mb-4 text-center">Bank Verification</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        This step would normally connect to Plaid for bank verification,
        but we're using a hardcoded solution for development.
      </p>
      
      <div className="flex gap-4 mb-6">
        <Button variant="outline" onClick={goToPrevStep}>
          Go Back
        </Button>
        <Button onClick={handleVerify}>
          Complete Verification
        </Button>
      </div>
    </div>
  );
}