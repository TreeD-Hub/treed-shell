# `src-tauri`

Нативная обертка TreeD Shell для запуска как отдельного приложения.

Состав:
- `tauri.conf.json` — runtime-конфигурация окна и сборки;
- `Cargo.toml` + `src/` — Rust-часть Tauri;
- `icons/` — bundle-иконки.

Команды:

```bash
npm run tauri:dev
npm run tauri:build
```

Ограничение:
- требуется установленный Rust toolchain (`rustc`, `cargo`).
