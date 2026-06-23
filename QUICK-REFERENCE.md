📋 PROJECT STRUCTURE
===================

3x-ui_clients_map/
├── 📄 README.md                 # Main documentation
├── 📄 EXAMPLES.md               # Quick start examples
├── 📄 DEPLOYMENT.md             # Production deployment guide
│
├── 🐳 Docker Files
│   ├── Dockerfile               # Multi-stage Alpine image
│   ├── .dockerignore            # Files to exclude from Docker build
│   ├── docker-compose.yml       # Development compose setup
│   └── docker-compose.prod.yml  # Production with nginx
│
├── 📝 Config Files
│   ├── .env.example             # Environment variables template
│   ├── .gitignore               # Git ignore rules
│   ├── nginx.conf               # Nginx reverse proxy config
│   └── package.json             # Node.js dependencies
│
├── 🚀 Server
│   └── server.js                # Express API + static server
│
├── 🌐 Frontend
│   └── public/
│       └── index.html           # MapLibre + Supercluster map
│
└── 📜 Scripts
    ├── start.sh                 # Docker Compose launcher
    └── dev.sh                   # Local development launcher


🎯 QUICK START
==============

1️⃣  DOCKER (Recommended)
   cp .env.example .env
   nano .env                      # Set X3UI_URL and API_KEY
   docker-compose up -d
   → Map at http://localhost:3000

2️⃣  LOCAL DEVELOPMENT
   cp .env.example .env
   nano .env
   chmod +x dev.sh
   ./dev.sh
   → Map at http://localhost:3000

3️⃣  PRODUCTION (with nginx)
   docker-compose -f docker-compose.prod.yml up -d
   → Map at http://localhost (or your domain)


📦 TECH STACK
=============

Backend:     Node.js 20 + Express
Frontend:    MapLibre GL JS + Supercluster
Geolocation: ip-api.com (with 24h cache)
Container:   Docker + Docker Compose
Proxy:       Nginx (production)


🌍 FEATURES
===========

✅ Real-time interactive map with MapLibre GL
✅ Clustered markers with Supercluster
✅ Geolocation caching (24 hours)
✅ Live statistics (online count, top countries)
✅ IPv4/IPv6 detection
✅ ASN (network) information
✅ Connection details in marker popups
✅ Mobile responsive design
✅ Dark theme optimized
✅ Docker containerized
✅ Production-ready with nginx
✅ Health checks & monitoring


📡 API ENDPOINTS
================

GET /                          # Main map page
GET /api/connections           # JSON with active connections
GET /health                    # Health check


🔧 CONFIGURATION
================

Environment Variables:
  X3UI_URL          - Base URL of 3x-ui (default: http://localhost:8080)
  X3UI_PANEL_PATH   - Panel API path (default: /panel)
  X3UI_API_KEY      - API authentication key (required)
  PORT              - Server port (default: 3000)
  NODE_ENV          - production|development


⚡ PERFORMANCE
==============

Update Interval:       10 seconds (configurable)
Geolocation Cache:     24 hours
Clustering Radius:     80 pixels
Max Markers:           Limited by browser
Rate Limit (ip-api):   45 requests/minute (cached)


🐛 TROUBLESHOOTING
==================

No connections showing?
  → Check X3UI_API_KEY in .env
  → Verify X3UI is running: curl http://localhost:8080/health
  → Check container logs: docker-compose logs map-service

Rate limited?
  → Increase cache TTL in server.js
  → Reduce UPDATE_INTERVAL in public/index.html
  → Consider MaxMind GeoLite2 (offline geolocation)

Port already in use?
  → Change in docker-compose.yml: ports: ["8080:3000"]
  → Or: PORT=8080 npm start


📚 DOCUMENTATION FILES
====================

README.md          - Complete feature documentation
EXAMPLES.md        - Multiple startup examples
DEPLOYMENT.md      - Production deployment guides
nginx.conf         - Reverse proxy configuration
This file          - Quick reference


🚀 DEPLOYMENT OPTIONS
====================

1. Docker Compose (Single server)     ← RECOMMENDED
2. Kubernetes (Production cluster)
3. Systemd service (Direct on VPS)
4. Nginx reverse proxy (for scaling)
5. Docker Swarm (For clusters)


✨ NEXT STEPS
=============

1. Copy .env.example to .env
2. Edit .env with your 3x-ui credentials
3. Run: docker-compose up -d
4. Visit: http://localhost:3000
5. (Optional) Embed in Homepage as iframe


📞 SUPPORT
==========

For issues:
  1. Check docker logs: docker-compose logs
  2. Verify 3x-ui connectivity
  3. Test API directly: curl /api/connections
  4. Check browser console (F12)
  5. Review EXAMPLES.md and DEPLOYMENT.md


💾 FILE PURPOSES
================

server.js          - Fetches client IPs from 3x-ui, geolocation, serves API
public/index.html  - Frontend map with MapLibre GL and Supercluster
Dockerfile         - Containerization with Alpine Linux
docker-compose.yml - Local development setup
docker-compose.prod.yml - Production with nginx reverse proxy
nginx.conf         - Reverse proxy, compression, caching
.env.example       - Configuration template
package.json       - Node.js dependencies


🎨 CUSTOMIZATION
================

Change update frequency:   Edit UPDATE_INTERVAL in public/index.html
Change map tiles:          Modify style URL in initMap() function
Change clustering:         Adjust Supercluster options
Change colors:             Modify getCountryColor() function
Add new statistics:        Extend /api/connections response


⚙️ SYSTEM REQUIREMENTS
====================

Docker method:   Docker + Docker Compose only
Local method:    Node.js 20+, npm
Minimal:         100MB disk, 256MB RAM
Production:      500MB disk, 512MB RAM


✅ VERIFICATION CHECKLIST
========================

□ .env file created and configured
□ Docker/npm installed
□ Port 3000 available
□ 3x-ui API accessible
□ Container/server starts without errors
□ http://localhost:3000 loads in browser
□ Map displays and updates
□ /api/connections returns valid JSON
