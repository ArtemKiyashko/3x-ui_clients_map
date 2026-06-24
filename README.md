# 3x-ui Live Connections Map

Интерактивная страница с картой подключений 3x-ui. Проект рассчитан на один сценарий запуска: Docker Compose. Клонировать репозиторий не нужно — достаточно создать один файл.

## Что делает

- берет клиентов из `/panel/api/server/clientIps`
- распаковывает все IP из ответа, включая несколько IP на одного клиента
- геолокирует их через `ip-api.com` batch endpoint с локальным кэшем в памяти
- отдает карту и JSON API на порту из `PORT` (по умолчанию `3117`)

## Запуск

1. Создай файл `docker-compose.yml` с содержимым:

```yaml
services:
  map-service:
    image: ghcr.io/artemkiyashko/3x-ui_clients_map:latest
    container_name: 3x-ui-map-service
    ports:
      - "3117:3117"
    environment:
      - X3UI_URL=http://3xui.lan          # адрес панели 3x-ui
      - X3UI_PANEL_PATH=/panel
      - X3UI_API_KEY=your-api-key-here    # API ключ из настроек панели
      - IP_API_BATCH_URL=http://ip-api.com/batch
      - PORT=3117
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "sh", "-c", "wget --quiet --tries=1 --spider http://localhost:3117/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
```

2. Подними сервис:

```bash
docker compose up -d
```

3. Открой:

```text
http://localhost:3117
```

### Если 3x-ui запущен в Docker

Если панель находится в отдельном контейнере, нужно добавить оба сервиса в общую сеть. Пример:

```yaml
services:
  map-service:
    image: ghcr.io/artemkiyashko/3x-ui_clients_map:latest
    container_name: 3x-ui-map-service
    ports:
      - "3117:3117"
    environment:
      - X3UI_URL=http://x3ui:2053         # имя контейнера 3x-ui и его внутренний порт
      - X3UI_PANEL_PATH=/panel
      - X3UI_API_KEY=your-api-key-here
      - IP_API_BATCH_URL=http://ip-api.com/batch
      - PORT=3117
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - 3x-ui-network

networks:
  3x-ui-network:
    external: true                        # сеть должна уже существовать
```

## Что нужно на хосте

- Docker
- Docker Compose

Клонировать репозиторий и устанавливать Node.js не нужно.

## API

### `GET /api/connections`

Пример ответа:

```json
{
  "online": 4,
  "timestamp": "2026-06-23T10:30:00.000Z",
  "connections": [
    {
      "ip": "1.2.3.4",
      "clientName": "user1",
      "timestamp": 1782239068,
      "country": "Russia",
      "countryCode": "RU",
      "city": "Moscow",
      "lat": 55.7522,
      "lon": 37.6156,
      "asn": "AS12345 ISP Name",
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

## Замечания

- карта использует внешние map tiles в браузере
- геолокация идет через `ip-api.com/batch`, новые IP кэшируются в памяти
- если у клиента несколько устройств или несколько IP, на карте будет несколько точек
