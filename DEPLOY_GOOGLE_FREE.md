# Free Deployment Guide (Google + GitHub Student)

This guide deploys your Next.js + Prisma (SQLite) school website on **Google Cloud always-free** infrastructure using one VM.

## Why this path

- Your app uses Prisma + SQLite.
- SQLite needs persistent disk access.
- Google Cloud Run is not ideal for SQLite persistence.
- **Compute Engine e2-micro VM** (free tier eligible regions) is the safest free option.

---

## 1) Prerequisites

- GitHub account with your project pushed
- Google account
- A debit/credit card for Google Cloud account verification (required by Google; stay within free tier to avoid charges)
- Domain (optional; you can use VM public IP first)

---

## 2) Activate student/free benefits

1. Open GitHub Education pack and claim all available offers.
2. Open Google Cloud and check for any credits/trials on your account.
3. If available, activate credits; if not, continue with always-free resources.

> Keep billing alerts enabled from day one.

---

## 3) Create Google Cloud project safely

1. Create a new project in Google Cloud Console.
2. Attach billing account (required by Google).
3. Set budget alert:
   - Budget amount: very low (example: 5 USD)
   - Alert thresholds: 50%, 90%, 100%
4. Enable APIs:
   - Compute Engine API

---

## 4) Create always-free VM

1. Go to Compute Engine → VM instances → Create instance.
2. Region: choose a free-tier eligible US region (check current Google always-free list).
3. Machine type: `e2-micro`.
4. Boot disk: Ubuntu LTS minimal size (small persistent disk).
5. Firewall:
   - Allow HTTP traffic
   - Allow HTTPS traffic
6. Create VM.

---

## 5) Connect and prepare server

SSH into VM from Cloud Console and run:

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2
```

Verify:

```bash
node -v
npm -v
pm2 -v
nginx -v
```

---

## 6) Deploy project from GitHub

```bash
cd ~
git clone <YOUR_GITHUB_REPO_URL> amarargarh-website
cd amarargarh-website
npm install
```

Create production env file:

```bash
cp .env.example .env
nano .env
```

Set required values in `.env`:

- `DATABASE_URL="file:./prisma/prod.db"`
- `ADMIN_SESSION_SECRET="<very-long-random-secret-32+-chars>"`
- `ADMIN_RECOVERY_SECRET_PASS="<strong-secret-pass>"`
- `NEXT_PUBLIC_SITE_URL="http://<YOUR_VM_PUBLIC_IP>"` (later replace with HTTPS domain)

Run migrations and build:

```bash
npx prisma migrate deploy
npm run build
```

Start app with PM2:

```bash
pm2 start npm --name amarargarh -- start
pm2 save
pm2 startup
```

---

## 7) Configure Nginx reverse proxy

Create config:

```bash
sudo nano /etc/nginx/sites-available/amarargarh
```

Paste:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/amarargarh /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Now open `http://<VM_PUBLIC_IP>`.

---

## 8) Optional HTTPS domain (recommended)

1. Point domain A record to VM public IP.
2. Update Nginx `server_name` with domain.
3. Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

4. Update `NEXT_PUBLIC_SITE_URL` to `https://yourdomain.com` and restart app:

```bash
pm2 restart amarargarh
```

---

## 9) Safe update workflow

Whenever you update code:

```bash
cd ~/amarargarh-website
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart amarargarh
```

---

## 10) Backup plan (important)

SQLite backup command:

```bash
cp ~/amarargarh-website/prisma/prod.db ~/amarargarh-backup-$(date +%F).db
```

Run this before major updates.

---

## 11) Cost safety rules

- Keep only one `e2-micro` VM.
- Use small disk size.
- Stop/delete unused resources.
- Keep billing budget alerts active.
- Check Google always-free region and quota policy before creating resources.

---

## 12) Final go-live checklist

- `npm run lint` passes
- `npm run build` passes
- `npm run test:smoke` passes
- `npm audit --omit=dev` shows zero vulnerabilities
- Admin login works
- Theme toggle + mobile menu + admin section links work on phone
- HTTPS active (if domain enabled)
- Backup taken
