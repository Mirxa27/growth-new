
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInterfaceProps {
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onSpeechResult: (text: string) => void;
  currentText?: string;
  isProcessing?: boolean;
  isSpeaking?: boolean;
}

export const VoiceInterface = ({
  isListening,
  onStartListening,
  onStopListening,
  onSpeechResult,
  currentText = '',
  isProcessing = false,
  isSpeaking = false
}: VoiceInterfaceProps) => {
  const [isSupported, setIsSupported] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onSpeechResult(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        onStopListening();
      };

      recognition.onend = () => {
        onStopListening();
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [onStopListening, onSpeechResult]);

  useEffect(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.start();
      startAudioMonitoring();
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
      stopAudioMonitoring();
    }
  }, [isListening]);

  const startAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
        }
        animationRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopAudioMonitoring = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
  };

  const handleToggleListening = () => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="text-center text-muted-foreground">
        <p>Voice recognition is not supported in your browser.</p>
        <p className="text-sm mt-2">Please use Chrome, Safari, or Edge for the best experience.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Voice Visualization */}
      <div className="relative">
        {/* Outer Glow Rings */}
        <div className={cn(
          "absolute inset-0 rounded-full transition-all duration-300",
          isListening 
            ? "animate-ping bg-primary/20 scale-150" 
            : "bg-glass-ambient/10 scale-100"
        )}></div>
        
        <div className={cn(
          "absolute inset-0 rounded-full transition-all duration-500",
          isListening 
            ? "animate-pulse bg-primary/30 scale-125" 
            : "bg-glass-ambient/5 scale-100"
        )}></div>

        {/* Main Voice Button */}
        <Button
          onClick={handleToggleListening}
          disabled={isProcessing}
          className={cn(
            "relative w-24 h-24 rounded-full transition-all duration-300 border-2",
            isListening 
              ? "bg-primary border-primary-glow shadow-glow scale-110" 
              : "glass border-glass-border hover:scale-105",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
          style={{
            transform: isListening 
              ? `scale(${1.1 + audioLevel * 0.3})` 
              : undefined
          }}
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </Button>

        {/* Audio Level Indicator */}
        {isListening && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 bg-primary rounded-full transition-all duration-100",
                    audioLevel * 10 > i ? "h-4" : "h-1"
                  )}
                ></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p className={cn(
          "text-lg font-medium transition-colors",
          isListening ? "text-primary" : "text-foreground"
        )}>
          {isProcessing 
            ? "Processing..."
            : isListening 
              ? "Listening..." 
              : "Tap to speak"
          }
        </p>
        
        {isSpeaking && (
          <div className="flex items-center justify-center mt-2 text-secondary">
            <Volume2 className="w-4 h-4 mr-2" />
            <span className="text-sm">NewMe is speaking...</span>
          </div>
        )}
      </div>

      {/* Current Transcript */}
      {currentText && (
        <div className="glass rounded-lg p-4 max-w-md w-full">
          <p className="text-sm text-muted-foreground mb-1">You said:</p>
          <p className="text-foreground">{currentText}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center max-w-sm">
        <p className="text-xs text-muted-foreground">
          {isListening 
            ? "Speak clearly and tap the microphone when you're done"
            : "Tap the microphone to start your voice conversation with NewMe"
          }
        </p>
      </div>
    </div>
  );
};
