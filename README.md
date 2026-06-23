# 3x-ui Live Connections Map 🌍

Real-time interactive map showing active 3x-ui client connections with geolocation using MapLibre GL JS.

## Features

✅ **Real-time Map** - Live visualization of active connections  
✅ **Clustering** - Supercluster handles hundreds of markers  
✅ **Geolocation** - IP-based location detection with caching  
✅ **Statistics** - Top countries, online count, IPv4/IPv6 split  
✅ **Interactive** - Click markers for connection details  
✅ **Docker Ready** - Single command deployment with docker-compose  
✅ **Lightweight** - MapLibre instead of Leaflet for better performance  

## Quick Start

### 1. Clone & Setup

```bash
cd /Users/artem/repos/3x-ui_clients_map
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env`:
```env
X3UI_URL=http://localhost:8080        # Your 3x-ui address
X3UI_PANEL_PATH=/panel                # Usually /panel
X3UI_API_KEY=your-api-key-here       # Get from 3x-ui panel
```

### 3. Run with Docker Compose

```bash
docker-compose up -d
```

Access the map at: **http://localhost:3000**

## Architecture

```
Homepage (iframe)
    ↓
Map Service (Node.js + Express)
    ├─ REST API: /api/connections
    ├─ Static: public/index.html
    └─ Updates every 10 seconds

3x-ui API
    ↓
Map Service
    ├─ Fetch: /panel/api/server/clientIps
    ├─ Geolocation: ip-api.com (cached 24h)
    └─ Return: JSON with lat/lon/country/city
```

## API Endpoints

### GET /api/connections

Returns current active connections with geolocation:

```json
{
  "online": 47,
  "timestamp": "2024-06-23T10:30:00Z",
  "connections": [
    {
      "ip": "91.123.45.1",
      "country": "Russia",
      "countryCode": "RU",
      "city": "Moscow",
      "lat": 55.7558,
      "lon": 37.6173,
      "asn": "AS8402 OJSC Rostelecom"
    }
  ],
  "countries": {
    "RU": 31,
    "PL": 11,
    "DE": 6
  }
}
```

### GET /health

Health check endpoint.

## Docker Compose Configuration

```yaml
services:
  map-service:
    build: .
    ports:
      - "3000:3000"
    environment:
      X3UI_URL: http://host.docker.internal:8080  # For local 3x-ui
      X3UI_API_KEY: your-key
    restart: unless-stopped
```

### Connecting to 3x-ui

**Local (macOS):** Use `host.docker.internal:8080`  
**Remote:** Use full URL `http://192.168.1.100:8080`  
**Docker Network:** Create network and connect both services

## Local Development

```bash
npm install
npm start        # Production
npm run dev      # With nodemon (requires nodemon)
```

## Embedding in Homepage

Add to Homepage as iframe:

```html
<iframe 
  src="http://localhost:3000"
  width="100%"
  height="600px"
  frameborder="0"
  style="border-radius: 8px;"
></iframe>
```

## Performance Notes

- **Update interval:** 10 seconds (configurable in `public/index.html`)
- **Geolocation cache:** 24 hours per IP
- **Rate limit:** ip-api.com allows 45 requests/minute
- **Browser:** Works in modern browsers (Chrome, Firefox, Safari, Edge)

## Troubleshooting

### No connections showing?

1. Check 3x-ui API key in `.env`
2. Verify 3x-ui is running and accessible
3. Check browser console for errors (F12)
4. Verify firewall allows port 3000

### Map not loading?

- Check if port 3000 is available
- Look at container logs: `docker-compose logs map-service`
- Ensure internet connection (for map tiles and IP-API)

### Rate limited?

- Switch from ip-api to local GeoIP database (MaxMind GeoLite2)
- Increase cache TTL in `server.js`

## Future Improvements

- [ ] MaxMind GeoLite2 for local geolocation (no rate limits)
- [ ] Heatmap mode for better visualization
- [ ] ASN-based coloring
- [ ] RTT/latency heatmap
- [ ] Connection history graph
- [ ] WebSocket for real-time updates
- [ ] Dark/light theme toggle

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** MapLibre GL JS + Supercluster
- **Geolocation:** ip-api.com (can be replaced with MaxMind)
- **Containerization:** Docker + Docker Compose

## License

MIT

## Author

Created for 3x-ui live connection monitoring
