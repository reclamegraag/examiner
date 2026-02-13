'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { faCamera, faImage } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface ImageUploadProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

export function ImageUpload({ onUpload, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="text-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-2xl p-8 cursor-pointer hover:border-accent transition-colors"
      >
        <FontAwesomeIcon icon={faImage} className="w-12 h-12 text-muted mb-4" />
        <p className="text-foreground font-medium mb-1">Klik om te uploaden</p>
        <p className="text-sm text-muted">PNG, JPG of WEBP</p>
      </motion.div>
    </div>
  );
}

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  disabled?: boolean;
}

export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      setIsActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera toegang geweigerd');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsActive(false);
    }
  };

  const capture = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        onCapture(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isActive && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-card">
            <Button onClick={startCamera} icon={<FontAwesomeIcon icon={faCamera} />}>
              Camera starten
            </Button>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-card">
            <p className="text-error">{error}</p>
          </div>
        )}
      </div>
      
      {isActive && (
        <div className="flex gap-3">
          <Button variant="secondary" onClick={stopCamera} className="flex-1">
            Stop
          </Button>
          <Button onClick={capture} disabled={disabled} className="flex-1" icon={<FontAwesomeIcon icon={faCamera} />}>
            Foto maken
          </Button>
        </div>
      )}
    </div>
  );
}
