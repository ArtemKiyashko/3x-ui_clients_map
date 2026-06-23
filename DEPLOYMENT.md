# Development & Deployment Guide

## Local Development Setup

### Prerequisites
- Node.js 20+
- npm or yarn
- macOS/Linux/Windows with bash

### Quick Start

```bash
# Clone and enter directory
cd /Users/artem/repos/3x-ui_clients_map

# Copy config
cp .env.example .env

# Edit with your 3x-ui details
nano .env
# X3UI_URL=http://localhost:8080
# X3UI_API_KEY=your-api-key

# Run with auto-reload
chmod +x dev.sh
./dev.sh
```

Server runs at: **http://localhost:3000**

---

## Docker Development

### Using docker-compose (Recommended)

```bash
# Setup
cp .env.example .env
nano .env  # Configure X3UI settings

# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Build custom Docker image

```bash
# Build
docker build -t my-org/3x-ui-map:1.0 .

# Run
docker run -p 3000:3000 \
  -e X3UI_URL=http://host.docker.internal:8080 \
  -e X3UI_API_KEY=your-key \
  my-org/3x-ui-map:1.0

# Push to registry
docker push my-org/3x-ui-map:1.0
```

---

## Production Deployment

### Option 1: Docker Compose (Single Server)

```bash
# On server
git clone <repo> /opt/3x-ui-map
cd /opt/3x-ui-map

# Setup
cp .env.example .env
nano .env

# Start with nginx reverse proxy
docker-compose -f docker-compose.prod.yml up -d

# Verify
curl http://localhost/health
```

### Option 2: Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: 3x-ui-map
spec:
  replicas: 2
  selector:
    matchLabels:
      app: 3x-ui-map
  template:
    metadata:
      labels:
        app: 3x-ui-map
    spec:
      containers:
      - name: map-service
        image: your-registry/3x-ui-map:latest
        ports:
        - containerPort: 3000
        env:
        - name: X3UI_URL
          valueFrom:
            configMapKeyRef:
              name: 3x-ui-config
              key: url
        - name: X3UI_API_KEY
          valueFrom:
            secretKeyRef:
              name: 3x-ui-secrets
              key: api-key
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: 3x-ui-map-service
spec:
  selector:
    app: 3x-ui-map
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
```

Deploy:
```bash
kubectl apply -f deployment.yaml
```

### Option 3: Systemd Service (Direct Node)

```ini
# /etc/systemd/system/3x-ui-map.service
[Unit]
Description=3x-ui Live Connections Map
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/3x-ui-map
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable 3x-ui-map
sudo systemctl start 3x-ui-map
sudo systemctl status 3x-ui-map
```

---

## Environment Variables

```env
# Required
X3UI_URL=http://localhost:8080              # 3x-ui base URL
X3UI_PANEL_PATH=/panel                      # API path (default: /panel)
X3UI_API_KEY=your-api-key                   # 3x-ui API key

# Optional
PORT=3000                                   # Server port
NODE_ENV=production                         # production|development
```

---

## Monitoring & Logging

### Health Check
```bash
curl http://localhost:3000/health
# Response: {"status":"ok","uptime":12345.67}
```

### Docker Logs
```bash
# Follow logs
docker-compose logs -f map-service

# Last 100 lines
docker-compose logs --tail=100 map-service
```

### Systemd Logs
```bash
sudo journalctl -u 3x-ui-map -f
```

---

## Updating

### Docker
```bash
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Direct Node
```bash
git pull
npm install
systemctl restart 3x-ui-map
```

---

## Performance Tuning

### Increase Update Frequency
Edit `public/index.html`:
```javascript
const UPDATE_INTERVAL = 5000;  // 5 seconds instead of 10
```

### Adjust Clustering
Edit `public/index.html`:
```javascript
let cluster = new Supercluster({ 
  radius: 50,      // Smaller = more clusters
  maxZoom: 18      // Larger = cluster further when zoomed
});
```

### Caching
Edit `server.js`:
```javascript
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;  // 7 days
```

---

## Troubleshooting

### Container won't start
```bash
docker-compose logs map-service
# Check .env file configuration
```

### High CPU usage
- Reduce UPDATE_INTERVAL in public/index.html
- Check if 3x-ui API is responding slowly
- Monitor with: `docker stats`

### Memory leak
- Restart container: `docker-compose restart map-service`
- Check for memory leaks in logs
- Consider running with memory limit

### API rate limited
- Reduce UPDATE_INTERVAL
- Increase CACHE_TTL
- Switch to local GeoIP database (MaxMind)

---

## Backup & Restore

Currently no database, all data is ephemeral. The cache is in-memory only.

For persistence (future):
```bash
# Volume for caching
docker-compose exec map-service mkdir -p /app/cache
```

---

## Security

### Docker Security
- Run as non-root (already configured)
- Use read-only filesystem where possible
- Limit resource usage:

```yaml
services:
  map-service:
    resources:
      limits:
        cpus: '0.5'
        memory: 256M
      reservations:
        cpus: '0.25'
        memory: 128M
```

### API Key Management
- Never commit `.env` file
- Use Docker secrets for Swarm
- Use Kubernetes secrets for K8s
- Rotate keys regularly

---

## Scaling

### Horizontal Scaling with Load Balancer
```yaml
version: '3.8'
services:
  map-service-1:
    # ... same config
    ports: ["3001:3000"]
  
  map-service-2:
    # ... same config
    ports: ["3002:3000"]

  nginx:
    # Distribute across both services
```

### Vertical Scaling
Increase resource limits in docker-compose.

---

## Support & Issues

- Check logs: `docker-compose logs`
- Verify 3x-ui connectivity
- Test API: `curl -H "Authorization: key" http://3x-ui/panel/api/server/clientIps`
- Check browser console (F12) for client-side errors
