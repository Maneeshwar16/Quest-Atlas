import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Camera, MapPin, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface Quest {
  id: string;
  title: string;
  description: string;
}

const SubmitQuest = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [geoLocation, setGeoLocation] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchQuest = async () => {
      if (!id) return;

      try {
        const { data: questData, error } = await supabase
          .from("Quests")
          .select("id, title, description")
          .eq("id", id)
          .single();

        if (error) throw error;
        setQuest(questData);

        // Check if user has already submitted
        const { data: existingSubmission } = await supabase
          .from("Submissions")
          .select("id")
          .eq("quest_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingSubmission) {
          toast({
            title: "Already Submitted",
            description: "You have already submitted for this quest.",
            variant: "destructive",
          });
          navigate(`/quest/${id}`);
        }
      } catch (error) {
        console.error("Error fetching quest:", error);
        toast({
          title: "Error",
          description: "Failed to load quest details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuest();
  }, [id, user, navigate, toast]);

  const validateFile = (file: File): string | null => {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return "Please select an image (JPEG, PNG, GIF, WebP) or video (MP4, MOV, WebM) file";
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File select handler triggered');
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      const error = validateFile(file);
      if (error) {
        console.log('File validation error:', error);
        setFileError(error);
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }

      setFileError(null);
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      console.log('File preview URL created');
    } else {
      console.log('No file selected');
    }
  };

  const handleFileClick = () => {
    console.log('File click handler triggered');
    if (fileInputRef.current) {
      try {
        fileInputRef.current.click();
        console.log('File input clicked successfully');
      } catch (error) {
        console.error('Error clicking file input:', error);
        // Fallback: try to trigger the file dialog programmatically
        const event = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        fileInputRef.current.dispatchEvent(event);
      }
    } else {
      console.error('File input ref is null');
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        return;
      }

      setFileError(null);
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setGeoLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          toast({
            title: "Location Added",
            description: "Your current location has been added to the submission.",
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({
            title: "Location Error",
            description: "Could not get your location. You can enter it manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !quest || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      let photoUrl = null;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('quest-submissions')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('quest-submissions')
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      // Create submission
      const { error: submitError } = await supabase
        .from("Submissions")
        .insert({
          quest_id: quest.id,
          user_id: user.id,
          description: description.trim(),
          photo_url: photoUrl,
          geo_location: geoLocation.trim() || null,
          status: 'pending'
        });

      if (submitError) throw submitError;

      toast({
        title: "Quest Submitted!",
        description: "Your submission has been sent for review. You'll be notified once it's verified.",
      });

      navigate(`/quest/${quest.id}`);
    } catch (error) {
      console.error("Error submitting quest:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your quest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Quest Not Found</h2>
          <p className="text-muted-foreground mb-4">The quest you're trying to submit for doesn't exist.</p>
          <Button onClick={() => navigate("/home")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/quest/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quest
          </Button>
        </div>

        {/* Quest Context */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              Submitting for: {quest.title}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {quest.description}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Submit Your Quest
            </CardTitle>
            <CardDescription>
              Share your experience and proof of completion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div>
                <Label htmlFor="photo">Photo/Video Evidence</Label>
                <div className="mt-2">
                  <div 
                    className={`relative flex items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer transition-colors touch-manipulation ${
                      fileError 
                        ? 'border-red-300 bg-red-50 hover:bg-red-100 active:bg-red-200' 
                        : selectedFile 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100 active:bg-gray-200'
                    } ${isMobile ? 'h-40 min-h-[160px]' : 'h-32'}`}
                    onClick={handleFileClick}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFileClick();
                    }}
                    onDrop={handleFileDrop}
                    onDragOver={handleDragOver}
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none'
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      id="photo"
                      type="file"
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      capture={isMobile ? "environment" : undefined}
                    />
                    
                    {!selectedFile ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <Upload className={`${isMobile ? 'w-10 h-10' : 'w-8 h-8'} mb-4 text-gray-500`} />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">
                            {isMobile ? 'Tap to upload or take photo' : 'Click to upload'}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, MP4 (MAX. 10MB)
                        </p>
                        {isMobile && (
                          <p className="text-xs text-gray-400 mt-1">
                            📱 Camera access available
                          </p>
                        )}
                        {/* Mobile fallback button */}
                        {isMobile && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3 px-4 py-2 text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileClick();
                            }}
                          >
                            📷 Take Photo / Choose File
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        {selectedFile.type.startsWith('image/') ? (
                          <img
                            src={previewUrl!}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <video
                            src={previewUrl!}
                            className="w-full h-full object-cover rounded-lg"
                            controls
                          />
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile();
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {fileError && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {fileError}
                    </div>
                  )}
                  
                  {selectedFile && (
                    <div className="mt-2 text-sm text-gray-600">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your experience, what you discovered, and how you completed the quest..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 min-h-[100px]"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location (Optional)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="location"
                    placeholder="Enter location or coordinates"
                    value={geoLocation}
                    onChange={(e) => setGeoLocation(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    className="shrink-0"
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting || !description.trim()}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {submitting ? "Submitting..." : "Submit Quest"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubmitQuest;