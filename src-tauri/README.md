# `src-tauri`

Tauri 2 wrapper для запуска TreeD Shell как отдельного приложения.

## Состав

- `tauri.conf.json` - базовая desktop-dev/runtime конфигурация.
- `tauri.printer.conf.json` - printer overlay для 5-дюймового экрана.
- `Cargo.toml`, `Cargo.lock`, `build.rs`, `src/` - Rust-часть Tauri.
- `capabilities/default.json` - Tauri capability config.
- `icons/` - bundle icons.

## Команды

```powershell
npm run tauri:dev
npm run tauri:dev:printer
npm run tauri:build
npm run tauri:build:printer
```

## Профили

- `tauri.conf.json`: окно `1200x760`, min `1000x620`, decorations включены, `beforeDevCommand = npm run build:logic && vite --mode mock`, `beforeBuildCommand = npm run build:ui:printer`.
- `tauri.printer.conf.json`: окно `960x544`, fixed size, decorations off, always-on-top, live runtime, CSP для Moonraker/Tauri IPC на `127.0.0.1:7125` и `localhost:7125`.

## Ограничения

- Требуется установленный Rust toolchain (`rustc`, `cargo`).
- Production printer loader не собирает Tauri bundle на устройстве; он ставит static `treed-shell-ui.zip`.
- Изменения Tauri profile не должны менять release artifact contract без синхронизации с `treed-mainshellOS`.
