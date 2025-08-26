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

  const triggerFileInput = useCallback(() => {
    if (disabled || isUploading) return;
    
    console.log('Triggering file input...');
    setIsUploading(true);
    
    if (fileInputRef.current) {
      // Clear the input first
      fileInputRef.current.value = '';
      
      // Use multiple approaches to ensure it works
      try {
        // Approach 1: Direct click
        fileInputRef.current.click();
      } catch (error) {
        console.log('Direct click failed, trying programmatic approach...');
        try {
          // Approach 2: Programmatic event
          const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          fileInputRef.current.dispatchEvent(event);
        } catch (fallbackError) {
          console.log('Programmatic approach failed, trying focus...');
          try {
            // Approach 3: Focus and click
            fileInputRef.current.focus();
            fileInputRef.current.click();
          } catch (focusError) {
            console.error('All approaches failed:', focusError);
          }
        }
      }
      
      // Reset uploading state after a delay
      setTimeout(() => setIsUploading(false), 1000);
    }
  }, [disabled, isUploading]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.size);
      
      // Validate file size
      if (file.size > maxSize) {
        alert(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
        return;
      }
      
      onFileSelect(file);
    }
    setIsUploading(false);
  }, [onFileSelect, maxSize]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Touch start on mobile file input');
    triggerFileInput();
  }, [triggerFileInput]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Touch end on mobile file input');
    // Sometimes touchEnd is more reliable
    setTimeout(() => triggerFileInput(), 50);
  }, [triggerFileInput]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        capture={isMobile ? "environment" : undefined}
        className="hidden"
        disabled={disabled}
      />
      
      {/* Mobile-optimized upload area */}
      <div
                 className={`
           relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
           transition-all duration-200 ease-in-out
           ${disabled 
             ? 'border-border bg-muted cursor-not-allowed' 
             : 'border-border bg-background hover:border-primary hover:bg-accent active:bg-accent/80'
           }
           ${isUploading ? 'opacity-50' : ''}
           touch-manipulation
         `}
        onClick={!disabled ? triggerFileInput : undefined}
        onTouchStart={!disabled ? handleTouchStart : undefined}
        onTouchEnd={!disabled ? handleTouchEnd : undefined}
        style={{
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          minHeight: isMobile ? '120px' : '100px'
        }}
      >
                 <div className="flex flex-col items-center justify-center space-y-3">
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
           
           {isUploading && (
             <div className="flex items-center space-x-2 text-sm text-primary">
               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
               <span>Opening file picker...</span>
             </div>
           )}
         </div>
      </div>
      
             {/* Fallback button for mobile */}
       {isMobile && !disabled && (
         <div className="flex justify-center">
           <Button
             type="button"
             variant="outline"
             size="sm"
             onClick={triggerFileInput}
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
