import { motion, AnimatePresence } from "framer-motion";

interface LoadingOverlayProps {
  loadingText: string;
}

export default function LoadingOverlay({ loadingText }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed z-50 inset-0 overflow-y-auto flex items-center justify-center"
      >
        <div className="fixed inset-0 bg-background bg-opacity-90 backdrop-blur-sm transition-opacity"></div>
        
        <div className="relative px-4 pt-5 pb-4 text-center z-10">
          <div className="mx-auto flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg leading-6 font-medium text-white">
              {loadingText}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">This may take a few moments. Please don't close this window.</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
