# `src/core/transport`

Транспортный слой взаимодействия с источниками данных.

Состав:
- `mockClient.ts` — mock-источник для local разработки;
- `moonrakerClient.ts` — HTTP-клиент Moonraker;
- `types.ts` — транспортные контракты.

Контракт:
- возвращать нормализованный `PrinterSnapshot`;
- при ошибках бросать явные исключения.
