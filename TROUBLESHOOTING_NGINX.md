# Nginx Troubleshooting Guide - 403 & 500 Errors

## Current Errors:
- ❌ `403 Forbidden` - GET https://feportal.foxivision.net/
- ❌ `500 Internal Server Error` - GET https://feportal.foxivision.net/favicon.ico

## Step-by-Step Fix:

### 1. **CRITICAL: Replace {{root}} Placeholder**

Edit `/etc/nginx/sites-enabled/feportal.foxivision.net.conf`:

```nginx
# Find line with {{root}} and replace with actual path
# BEFORE:
{{root}}

# AFTER (example - adjust to your actual path):
root /var/www/feportal/dist;
```

**Find your actual dist directory:**
```bash
# Find where frontend was built
find / -name "index.html" -path "*/dist/*" 2>/dev/null

# Or check common locations:
ls -la /var/www/
ls -la /home/*/feportal/frontend/dist/
ls -la /opt/feportal/frontend/dist/
```

### 2. **Verify Root Directory Exists**

```bash
# Check if directory exists
ROOT_PATH="/var/www/feportal/dist"  # Change to your actual path
ls -la $ROOT_PATH

# Should see:
# - index.html
# - assets/ directory
```

### 3. **Fix Permissions (403 Error Fix)**

```bash
# Set correct ownership (nginx user is usually www-data or nginx)
sudo chown -R www-data:www-data /var/www/feportal/dist

# Set correct permissions
sudo chmod -R 755 /var/www/feportal/dist
sudo find /var/www/feportal/dist -type f -exec chmod 644 {} \;
sudo find /var/www/feportal/dist -type d -exec chmod 755 {} \;

# Verify index.html is readable
sudo chmod 644 /var/www/feportal/dist/index.html
ls -la /var/www/feportal/dist/index.html
```

### 4. **Check Nginx User**

```bash
# Find nginx user
grep "^user" /etc/nginx/nginx.conf

# Usually: user www-data; or user nginx;

# Make sure that user can read the directory
sudo -u www-data ls /var/www/feportal/dist/
# OR
sudo -u nginx ls /var/www/feportal/dist/
```

### 5. **Test Nginx Configuration**

```bash
# Test configuration syntax
sudo nginx -t

# If you see errors, check:
# - Is {{root}} replaced?
# - Does the path exist?
# - Are permissions correct?
```

### 6. **Check Error Logs**

```bash
# Watch error log in real-time
sudo tail -f /var/log/nginx/error.log

# Check recent errors
sudo tail -n 50 /var/log/nginx/error.log

# Look for:
# - "open() failed (13: Permission denied)"
# - "No such file or directory"
# - "directory index of ... is forbidden"
```

### 7. **Fix SELinux (if applicable)**

```bash
# Check if SELinux is enabled
getenforce

# If enabled and causing issues:
sudo setsebool -P httpd_read_user_content 1
sudo chcon -R -t httpd_sys_content_t /var/www/feportal/dist/
```

### 8. **Reload Nginx**

```bash
# After fixing, reload nginx
sudo nginx -t  # Test first
sudo systemctl reload nginx

# Or restart if reload doesn't work
sudo systemctl restart nginx
```

### 9. **Verify Files Are Accessible**

```bash
# Test as nginx user
sudo -u www-data cat /var/www/feportal/dist/index.html

# Should show HTML content, not permission denied
```

## Common Issues & Solutions:

### Issue 1: "403 Forbidden"
**Causes:**
- Root directory doesn't exist
- Wrong permissions
- Wrong nginx user
- SELinux blocking access

**Solutions:**
```bash
# Check directory exists
ls -la /var/www/feportal/dist

# Fix permissions
sudo chown -R www-data:www-data /var/www/feportal/dist
sudo chmod -R 755 /var/www/feportal/dist

# Check nginx user
grep "^user" /etc/nginx/nginx.conf
```

### Issue 2: "500 Internal Server Error"
**Causes:**
- Missing index.html
- Invalid nginx configuration
- Error in error_page directive

**Solutions:**
```bash
# Check if index.html exists
ls -la /var/www/feportal/dist/index.html

# Rebuild frontend if missing
cd /path/to/frontend
npm run build

# Check nginx error log
sudo tail -f /var/log/nginx/error.log
```

### Issue 3: "{{root}} not replaced"
**Solution:**
```bash
# Edit config file
sudo nano /etc/nginx/sites-enabled/feportal.foxivision.net.conf

# Find and replace {{root}} with actual path
# Save and test
sudo nginx -t
```

## Quick Debugging Commands:

```bash
# 1. Find frontend build directory
find / -name "index.html" -path "*/dist/*" 2>/dev/null | head -5

# 2. Check nginx config
sudo nginx -t

# 3. Check error logs
sudo tail -n 100 /var/log/nginx/error.log | grep -i "error\|permission\|denied"

# 4. Test file access
sudo -u www-data ls -la /var/www/feportal/dist/

# 5. Check if backend is running
curl http://127.0.0.1:3001/api/health || echo "Backend not running on port 3001"

# 6. Check nginx process
ps aux | grep nginx

# 7. Check nginx user
id www-data
id nginx
```

## Final Checklist:

- [ ] `{{root}}` replaced with actual path
- [ ] Root directory exists
- [ ] `index.html` exists in root directory
- [ ] Permissions are correct (755 for dirs, 644 for files)
- [ ] Ownership is correct (www-data:www-data or nginx:nginx)
- [ ] Nginx config test passes (`sudo nginx -t`)
- [ ] Nginx reloaded/restarted
- [ ] Error logs checked
- [ ] Backend is running on port 3001

## Still Having Issues?

1. **Share error logs:**
   ```bash
   sudo tail -n 50 /var/log/nginx/error.log
   ```

2. **Share nginx config:**
   ```bash
   sudo cat /etc/nginx/sites-enabled/feportal.foxivision.net.conf | grep -A 2 "root"
   ```

3. **Share directory listing:**
   ```bash
   ls -la /var/www/feportal/dist/
   ```

4. **Share nginx user:**
   ```bash
   grep "^user" /etc/nginx/nginx.conf
   ```

