import { Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoiceIndicatorProps {
  isRecording: boolean;
  isSpeaking: boolean;
}

export const VoiceIndicator = ({ isRecording, isSpeaking }: VoiceIndicatorProps) => {
  if (!isRecording && !isSpeaking) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full glass-card border-glass ${
        isRecording ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'
      }`}>
        {isRecording ? (
          <>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Mic className="w-4 h-4 text-red-500" />
            </motion.div>
            <span className="text-sm font-medium text-red-500">Recording...</span>
          </>
        ) : (
          <>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <div className="w-4 h-4 rounded-full bg-blue-500" />
            </motion.div>
            <span className="text-sm font-medium text-blue-500">AI Speaking...</span>
          </>
        )}
      </div>
    </motion.div>
  );
};