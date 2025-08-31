import { Mic } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoiceIndicatorProps {
  isRecording: boolean;
}

export const VoiceIndicator = ({ isRecording }: VoiceIndicatorProps) => {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      {isRecording && (
        <>
          <motion.div
            className="absolute w-full h-full bg-primary/20 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute w-full h-full bg-primary/30 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
        </>
      )}
      <div className="relative w-12 h-12 bg-primary rounded-full flex items-center justify-center">
        <Mic className="w-6 h-6 text-white" />
      </div>
    </div>
  );
};