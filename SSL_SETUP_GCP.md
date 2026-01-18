# SSL/HTTPS Setup for GCP VM Backend

## Problem
Your frontend (HTTPS on Vercel) cannot call backend (HTTP on GCP VM) due to **Mixed Content Policy**.

Browsers block HTTPS → HTTP requests for security.

## Solution: Set up HTTPS on GCP VM

### Option 1: Using Let's Encrypt (Free SSL Certificate)

**Prerequisites:**
- Domain name pointing to your VM IP (34.131.44.0)
- Ports 80 and 443 open in firewall

**Steps on VM:**

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d api.voxveritas.me

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)

# Test auto-renewal
sudo certbot renew --dry-run

# Certificate will auto-renew every 90 days
```

**Update nginx config:**
Certbot automatically updates nginx, but verify:

```bash
sudo nano /etc/nginx/sites-available/voxveritas
```

Should include:
```nginx
server {
    listen 443 ssl;
    server_name api.voxveritas.me;
    
    ssl_certificate /etc/letsencrypt/live/api.voxveritas.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.voxveritas.me/privkey.pem;
    
    # ... rest of config
}

server {
    listen 80;
    server_name api.voxveritas.me;
    return 301 https://$server_name$request_uri;
}
```

**Restart nginx:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Option 2: Temporary Workaround (Not Recommended)

**Update frontend to use HTTP (local dev only):**

In `frontend/.env.production`:
```env
VITE_API_BASE_URL=http://34.131.44.0
```

⚠️ **This will only work if you:**
1. Visit frontend via HTTP (not HTTPS)
2. OR allow mixed content in browser (insecure)

---

## Recommended Setup

### 1. Set up subdomain for API
Point `api.voxveritas.me` → `34.131.44.0` in your DNS

**DNS Records:**
```
Type: A
Name: api
Value: 34.131.44.0
TTL: 3600
```

### 2. Get SSL certificate
```bash
sudo certbot --nginx -d api.voxveritas.me
```

### 3. Update frontend config

In Vercel environment variables:
```
VITE_API_BASE_URL=https://api.voxveritas.me
```

In `frontend/.env.production`:
```env
VITE_API_BASE_URL=https://api.voxveritas.me
```

### 4. Update backend CORS
Already updated in `index.js` to include your Vercel URLs.

### 5. Redeploy frontend on Vercel
Changes will take effect on next deployment.

---

## Testing

After SSL setup:

```bash
# Test HTTPS endpoint
curl https://api.voxveritas.me/health

# Check SSL certificate
curl -vI https://api.voxveritas.me/health 2>&1 | grep -i ssl
```

**Browser test:**
- Visit: https://crowd-sourced-news-and-fact-checkin.vercel.app
- Open DevTools → Network
- API calls should show `https://api.voxveritas.me` or `https://34.131.44.0`
- No CORS or mixed content errors

---

## Firewall Rules (if not already done)

```bash
# On local machine
gcloud compute firewall-rules create allow-https --allow tcp:443

# On VM
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
sudo ufw enable
```

---

## Certificate Renewal

Certbot auto-renews. To check:
```bash
# List certificates
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Force renewal (if needed)
sudo certbot renew --force-renewal
```

---

## Troubleshooting

**Mixed content error:**
- Backend must be HTTPS
- Update `VITE_API_BASE_URL` to `https://`

**CORS error:**
- Ensure domain is in backend CORS list
- Check nginx is proxying correctly

**Certificate issues:**
- Verify DNS is pointing to VM
- Ensure ports 80/443 are open
- Check certbot logs: `sudo journalctl -u certbot`
