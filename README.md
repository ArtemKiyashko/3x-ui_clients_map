# 3x-ui Live Connections Map

Интерактивная страница с картой подключений 3x-ui, которую можно встроить в Homepage через iframe. Проект рассчитан на один сценарий запуска: Docker Compose.

## Что делает

- берет клиентов из `/panel/api/server/clientIps`
- распаковывает все IP из ответа, включая несколько IP на одного клиента
- геолокирует их через `ip-api.com` batch endpoint с локальным кэшем в памяти
- отдает карту и JSON API на порту из `PORT` (по умолчанию `3117`)

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
IP_API_BATCH_URL=http://ip-api.com/batch
```

3. Подними сервис:

```bash
docker compose up --build -d
```

4. Открой:

```text
http://localhost:3117
```

## Что нужно на хосте

- Docker
- Docker Compose
- `.env`

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
