# `e2e`

Playwright-тесты оболочки.

Инварианты:
- проверки выполняются в браузере Chromium;
- базовый контракт экрана `960x544` должен оставаться валидным.
- в цикле визуальной проверки обязателен артефакт-скрин `dashboard-shell.png`;
- в цикле визуальной проверки обязателен геометрический анализ layout (границы/пересечения ключевых блоков).

Команда запуска:

```bash
npx playwright test
npx playwright test e2e/shell-layout.spec.ts
```

Артефакт скрина:
- файл `dashboard-shell.png` сохраняется в `test-results/**` на каждом прогоне `npx playwright test e2e/shell-layout.spec.ts`.
