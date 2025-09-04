import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';

const RealtimeVoiceClient: React.FC = () => {
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  const startCall = async () => {
    setStatus('Connecting...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peerConnection.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // Send the candidate to the remote peer
        }
      };

      pc.ontrack = (event) => {
        const audio = new Audio();
        audio.srcObject = event.streams;
        audio.play();
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send the offer to the server
      const response = await fetch('/api/webrtc-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sdp: offer.sdp, type: offer.type }),
      });
      const answer = await response.json();
      await pc.setRemoteDescription(answer);

      setIsCalling(true);
      setStatus('Connected');
    } catch (error) {
      console.error('Error starting call:', error);
      setStatus('Failed to connect');
    }
  };

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    setIsCalling(false);
    setStatus('Disconnected');
  };

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{status}</div>
        <div className="flex items-center gap-2">
          <Button onClick={toggleMute} variant="outline" size="icon" disabled={!isCalling}>
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          {isCalling ? (
            <Button onClick={endCall} variant="destructive" size="icon">
              <PhoneOff className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={startCall} variant="default" size="icon">
              <Phone className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimeVoiceClient;