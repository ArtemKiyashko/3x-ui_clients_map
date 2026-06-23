# 3x-ui Live Connections Map

Интерактивная страница с картой подключений 3x-ui, которую можно встроить в Homepage через iframe. Проект рассчитан на один сценарий запуска: Docker Compose.

## Что делает

- берет клиентов из `/panel/api/server/clientIps`
- распаковывает все IP из ответа, включая несколько IP на одного клиента
- геолокирует их через локальную базу MaxMind `GeoLite2-City.mmdb`
- отдает карту и JSON API на порту `3000`

## Запуск

1. Создай `.env` из шаблона:

```bash
cp .env.example .env
```

2. Заполни `.env`:

```env
X3UI_URL=http://host.docker.internal:8080
X3UI_PANEL_PATH=/panel
X3UI_API_KEY=your-api-key-here
GEOIP_DB_PATH=/app/data/GeoLite2-City.mmdb
```

3. Положи файл базы в `./data/GeoLite2-City.mmdb`

4. Подними сервис:

```bash
docker compose up --build -d
```

5. Открой:

```text
http://localhost:3000
```

## Что нужно на хосте

- Docker
- Docker Compose
- `.env`
- `data/GeoLite2-City.mmdb`

Никакой локальной установки Node.js зависимостей не требуется.

## API

### `GET /api/connections`

Пример ответа:

```json
{
  "online": 4,
  "timestamp": "2026-06-23T10:30:00.000Z",
  "connections": [
    {
      "ip": "79.173.95.155",
      "clientName": "svet_router",
      "timestamp": 1782239068,
      "country": "Russia",
      "countryCode": "RU",
      "city": "Moscow",
      "lat": 55.7522,
      "lon": 37.6156,
      "asn": null,
      "isMobile": false
    }
  ],
  "countries": {
    "RU": 4
  }
}
```

### `GET /health`

Проверка состояния контейнера.

## Встраивание в Homepage

```html
<iframe
  src="http://localhost:3000"
  width="100%"
  height="600px"
  frameborder="0"
  style="border: none; border-radius: 8px;"
></iframe>
```

## Замечания

- карта использует внешние map tiles в браузере
- геолокация работает локально через `.mmdb`, без внешнего GeoIP API
- если у клиента несколько устройств или несколько IP, на карте будет несколько точек

## Полезные команды

```bash
docker compose logs -f map-service
docker compose restart map-service
docker compose down
```
