#!/bin/bash

# Nginx Permission Fix Script
# Run this script to fix common 403/500 errors

echo "🔧 Fixing Nginx Permissions and Configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Find frontend dist directory
echo -e "${YELLOW}Step 1: Finding frontend build directory...${NC}"
DIST_DIR=$(find / -name "index.html" -path "*/dist/*" 2>/dev/null | head -1 | xargs dirname 2>/dev/null)

if [ -z "$DIST_DIR" ]; then
    echo -e "${RED}❌ Could not find frontend dist directory${NC}"
    echo "Please build the frontend first: cd frontend && npm run build"
    echo "Or manually specify the path:"
    read -p "Enter frontend dist path: " DIST_DIR
fi

if [ ! -d "$DIST_DIR" ]; then
    echo -e "${RED}❌ Directory does not exist: $DIST_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found dist directory: $DIST_DIR${NC}"

# Step 2: Check if index.html exists
if [ ! -f "$DIST_DIR/index.html" ]; then
    echo -e "${RED}❌ index.html not found in $DIST_DIR${NC}"
    echo "Please rebuild the frontend: cd frontend && npm run build"
    exit 1
fi

echo -e "${GREEN}✅ index.html found${NC}"

# Step 3: Find nginx user
echo -e "${YELLOW}Step 2: Detecting nginx user...${NC}"
NGINX_USER=$(grep "^user" /etc/nginx/nginx.conf | awk '{print $2}' | sed 's/;//' | head -1)

if [ -z "$NGINX_USER" ]; then
    # Try common nginx users
    if id "www-data" &>/dev/null; then
        NGINX_USER="www-data"
    elif id "nginx" &>/dev/null; then
        NGINX_USER="nginx"
    else
        echo -e "${RED}❌ Could not determine nginx user${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Nginx user: $NGINX_USER${NC}"

# Step 4: Fix permissions
echo -e "${YELLOW}Step 3: Fixing permissions...${NC}"
sudo chown -R $NGINX_USER:$NGINX_USER "$DIST_DIR"
sudo find "$DIST_DIR" -type d -exec chmod 755 {} \;
sudo find "$DIST_DIR" -type f -exec chmod 644 {} \;

echo -e "${GREEN}✅ Permissions fixed${NC}"

# Step 5: Update nginx config
echo -e "${YELLOW}Step 4: Checking nginx configuration...${NC}"
NGINX_CONFIG="/etc/nginx/sites-enabled/feportal.foxivision.net.conf"

if [ -f "$NGINX_CONFIG" ]; then
    # Check if {{root}} needs to be replaced
    if grep -q "{{root}}" "$NGINX_CONFIG"; then
        echo -e "${YELLOW}⚠️  Found {{root}} placeholder in config${NC}"
        echo "Please manually edit $NGINX_CONFIG"
        echo "Replace: {{root}}"
        echo "With: root $DIST_DIR;"
        read -p "Press Enter to open editor (or Ctrl+C to cancel)..."
        sudo nano "$NGINX_CONFIG"
    else
        echo -e "${GREEN}✅ Config file looks good${NC}"
    fi
else
    echo -e "${RED}❌ Nginx config not found: $NGINX_CONFIG${NC}"
    echo "Please create/update the config file manually"
fi

# Step 6: Test nginx config
echo -e "${YELLOW}Step 5: Testing nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
    
    # Ask to reload
    read -p "Reload nginx? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo systemctl reload nginx
        echo -e "${GREEN}✅ Nginx reloaded${NC}"
    fi
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
    echo "Please fix the errors above and try again"
    exit 1
fi

# Step 7: Verify file access
echo -e "${YELLOW}Step 6: Verifying file access...${NC}"
if sudo -u $NGINX_USER test -r "$DIST_DIR/index.html"; then
    echo -e "${GREEN}✅ Nginx user can read index.html${NC}"
else
    echo -e "${RED}❌ Nginx user cannot read index.html${NC}"
    exit 1
fi

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Configuration:"
echo "  Root directory: $DIST_DIR"
echo "  Nginx user: $NGINX_USER"
echo "  Config file: $NGINX_CONFIG"
echo ""
echo "Next steps:"
echo "1. Make sure backend is running on port 3001"
echo "2. Visit https://feportal.foxivision.net"
echo "3. Check logs if issues persist: sudo tail -f /var/log/nginx/error.log"
echo ""

