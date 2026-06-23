require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Конфиг 3x-ui
const X3UI_BASE_URL = process.env.X3UI_URL || 'http://localhost:8080';
const X3UI_PANEL_PATH = process.env.X3UI_PANEL_PATH || '/panel';
const X3UI_API_KEY = process.env.X3UI_API_KEY || 'your-api-key';
const IP_API_BATCH_URL = process.env.IP_API_BATCH_URL || 'http://ip-api.com/batch';

const GEO_CACHE = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа
const IP_API_TIMEOUT = 7000;
const IP_API_BATCH_SIZE = 100;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

function getCachedGeo(ip) {
  const cached = GEO_CACHE.get(ip);

  if (!cached) {
    return null;
  }

  if (Date.now() - cached.timestamp >= CACHE_TTL) {
    GEO_CACHE.delete(ip);
    return null;
  }

  return cached.data;
}

/**
 * Обновить кэш геолокации
 */
function setGeoCache(ip, data) {
  GEO_CACHE.set(ip, {
    data,
    timestamp: Date.now()
  });
}

function chunkArray(items, chunkSize) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Batch-геолокация через ip-api.com
 */
async function fetchGeoBatch(ips) {
  if (!ips.length) {
    return;
  }

  const ipChunks = chunkArray(ips, IP_API_BATCH_SIZE);

  for (const chunk of ipChunks) {
    try {
      const response = await axios.post(IP_API_BATCH_URL, chunk, {
        params: {
          fields: 'status,message,query,country,countryCode,city,lat,lon,as,mobile'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: IP_API_TIMEOUT
      });

      if (!Array.isArray(response.data)) {
        continue;
      }

      for (const item of response.data) {
        const ip = item.query;
        if (!ip) {
          continue;
        }

        if (item.status === 'success') {
          setGeoCache(ip, {
            country: item.country || null,
            countryCode: item.countryCode || null,
            city: item.city || null,
            lat: item.lat,
            lon: item.lon,
            asn: item.as || null,
            isMobile: item.mobile || false
          });
          continue;
        }

        setGeoCache(ip, null);
      }
    } catch (error) {
      console.error(`Geo batch lookup failed for chunk of ${chunk.length} IPs:`, error.message);
    }
  }
}

/**
 * Кэшированная геолокация по IP
 */
async function getGeoLocation(ip) {
  const cached = getCachedGeo(ip);

  if (cached !== null) {
    return cached;
  }

  try {
    await fetchGeoBatch([ip]);
    return getCachedGeo(ip);
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
        'Authorization': `Bearer ${X3UI_API_KEY}`
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

    const uniqueIps = [...new Set(allIps.map((item) => item.ip))];
    const ipsToResolve = uniqueIps.filter((ip) => getCachedGeo(ip) === null);

    if (ipsToResolve.length > 0) {
      console.log(`Resolving ${ipsToResolve.length} new IPs via ip-api batch`);
      await fetchGeoBatch(ipsToResolve);
    }

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
  console.log(`Geo API: ${IP_API_BATCH_URL}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/connections`);
});
