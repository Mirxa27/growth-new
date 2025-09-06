import { useState, useRef } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Button } from '@/components/ui/button';

interface CameraComponentProps {
  onPhotoTaken: (base64Image: string) => void;
  className?: string;
}

export function CameraComponent({ onPhotoTaken, className }: CameraComponentProps) {
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const takePhoto = async () => {
    try {
      setIsTakingPhoto(true);
      setError(null);

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt, // Let user choose between camera and gallery
      });

      if (image.base64String) {
        onPhotoTaken(image.base64String);
      }
    } catch (err: any) {
      // Handle user cancellation
      if (err.message === 'User cancelled photos app') {
        return;
      }

      // Fallback to web file input for web platform
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        setError('Camera not available. Please use a device with camera support.');
      }
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(',')[1]; // Remove data URL prefix
        onPhotoTaken(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={className}>
      <Button
        onClick={takePhoto}
        disabled={isTakingPhoto}
        className="bg-gradient-primary hover:opacity-90"
      >
        {isTakingPhoto ? 'Taking Photo...' : '📷 Take Photo'}
      </Button>

      {/* Fallback file input for web platform */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}