require('dotenv').config();
const express = require('express');
const axios = require('axios');
const maxmind = require('maxmind');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Конфиг 3x-ui
const X3UI_BASE_URL = process.env.X3UI_URL || 'http://localhost:8080';
const X3UI_PANEL_PATH = process.env.X3UI_PANEL_PATH || '/panel';
const X3UI_API_KEY = process.env.X3UI_API_KEY || 'your-api-key';
const GEOIP_DB_PATH = process.env.GEOIP_DB_PATH || path.join(__dirname, 'data', 'GeoLite2-City.mmdb');

const GEO_CACHE = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа
let geoReaderPromise;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

function getGeoReader() {
  if (!geoReaderPromise) {
    geoReaderPromise = maxmind.open(GEOIP_DB_PATH);
  }

  return geoReaderPromise;
}

/**
 * Кэшированная геолокация по IP
 */
async function getGeoLocation(ip) {
  const cached = GEO_CACHE.get(ip);
  
  // Если в кэше и не истек TTL
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const reader = await getGeoReader();
    const result = reader.get(ip);

    if (result?.location?.latitude != null && result?.location?.longitude != null) {
      const data = {
        country: result.country?.names?.en || null,
        countryCode: result.country?.iso_code || null,
        city: result.city?.names?.en || null,
        lat: result.location.latitude,
        lon: result.location.longitude,
        asn: null,
        isMobile: false
      };

      GEO_CACHE.set(ip, {
        data,
        timestamp: Date.now()
      });

      return data;
    }
  } catch (error) {
    console.error(`Geo lookup failed for ${ip}:`, error.message);
  }

  return null;
}

/**
 * Получить список подключений из 3x-ui
 */
async function getActiveConnections() {
  try {
    const url = `${X3UI_BASE_URL}${X3UI_PANEL_PATH}/api/server/clientIps`;

    console.log(`[${new Date().toISOString()}] Fetching connections from ${url}`);

    const response = await axios.get(url, {
      headers: {
        'Authorization': X3UI_API_KEY
      },
      timeout: 10000
    });

    // Ответ имеет формат: { success: true, msg: "", obj: [...] }
    // где obj это массив клиентов с их IP адресами
    const clientsData = response.data?.obj || [];

    const allIps = [];
    for (const client of clientsData) {
      if (!Array.isArray(client.ips)) {
        continue;
      }

      for (const ipEntry of client.ips) {
        if (!ipEntry?.ip) {
          continue;
        }

        allIps.push({
          ip: ipEntry.ip,
          clientName: client.clientEmail,
          timestamp: ipEntry.timestamp
        });
      }
    }

    console.log(`Found ${allIps.length} total IP addresses from ${clientsData.length} clients`);

    const connectionsWithGeo = await Promise.all(
      allIps.map(async (item) => {
        const geo = await getGeoLocation(item.ip);
        return {
          ...item,
          ...geo
        };
      })
    );

    return connectionsWithGeo.filter((connection) => connection.country);
  } catch (error) {
    console.error('Failed to get active connections:', error.message);
    return [];
  }
}

/**
 * API: Получить текущие подключения
 */
app.get('/api/connections', async (req, res) => {
  const connections = await getActiveConnections();
  res.json({
    online: connections.length,
    timestamp: new Date().toISOString(),
    connections,
    countries: connections.reduce((acc, connection) => {
      acc[connection.countryCode] = (acc[connection.countryCode] || 0) + 1;
      return acc;
    }, {})
  });
});

/**
 * Главная страница (карта)
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

/**
 * Стартуем сервер
 */
app.listen(PORT, () => {
  console.log(`Map service running on http://localhost:${PORT}`);
  console.log(`3x-ui API: ${X3UI_BASE_URL}${X3UI_PANEL_PATH}`);
  console.log(`GeoIP DB: ${GEOIP_DB_PATH}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/connections`);
});
