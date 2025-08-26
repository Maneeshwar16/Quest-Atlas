import React, { useRef, useState, useCallback } from 'react';
import { Button } from './button';
import { Upload, Image } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileFileInputProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
}

export const MobileFileInput: React.FC<MobileFileInputProps> = ({
  onFileSelect,
  accept = "image/*,video/*",
  maxSize = 10 * 1024 * 1024, // 10MB
  className = "",
  disabled = false
}) => {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > maxSize) {
        alert(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
        return;
      }
      onFileSelect(file);
    }
    setIsUploading(false);
  }, [onFileSelect, maxSize]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Native-first approach: label + full-size hidden input */}
      <label
        className={`relative block rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200 ease-in-out ${
          disabled ? 'border-border bg-muted cursor-not-allowed' : 'border-border bg-background hover:border-primary hover:bg-accent/20'
        } ${isUploading ? 'opacity-50' : ''}`}
      >
        {/* Full-size transparent input to ensure native picker opens on tap */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          capture={isMobile ? "environment" : undefined}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {isMobile ? 'Tap to upload or take photo' : 'Click to upload'}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, MP4 (MAX. {(maxSize / 1024 / 1024).toFixed(1)}MB)
            </p>
          </div>
        </div>
      </label>

      {/* Fallback button for accessibility (also uses native input) */}
      {isMobile && !disabled && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center justify-center space-x-2"
          >
            <Image className="w-4 h-4" />
            <span>Choose File</span>
          </Button>
        </div>
      )}
    </div>
  );
};
