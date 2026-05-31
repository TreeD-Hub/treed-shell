# `src/core/commands`

Слой отправки команд управления принтером.

Состав:
- `types.ts` — контракт команд и результат выполнения;
- `catalog.ts` — TreeD metadata команд: risk, capability, confirmation;
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
- TreeD V2 motion/thermal/filament/Eddy/shaper/system команды из `types.ts`.

Контракт:
- критичные команды не выполняются «тихо» при ошибках;
- в UI возвращается явный `error` и последняя успешная команда.
- уровень риска команды хранится в `TREE_D_COMMAND_CATALOG`, а не выводится из текста кнопки.
