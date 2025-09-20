# YouTube-Based Module Management & Tracking System

A complete React + Node.js + TypeScript system for managing YouTube-based training modules with real-time progress tracking.

## 🎯 System Overview

This system provides:
- **Admin Interface**: Create and manage YouTube modules by pasting links
- **User Interface**: Watch YouTube videos with progress tracking
- **Progress Tracking**: Real-time progress updates every 5 seconds
- **Statistics**: Detailed user progress analytics and completion tracking

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **AdminModuleForm**: YouTube link input with automatic video ID extraction
- **YouTubePlayer**: IFrame Player API integration with progress tracking
- **UserStats**: Progress statistics and completion tracking
- **ModuleManagement**: Admin interface for module management

### Backend (Node.js + Express + MongoDB)
- **Progress Model**: Tracks user video progress
- **Progress API**: Handles progress updates and retrieval
- **Module API**: Manages YouTube modules
- **Authentication**: JWT-based user authentication

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
npm start
```

The backend will run on `http://localhost:3001`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000`

### 3. Database Setup

Ensure MongoDB is running and update the connection string in `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/youtube-learning
```

## 📋 API Endpoints

### Progress Tracking
- `POST /api/progress` - Update video progress
- `GET /api/progress/:userId` - Get user progress stats
- `GET /api/progress/:userId/:videoId` - Get specific video progress

### Module Management
- `POST /api/modules` - Create new module
- `GET /api/modules` - List all modules
- `GET /api/modules/:id` - Get specific module
- `DELETE /api/modules/:id` - Delete module

## 🎥 YouTube Integration

### Video ID Extraction
The system automatically extracts YouTube video IDs from various URL formats:
- Full URLs: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Short URLs: `https://youtu.be/dQw4w9WgXcQ`
- Embed URLs: `https://www.youtube.com/embed/dQw4w9WgXcQ`
- Direct IDs: `dQw4w9WgXcQ`

### IFrame Player API
Uses the official YouTube IFrame Player API for:
- Progress tracking every 5 seconds
- Playback controls (play, pause, volume, fullscreen)
- Real-time state management
- Error handling

## 📊 Progress Tracking

### Data Structure
```typescript
interface Progress {
  userId: string;
  videoId: string;
  currentTime: number;  // Current playback position in seconds
  duration: number;     // Total video duration in seconds
  lastUpdated: Date;    // Last progress update timestamp
}
```

### Tracking Frequency
- Progress is sent to the backend every 5 seconds while playing
- Data includes current time, duration, user ID, and video ID
- Progress is stored uniquely per user-video combination

### Completion Logic
- Videos are considered "completed" when 90% or more is watched
- Progress percentage is calculated as `(currentTime / duration) * 100`

## 🎨 Components

### AdminModuleForm
- YouTube link input with validation
- Automatic video ID extraction
- Video thumbnail preview
- Form validation and error handling

### YouTubePlayer
- Full YouTube IFrame Player API integration
- Custom controls overlay
- Progress tracking and display
- Real-time progress updates

### UserStats
- Progress statistics dashboard
- Video completion tracking
- Detailed progress table
- Summary metrics (total videos, completed, average progress)

## 🗄️ Database Schema

### Module Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  ytVideoId: String,      // YouTube video ID
  tags: [String],
  status: String,          // 'draft' or 'published'
  createdBy: ObjectId,     // Reference to User
  createdAt: Date,
  updatedAt: Date
}
```

### Progress Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,        // Reference to User
  videoId: String,         // YouTube video ID
  currentTime: Number,     // Current playback position
  duration: Number,        // Total video duration
  lastUpdated: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Configuration

### Environment Variables
```env
# Backend
PORT=3001
MONGODB_URI=mongodb://localhost:27017/youtube-learning
JWT_SECRET=your-jwt-secret
CLIENT_ORIGIN=http://localhost:3000

# Frontend
VITE_API_BASE_URL=http://localhost:3001/api
```

### CORS Configuration
The backend is configured to allow cross-origin requests from the frontend during development.

## 🧪 Testing

### Demo Page
Access `/admin/youtube-demo` to see all components working together:
- Module creation form
- YouTube player with progress tracking
- User statistics display
- System features overview

### Sample Data
The demo includes a sample module with video ID `dQw4w9WgXcQ` for testing.

## 📱 Features

### Admin Features
- ✅ Paste YouTube links or video IDs
- ✅ Automatic video ID extraction
- ✅ Video thumbnail preview
- ✅ Module management (create, delete, update)
- ✅ Status management (draft/published)
- ✅ Tag management

### User Features
- ✅ YouTube IFrame Player API integration
- ✅ Progress tracking every 5 seconds
- ✅ Real-time progress updates
- ✅ Detailed progress statistics
- ✅ Video completion tracking
- ✅ Custom player controls

### Technical Features
- ✅ TypeScript support
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states
- ✅ Toast notifications
- ✅ Progress persistence

## 🚨 Important Notes

### YouTube API Quotas
- The system uses the YouTube IFrame Player API (no API key required)
- No daily quota limits for basic playback
- Thumbnail images are served directly from YouTube

### Progress Accuracy
- Progress is tracked every 5 seconds while playing
- Paused videos don't send progress updates
- Progress is calculated based on current time vs. duration

### Browser Compatibility
- Requires modern browsers with ES6+ support
- YouTube IFrame Player API compatibility
- Responsive design for mobile and desktop

## 🔮 Future Enhancements

- [ ] Batch progress updates
- [ ] Offline progress caching
- [ ] Advanced analytics dashboard
- [ ] Video playlist support
- [ ] Progress export functionality
- [ ] Mobile app support

## 📞 Support

For questions or issues:
1. Check the demo page for working examples
2. Review the API documentation
3. Check browser console for errors
4. Verify MongoDB connection
5. Ensure all environment variables are set

## 📄 License

This project is part of the E-Learning Platform for Field Executives.
