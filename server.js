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

// Для простоты используем MaxMind или ip-api (можно заменить позже)
// Пока используем ip-api.com с кэшем
const GEO_CACHE = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

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
    // Используем ip-api.com (бесплатно, 45 запросов/мин)
    // Для production лучше использовать MaxMind GeoLite2
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      params: {
        fields: 'status,country,countryCode,city,lat,lon,as,mobile'
      },
      timeout: 5000
    });

    if (response.data.status === 'success') {
      const data = {
        country: response.data.country,
        countryCode: response.data.countryCode,
        city: response.data.city,
        lat: response.data.lat,
        lon: response.data.lon,
        asn: response.data.as,
        isMobile: response.data.mobile || false
      };

      // Кэшируем
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
 * Получить список активных подключений из 3x-ui
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

    const ips = response.data || [];
    console.log(`Found ${ips.length} active connections`);

    // Получаем геоданные для каждого IP параллельно
    const connectionsWithGeo = await Promise.all(
      ips.map(async (ip) => {
        const geo = await getGeoLocation(ip);
        return {
          ip,
          ...geo
        };
      })
    );

    // Фильтруем те, для которых не удалось получить геоданные
    return connectionsWithGeo.filter(c => c.country);
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
    // Статистика по странам
    countries: connections.reduce((acc, c) => {
      acc[c.countryCode] = (acc[c.countryCode] || 0) + 1;
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
  console.log(`🌍 Map service running on http://localhost:${PORT}`);
  console.log(`3x-ui API: ${X3UI_BASE_URL}${X3UI_PANEL_PATH}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/connections`);
});
