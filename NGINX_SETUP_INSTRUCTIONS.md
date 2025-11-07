# Nginx Configuration Setup Instructions

## Issue Fixed:
- ✅ Removed duplicate `root` directives from location blocks (causes "invalid number of arguments" error)
- ✅ Added favicon handling to prevent 500 errors
- ✅ Fixed location block order for proper SPA routing

## Setup Steps:

### 1. Replace Placeholders

Edit the nginx config file and replace these placeholders:

```nginx
# Line 17: Replace {{root}} with actual path
# Example:
root /var/www/feportal/dist;

# Or if using a different path:
root /home/username/feportal/frontend/dist;
```

### 2. Check Root Directory

Make sure:
- The root directory exists
- The directory contains `index.html` (from React build)
- The directory has correct permissions:
  ```bash
  sudo chown -R www-data:www-data /var/www/feportal/dist
  sudo chmod -R 755 /var/www/feportal/dist
  ```

### 3. Test Configuration

```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

### 4. Verify Permissions

If you get 403 Forbidden errors:

```bash
# Check if directory exists
ls -la /var/www/feportal/dist

# Check permissions
ls -ld /var/www/feportal/dist

# Fix permissions if needed
sudo chown -R www-data:www-data /var/www/feportal/dist
sudo chmod -R 755 /var/www/feportal/dist

# Make sure index.html exists and is readable
ls -la /var/www/feportal/dist/index.html
sudo chmod 644 /var/www/feportal/dist/index.html
```

### 5. Check Nginx Error Logs

If issues persist, check logs:

```bash
# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Check access log
sudo tail -f /var/log/nginx/access.log
```

### 6. Verify Frontend Build

Make sure you have built the React app:

```bash
cd frontend
npm run build

# Verify build output
ls -la dist/
# Should see: index.html, assets/, etc.
```

## Common Issues:

### 403 Forbidden
- **Cause**: Wrong permissions or root path doesn't exist
- **Fix**: Check directory permissions and ensure root path is correct

### 500 Internal Server Error
- **Cause**: Missing files or invalid configuration
- **Fix**: Check nginx error logs, verify root directory exists

### Favicon 500 Error
- **Cause**: Missing favicon.ico file
- **Fix**: Added specific location block for favicon that falls back to index.html

## File Structure Expected:

```
/var/www/feportal/dist/
├── index.html
├── assets/
│   ├── index-*.js
│   ├── index-*.css
│   └── ...
└── favicon.ico (optional)
```

## After Setup:

1. Test the configuration: `sudo nginx -t`
2. Reload nginx: `sudo systemctl reload nginx`
3. Visit: `https://feportal.foxivision.net`
4. Check browser console for any errors
5. Verify API calls work: Check Network tab for `/api` requests

