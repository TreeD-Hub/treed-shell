# `docs`

Документация проекта `treed-shell`.

Сюда добавляются:
- ADR по архитектурным решениям;
- эксплуатационные заметки;
- интеграционные контракты с `treed-mainshellOS`.
- базовые дизайн-спецификации (`00_Foundation`) для обязательного соответствия UI-макету.

Текущие ключевые документы:
- `00_FOUNDATION.md` — зафиксированные foundation-токены и дизайн-инварианты.
- `01_ADR_TAURI_ONLY_V2_RUNTIME.md` — принятое решение `Tauri-only` и hardware matrix для V2 runtime.
- `host-network-runtime-contract.md` — runtime-контракт Wi-Fi/host-network между UI и `treed-mainshellOS`.
- `system-power-runtime-contract.md` — runtime-контракт reboot/shutdown/service commands и их confirmation-only wiring.
