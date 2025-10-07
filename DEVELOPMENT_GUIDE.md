# 🔧 Development Guide - Auto-Reload Setup

## समस्या (Problem)
जब भी code में changes करते हो, तो manually `pm2 restart all` करना पड़ता था। अब auto-reload enable हो गया है! 🎉

When you make code changes, you had to manually run `pm2 restart all`. Now auto-reload is enabled! 🎉

---

## 🚀 Development के लिए (For Development)

### विकल्प 1: PM2 के साथ Auto-Reload (Recommended)

```bash
# Start development server with PM2 watch mode
./start-dev.sh
```

**फायदे (Benefits):**
- ✅ Auto-reload on file changes
- ✅ Process management
- ✅ Logs को track कर सकते हो
- ✅ Server crash होने पर auto-restart

**Commands:**
```bash
# Status देखो
pm2 status

# Logs देखो
pm2 logs edutech-backend-dev

# Stop करो
pm2 stop edutech-backend-dev

# Restart करो (normally auto होगा)
pm2 restart edutech-backend-dev

# सब PM2 processes बंद करो
pm2 delete all
```

---

### विकल्प 2: Nodemon के साथ (Simple & Fast)

```bash
# Start development server with Nodemon
./start-dev-nodemon.sh
```

या directly backend folder में:
```bash
cd backend
npm run dev
```

**फायदे (Benefits):**
- ✅ Very simple और lightweight
- ✅ Auto-reload on file changes
- ✅ No process management needed
- ✅ Ctrl+C से directly stop

---

## 🏭 Production के लिए (For Production)

```bash
# Production mode (NO auto-reload)
./start.sh
```

या PM2 से directly:
```bash
cd backend
pm2 start ecosystem.config.js --only edutech-backend-prod
```

**Production Features:**
- ❌ Auto-reload disabled (stability के लिए)
- ✅ Cluster mode - 2 instances
- ✅ Auto-restart on crash
- ✅ Better performance

---

## 📝 Auto-Reload कैसे काम करता है?

### Development Mode में:
1. आप file save करो (Ctrl+S)
2. PM2/Nodemon automatically detect करे
3. Server automatically restart हो जाए
4. Changes तुरंत reflect हो जाएं

**कौन सी files को watch करता है:**
- ✅ सभी `.js` files
- ✅ सभी `.json` files
- ✅ Routes, models, services, middleware

**कौन सी files को ignore करता है:**
- ❌ `node_modules/`
- ❌ `uploads/`
- ❌ `logs/`
- ❌ `*.log` files
- ❌ `tests/`

---

## 🔍 Troubleshooting

### 1. अगर auto-reload काम नहीं कर रहा:

```bash
# PM2 को delete करो और fresh start करो
pm2 delete all
./start-dev.sh
```

### 2. Port already in use error:

```bash
# सभी PM2 processes बंद करो
pm2 delete all

# या specific port पर running process को kill करो
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# Linux/Mac:
lsof -ti:5000 | xargs kill -9
```

### 3. Changes detect नहीं हो रहे:

```bash
# Check PM2 logs
pm2 logs

# Restart with flush
pm2 restart edutech-backend-dev --update-env
```

### 4. बहुत ज्यादा restarts हो रहे हैं:

यह अक्सर तब होता है जब:
- File save होने पर infinite loop बन जाता है
- Log files या temp files लगातार update हो रहे हैं

Solution: ecosystem.config.js में `ignore_watch` array check करो

---

## ⚡ Quick Reference

| Command | Purpose | Auto-Reload? |
|---------|---------|--------------|
| `./start-dev.sh` | Development with PM2 | ✅ Yes |
| `./start-dev-nodemon.sh` | Development with Nodemon | ✅ Yes |
| `./start.sh` | Production | ❌ No |
| `cd backend && npm run dev` | Dev (Nodemon) | ✅ Yes |
| `cd backend && npm start` | Basic start | ❌ No |
| `pm2 restart all` | ⚠️ NOT NEEDED NOW! | - |

---

## 💡 Pro Tips

1. **Development में हमेशा** `./start-dev.sh` या `./start-dev-nodemon.sh` **use करो**
2. **Production में** `./start.sh` use करो
3. PM2 की power chahiye तो → `start-dev.sh`
4. Simple और fast chahiye तो → `start-dev-nodemon.sh`
5. Logs देखने के लिए: `pm2 logs` या terminal में directly देखो

---

## 🎯 अब क्या करना है?

1. **सभी existing PM2 processes बंद करो:**
   ```bash
   pm2 delete all
   ```

2. **Development mode में start करो:**
   ```bash
   ./start-dev.sh
   ```

3. **Code में कुछ change करो और save करो** - automatic restart होगा! 🎉

4. **Production के लिए:**
   ```bash
   pm2 delete all
   ./start.sh
   ```

---

## 📧 अगर फिर भी problem हो तो:

- PM2 logs check करो: `pm2 logs`
- PM2 status check करो: `pm2 status`
- Fresh start: `pm2 delete all && ./start-dev.sh`

Happy Coding! 🚀

