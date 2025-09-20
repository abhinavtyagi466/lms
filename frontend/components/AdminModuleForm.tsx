import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, Youtube, AlertCircle, CheckCircle } from 'lucide-react';
import { apiService } from '../services/apiService';
import { toast } from 'sonner';

interface AdminModuleFormProps {
  onModuleCreated?: () => void;
}

export const AdminModuleForm: React.FC<AdminModuleFormProps> = ({ onModuleCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeLink: '',
    tags: '',
    status: 'draft' as 'draft' | 'published'
  });
  const [loading, setLoading] = useState(false);
  const [extractedVideoId, setExtractedVideoId] = useState<string | null>(null);

  // Extract YouTube video ID from various URL formats
  const extractVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  };

  // Get thumbnail URL for preview
  const getThumbnailUrl = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  // Handle YouTube link input
  const handleYouTubeLinkChange = (link: string) => {
    setFormData(prev => ({ ...prev, youtubeLink: link }));
    const videoId = extractVideoId(link);
    setExtractedVideoId(videoId);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.youtubeLink) {
      toast.error('Title and YouTube link are required');
      return;
    }

    if (!extractedVideoId) {
      toast.error('Please enter a valid YouTube URL or video ID');
      return;
    }

    try {
      setLoading(true);
      
      const moduleData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        ytVideoId: extractedVideoId,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        status: formData.status
      };

      const response = await apiService.modules.createModule(moduleData);

      if (response && (response.success || response.data?.success)) {
        toast.success('Module created successfully!');
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          youtubeLink: '',
          tags: '',
          status: 'draft'
        });
        setExtractedVideoId(null);
        
        // Notify parent component
        if (onModuleCreated) {
          onModuleCreated();
        }
      }
    } catch (error) {
      console.error('Error creating module:', error);
      toast.error('Failed to create module. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Plus className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Create New YouTube Module</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <Label htmlFor="title">Module Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter module title"
            required
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter module description"
          />
        </div>

        {/* YouTube Link */}
        <div>
          <Label htmlFor="youtubeLink">YouTube Video Link or ID *</Label>
          <div className="flex gap-2">
            <Input
              id="youtubeLink"
              value={formData.youtubeLink}
              onChange={(e) => handleYouTubeLinkChange(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=VIDEO_ID or just VIDEO_ID"
              required
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open('https://www.youtube.com', '_blank')}
              className="whitespace-nowrap"
            >
              <Youtube className="w-4 h-4 mr-1" />
              Browse
            </Button>
          </div>
          
          {/* Video ID validation */}
          {formData.youtubeLink && (
            <div className="mt-2">
              {extractedVideoId ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Valid YouTube video ID: {extractedVideoId}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Invalid YouTube URL or video ID</span>
                </div>
              )}
            </div>
          )}

          {/* Video preview */}
          {extractedVideoId && (
            <div className="mt-3 p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <img
                  src={getThumbnailUrl(extractedVideoId)}
                  alt="Video thumbnail"
                  className="w-20 h-15 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x60?text=No+Thumbnail';
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Video Preview</p>
                  <p className="text-xs text-gray-600">ID: {extractedVideoId}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${extractedVideoId}`, '_blank')}
                    className="mt-1"
                  >
                    <Youtube className="w-3 h-3 mr-1" />
                    View on YouTube
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="training, safety, compliance"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple tags with commas
          </p>
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !extractedVideoId}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating Module...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Module
            </div>
          )}
        </Button>
      </form>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">How to use:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Paste a full YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)</li>
          <li>• Or just paste the video ID (e.g., dQw4w9WgXcQ)</li>
          <li>• The system will automatically extract the video ID</li>
          <li>• Preview the video thumbnail before creating</li>
        </ul>
      </div>
    </Card>
  );
};
