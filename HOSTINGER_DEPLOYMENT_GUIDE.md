# CreditGenAI - Hostinger Deployment Guide

## Quick Deployment to Hostinger (ZIP Upload)

---

## **Step 1: Create ZIP File**

### **Files to Include** (Only these files from your project):

```
package.json
package-lock.json
index.html
firebase-applet-config.json
firebase-blueprint.json
firestore.rules
server.ts
tsconfig.json
vite.config.ts
src/                    (entire folder)
dist/                   (after running npm run build)
dist-server/            (after running npm run build)
```

### **Command to Create ZIP:**

```powershell
cd c:\Users\ashh\Downloads\CreditGenAI_V2
Compress-Archive -Path 'package.json', 'package-lock.json', 'index.html', 'firebase-applet-config.json', 'firebase-blueprint.json', 'firestore.rules', 'server.ts', 'tsconfig.json', 'vite.config.ts', 'src', 'dist', 'dist-server' -DestinationPath 'CreditGenAI.zip' -Force
```

**ZIP File Size:** ~1-2 MB

**Important:** Do **not** include `.env`, `node_modules`, `.git`, or editor folders in the ZIP. Add environment variables directly in Hostinger.

---

## **Step 2: Upload ZIP to Hostinger**

1. Login to Hostinger hPanel
2. Go to **File Manager**
3. Click **Upload** button
4. Select your `CreditGenAI.zip` file
5. Upload (do NOT extract)

---

## **Step 3: Hostinger Build Configuration**

### **These are your settings (same as before):**

| Setting | Value |
|---------|-------|
| **Framework preset** | Express.js |
| **Node version** | 20.x |
| **Root directory** | `/` |
| **Build command** | `npm run build` |
| **Package manager** | npm |
| **Output directory** | `dist` |
| **Entry file** | `dist-server/server.js` |

---

## **Step 4: Environment Variables**

Add all your variables from `.env` in Hostinger settings:

```
VITE_GEMINI_API_KEY = your-key
ADMIN_EMAIL = admin@example.com
DATABASE_URL = your-url
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASS = your-password
SMTP_FROM_NAME = CreditGenAI
SMTP_FROM_EMAIL = your-email@gmail.com
TWILIO_ACCOUNT_SID = your-sid
TWILIO_AUTH_TOKEN = your-token
TWILIO_WHATSAPP_NUMBER = +1234567890
```

---

## **Step 5: Deploy**

1. Click **"Save and redeploy"**
2. Wait 5-10 minutes for build
3. Check build logs for success

---

## **Step 6: Firebase Setup**

Add your Hostinger domain to Firebase:

1. Go to Firebase Console
2. **Authentication** → **Settings** → **Authorized domains**
3. Add domain: `wheat-crow-184207.hostingersite.com`
4. **Save**

---

## **Done!** 🎉

Your app is now deployed!
