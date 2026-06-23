# `e2e`

Playwright smoke/layout проверки shell UI.

## Контракт

- Браузер: Chromium.
- Viewport: `960x544`.
- Web server: `vite --mode mock --host 127.0.0.1 --port 4173`.
- Проверяется shell frame, Nothing-inspired visual contract, геометрия dashboard print-state и files screen.

## Команды

```powershell
npm run test:e2e
npx playwright test e2e/shell-layout.spec.ts
```

## Артефакты

`e2e/shell-layout.spec.ts` сохраняет screenshots в `test-results/**`:

- `dashboard-shell.png`
- `files-library.png`

## Инварианты

- Ключевые блоки должны помещаться в `960x544`.
- Нижняя навигация не должна пересекаться с основным контентом.
- В files screen ожидается сетка 4 карточки в ряд и вертикальный scroll.
- Визуальные проверки не заменяют device-run на реальном принтере.
