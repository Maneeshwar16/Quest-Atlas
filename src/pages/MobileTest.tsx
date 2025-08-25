import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function MobileTest() {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
  };

  const handleFileClick = () => {
    addLog('File click handler triggered');
    if (fileInputRef.current) {
      try {
        fileInputRef.current.click();
        addLog('File input clicked successfully');
      } catch (error) {
        addLog(`Error clicking file input: ${error}`);
      }
    } else {
      addLog('File input ref is null');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    addLog('File select handler triggered');
    const file = event.target.files?.[0];
    if (file) {
      addLog(`File selected: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      setSelectedFile(file);
    } else {
      addLog('No file selected');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addLog('Touch start event triggered');
    handleFileClick();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Mobile Upload Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-1">
              <p><strong>Mobile Detection:</strong> {isMobile ? 'Yes' : 'No'}</p>
              <p><strong>Touch Support:</strong> {'ontouchstart' in window ? 'Yes' : 'No'}</p>
              <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</p>
            </div>

            {/* Test Area 1: Direct file input */}
            <div className="space-y-2">
              <h3 className="font-medium">Test 1: Direct File Input</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                capture={isMobile ? "environment" : undefined}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* Test Area 2: Custom styled area */}
            <div className="space-y-2">
              <h3 className="font-medium">Test 2: Custom Styled Area</h3>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                onClick={handleFileClick}
                onTouchStart={handleTouchStart}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {isMobile ? 'Tap here to upload' : 'Click here to upload'}
                </p>
              </div>
            </div>

            {/* Test Area 3: Button approach */}
            <div className="space-y-2">
              <h3 className="font-medium">Test 3: Button Approach</h3>
              <Button
                onClick={handleFileClick}
                className="w-full"
                variant="outline"
              >
                📷 Choose File / Take Photo
              </Button>
            </div>

            {/* Results */}
            {selectedFile && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">File Selected Successfully!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}

            {/* Logs */}
            <div className="space-y-2">
              <h3 className="font-medium">Debug Logs:</h3>
              <div className="max-h-40 overflow-y-auto space-y-1 bg-gray-100 p-2 rounded text-xs">
                {logs.length === 0 ? (
                  <p className="text-gray-500">No logs yet</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="text-gray-700">
                      {log}
                    </div>
                  ))
                )}
              </div>
              <Button
                onClick={() => setLogs([])}
                size="sm"
                variant="outline"
              >
                Clear Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
