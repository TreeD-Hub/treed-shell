# System Power Runtime Contract

## Назначение

Контракт нужен для destructive/system actions из power popup `treed-shell`.
UI показывает эти действия доступными только когда runtime `treed-mainshellOS` публикует capability state через Klipper/Moonraker.

## Границы ответственности

- `packages/printer-logic` — catalog metadata, capability names, confirmation requirement и причины блокировки.
- `src/core/commands/moonrakerCommandClient.ts` — вызов штатных Moonraker endpoints.
- `src/shell/**` — power popup, disabled state и повторное подтверждение.
- `treed-mainshellOS` — раскладка capability macro и non-destructive проверка, что macro видны через Moonraker object query.

`treed-mainshellOS` не добавляет отдельный component для этих действий: сами действия уже есть в Moonraker.

## Capability Surface

`treed-mainshellOS` V2 profile должен публиковать:

- `gcode_macro _TREED_SYSTEM_POWER.enabled = 1`
- `gcode_macro _TREED_SERVICE_COMMANDS.enabled = 1`

`treed-shell` нормализует эти значения в snapshot capabilities:

- `power`
- `serviceCommands`

Если capability не подтвержден, кнопки остаются disabled с причиной из shared command catalog.

## Moonraker Endpoints

После повторного подтверждения UI вызывает:

- `POST /machine/reboot`
- `POST /machine/shutdown`
- `POST /printer/restart`
- `POST /printer/firmware_restart`
- `POST /server/restart`

Эти endpoints не вызываются автоматическими live-проверками. Unit/contract tests проверяют wiring и static contract, но не выполняют reboot/shutdown/restart на устройстве.
