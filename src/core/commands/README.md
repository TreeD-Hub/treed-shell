# `src/core/commands`

Слой отправки команд управления принтером.

Состав:
- `types.ts` — контракт команд и результат выполнения;
- `mockCommandClient.ts` — локальная реализация команд для `mock`;
- `moonrakerCommandClient.ts` — отправка команд в Moonraker (`live`);
- `usePrinterCommands.ts` — хук состояния выполнения (`pending/error/lastResult`);
- `index.ts` — публичные экспорты слоя.

Поддерживаемые команды:
- `start` (по имени файла);
- `pause`;
- `resume`;
- `cancel`;
- `home` (`G28`).

Контракт:
- критичные команды не выполняются «тихо» при ошибках;
- в UI возвращается явный `error` и последняя успешная команда.
