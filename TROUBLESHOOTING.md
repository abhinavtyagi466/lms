# 🔧 Troubleshooting Guide - 500 Internal Server Error

## Issue Description
You're getting 500 Internal Server Error responses when trying to load frontend components like:
- UserLogin.tsx
- MyReports.tsx
- AdminLogin.tsx
- button.tsx
- UserRegister.tsx
- AdminDashboard.tsx
- KPIScoreEntry.tsx

## Root Cause
The 500 errors are likely caused by:
1. **Missing dependencies** - Frontend dependencies not installed
2. **Import issues** - Version-specific imports in components
3. **Tailwind CSS configuration** - PostCSS plugin configuration issues
4. **Vite configuration** - Development server not running properly
5. **Browser caching** - Old cached files causing conflicts

## 🔧 Step-by-Step Solution

### Step 1: Install Dependencies
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# If you get any errors, try:
npm install --force
```

### Step 1.5: Fix Tailwind CSS Issues (if you get PostCSS errors)
If you see errors like "It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin", the configuration has been fixed. Just reinstall dependencies:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Step 2: Clear Browser Cache
1. Open Developer Tools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or use Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

### Step 3: Start Development Server
```bash
# In the frontend directory
npm run dev
```

### Step 4: Check for Import Issues
If you still get errors, check that all imports are correct:

**✅ Correct imports:**
```typescript
import { toast } from 'sonner';
import { Button } from './components/ui/button';
import { useAuth } from './contexts/AuthContext';
```

**❌ Incorrect imports (should be fixed):**
```typescript
import { toast } from 'sonner@2.0.3';  // Wrong
import { Button } from '@radix-ui/react-button@1.0.0';  // Wrong
```

### Step 5: Verify File Structure
Ensure all required files exist:
```
frontend/
├── index.html ✅
├── main.tsx ✅
├── App.tsx ✅
├── index.css ✅
├── vite.config.ts ✅
├── package.json ✅
├── tsconfig.json ✅
├── components/
│   ├── ui/ ✅
│   └── common/ ✅
├── pages/
│   ├── user/ ✅
│   └── admin/ ✅
├── contexts/ ✅
└── services/ ✅
```

### Step 6: Check Console Errors
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for specific error messages
4. Check Network tab for failed requests

## 🚀 Quick Fix Commands

### Option 1: Complete Reset
```bash
# Stop any running servers
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install

# Start development server
npm run dev
```

### Option 2: Use the Batch File
```bash
# From the root directory
start-app.bat
```

### Option 3: Manual Start
```bash
# Terminal 1 - Start backend
cd backend
npm start

# Terminal 2 - Start frontend
cd frontend
npm run dev
```

## 🔍 Common Error Messages & Solutions

### "Module not found"
- **Solution**: Run `npm install` in frontend directory

### "Cannot resolve module"
- **Solution**: Check import paths are correct

### "Port already in use"
- **Solution**: Kill existing processes or change port in vite.config.ts

### "TypeScript errors"
- **Solution**: Check tsconfig.json and fix type issues

## 📞 If Problems Persist

1. **Check Node.js version**: Ensure you have Node.js >= 18.0.0
   ```bash
   node --version
   ```

2. **Check npm version**: Update if needed
   ```bash
   npm --version
   npm install -g npm@latest
   ```

3. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

4. **Delete and recreate node_modules**:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

## ✅ Success Indicators

When everything is working correctly:
- ✅ Frontend server starts on http://localhost:3000
- ✅ Backend server starts on http://localhost:3001
- ✅ No 500 errors in browser console
- ✅ Login page loads without errors
- ✅ All components render properly

## 🆘 Still Having Issues?

If you're still experiencing problems:
1. Check the browser console for specific error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB is running (for backend)
4. Try a different browser or incognito mode
5. Check if antivirus/firewall is blocking the ports

---

**Note**: The 500 errors are typically resolved by installing dependencies and clearing browser cache. The import issues have already been fixed in the codebase.
