'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface ImagePreviewStackProps {
  images: Array<{ id: string; previewUrl: string }>;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function ImagePreviewStack({ images, onRemove, disabled }: ImagePreviewStackProps) {
  if (images.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-muted font-medium">
        {images.length} afbeelding{images.length !== 1 ? 'en' : ''}
      </p>
      <AnimatePresence>
        {images.map((image) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative group"
          >
            <div className="h-32 rounded-xl border-2 border-border overflow-hidden bg-black">
              <img
                src={image.previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={() => onRemove(image.id)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-error text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
