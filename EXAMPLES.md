# 3x-ui Live Map - Quick Examples

## Option 1: Run with Docker Compose (Recommended)

### Setup
```bash
cp .env.example .env
# Edit .env with your 3x-ui details
nano .env
```

### Start
```bash
docker-compose up -d
```

### Access
- Map: http://localhost:3000
- API: http://localhost:3000/api/connections
- Logs: `docker-compose logs -f`
- Stop: `docker-compose down`

---

## Option 2: Run with start.sh Script

```bash
chmod +x start.sh
./start.sh
```

---

## Option 3: Local Development

```bash
chmod +x dev.sh
./dev.sh
```

Server runs on http://localhost:3000 with hot-reload.

---

## Option 4: Manual npm

```bash
cp .env.example .env
npm install
npm start
```

---

## Docker Compose Examples

### With Local 3x-ui (macOS)
```bash
export X3UI_URL=http://host.docker.internal:8080
export X3UI_API_KEY=your-api-key
docker-compose up -d
```

### With Remote 3x-ui
```bash
export X3UI_URL=http://192.168.1.100:8080
export X3UI_API_KEY=your-api-key
docker-compose up -d
```

### Build Custom Image
```bash
docker build -t my-map-service .
docker run -p 3000:3000 \
  -e X3UI_URL=http://host.docker.internal:8080 \
  -e X3UI_API_KEY=key \
  my-map-service
```

---

## Embedding in Homepage

```html
<iframe 
  src="http://localhost:3000"
  width="100%"
  height="600px"
  frameborder="0"
  style="border: none; border-radius: 8px;"
></iframe>
```

---

## Troubleshooting Commands

### Check if running
```bash
curl http://localhost:3000/health
```

### View API response
```bash
curl http://localhost:3000/api/connections | jq
```

### View logs
```bash
docker-compose logs -f map-service
```

### Restart service
```bash
docker-compose restart map-service
```

### Full reset
```bash
docker-compose down -v
docker-compose up -d
```

### Test 3x-ui connectivity
```bash
curl -H "Authorization: your-api-key" \
  http://localhost:8080/panel/api/server/clientIps
```

---

## Performance Tips

1. **Increase update interval** - Edit in `public/index.html`: `UPDATE_INTERVAL = 30000` (30 sec)
2. **Clear cache** - Restart service to clear IP geolocation cache
3. **Monitor rate limits** - Check ip-api.com dashboard
4. **Use local GeoIP** - Replace ip-api with MaxMind GeoLite2 (future upgrade)

---

## Port Conflicts?

Use different port:
```bash
docker-compose down
docker run -p 8888:3000 3x-ui-map-service
# or
PORT=8888 npm start
```

---

## More Help

- View logs: `docker-compose logs map-service`
- Check API key: Verify in 3x-ui panel settings
- CORS issues: Should be handled, but check browser console
- Map not loading: Ensure internet for map tiles (OpenStreetMap/Maplibre)
