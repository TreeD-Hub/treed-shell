# `public`

Статические ресурсы Vite-приложения, которые копируются в build без обработки bundler.

## Состав

- `fonts/` - vendored font files и лицензии.
- `vite.svg` - стандартный Vite asset, не часть printer UI contract.

## Правила

- Класть сюда только файлы, которые должны быть доступны по URL в runtime.
- Не хранить здесь runtime config, secrets или device-specific состояние.
- Шрифты подключаются из `src/styles/foundation.css` через `/fonts/...`.
