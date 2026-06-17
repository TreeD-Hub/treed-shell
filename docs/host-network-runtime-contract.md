# Host Network Runtime Contract

## Назначение

Этот контракт нужен для Wi-Fi управления из `treed-shell` и будущей вебморды.
`treed-shell` хранит общий TypeScript-контракт и UI-адаптеры, а `treed-mainshellOS` только раскладывает host-side runtime и проверяет, что он отвечает.

## Границы ответственности

- `packages/printer-logic` — shared-типы `HostNetworkStatus`, `HostNetworkClient`, `WifiNetworkItem` и pure helpers.
- `src/core/hostNetwork.ts` — runtime adapters для UI shell: Moonraker endpoint и Tauri fallback.
- `src/**` и `apps/web-ui/**` — разные интерфейсы поверх одного shared-контракта.
- `treed-mainshellOS` — деплой Moonraker component/config, наличие `nmcli`/NetworkManager и базовая проверка endpoints.

`treed-mainshellOS` не должен содержать UI-логику, сортировку сетей, выбор активной сети или правила отображения.

## Moonraker Endpoints

Базовый URL берется из `VITE_MOONRAKER_URL` или default `http://127.0.0.1:7125`.

- `GET /server/treed/network/status`
- `POST /server/treed/network/scan`
- `POST /server/treed/network/connect`
- `POST /server/treed/network/forget`

### `connect` request

```json
{
  "ssid": "TreeD Lab",
  "password": "optional-password-or-null"
}
```

### `forget` request

```json
{
  "ssid": "TreeD Lab"
}
```

## Response Shape

Все endpoints возвращают `HostNetworkStatus`:

```json
{
  "available": true,
  "ssid": "TreeD Lab",
  "ipAddress": "192.168.0.42",
  "message": "ready",
  "networks": [
    {
      "id": "treed-lab",
      "ssid": "TreeD Lab",
      "signalPercent": 87,
      "security": "wpa2",
      "saved": true,
      "connected": true
    }
  ]
}
```

`security` допускает значения `open`, `wpa2`, `wpa3`.

Если host network недоступен, endpoint должен вернуть `available: false`, пустой `networks` и понятный `message`.
Transport-level ошибки допускаются только когда сам component/endpoint не отвечает.

## Fallback

В `treed-shell` live runtime сначала использует Moonraker endpoints.
Tauri `invoke` остается fallback только для `tauri:dev:printer` / desktop runtime, когда Moonraker endpoint отсутствует.

## Required `treed-mainshellOS` Work

- Разложить Moonraker component, который предоставляет endpoints выше и внутри вызывает `nmcli`.
- Подключить component/config в существующем `moonraker-config` шаге.
- Проверить наличие NetworkManager/`nmcli` в provisioning.
- Добавить loader/contract проверку: endpoints зарегистрированы и `status` возвращает валидный `HostNetworkStatus`.
- Не переносить в `treed-mainshellOS` UI rules, фильтрацию, сортировку или выбор сети.
