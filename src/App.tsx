import { type ReactNode, useMemo } from 'react'
import { usePrinterCommands } from './core/commands'
import { usePrinterSnapshot } from './core/store/usePrinterSnapshot'
import './App.css'

const NOZZLE_TARGET = 220
const BED_TARGET = 60
const SPEED_PERCENT = 100
const FLOW_PERCENT = 95
const REMAINING_TIME = '2h 15m'

function clampPercent(current: number, target: number): number {
  if (target <= 0) {
    return 0
  }

  const value = (current / target) * 100
  return Math.max(0, Math.min(100, value))
}

function rounded(value: number): string {
  return `${Math.round(value)}`
}

function statusLabel(raw: string): string {
  if (!raw) {
    return 'Printing'
  }

  const lower = raw.toLowerCase()

  switch (lower) {
    case 'printing':
      return 'Printing'
    case 'standby':
      return 'Standby'
    case 'paused':
      return 'Paused'
    case 'complete':
      return 'Complete'
    default:
      return raw.charAt(0).toUpperCase() + raw.slice(1)
  }
}

function WifiIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 8.2a14.7 14.7 0 0 1 19 0" />
      <path d="M5.9 12a9.4 9.4 0 0 1 12.2 0" />
      <path d="M9.3 15.7a4.3 4.3 0 0 1 5.4 0" />
      <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 18h9a4 4 0 0 0 .2-8 5.4 5.4 0 0 0-10.5 1.7A3.5 3.5 0 0 0 7 18Z" />
    </svg>
  )
}

function PrintPreviewIcon() {
  return (
    <svg viewBox="0 0 132 132" aria-hidden="true">
      <path d="M19 34 79 17l10 78-60 17z" className="preview-frame" />
      <path d="M48 48 67 36 86 48 67 60z" className="preview-cube" />
      <path d="M48 48v34l19 12V60z" className="preview-cube" />
      <path d="M86 48v34L67 94V60z" className="preview-cube" />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1.3" />
      <rect x="14" y="4" width="6" height="6" rx="1.3" />
      <rect x="4" y="14" width="6" height="6" rx="1.3" />
      <rect x="14" y="14" width="6" height="6" rx="1.3" />
    </svg>
  )
}

function ControlIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 8h12a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-1l-2.1-3H9.1L7 17H6a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3Z" />
      <path d="M8.5 12h3" />
      <path d="M10 10.5v3" />
      <circle cx="15.8" cy="11.3" r=".9" fill="currentColor" stroke="none" />
      <circle cx="17.8" cy="13.3" r=".9" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FilesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 8.8a2 2 0 0 1 2-2h5l2-2h7a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

function MacrosIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m13 2.8-4.4 8.3h3.8L9.8 21.2 18.5 10h-4.1l2.6-7.2Z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 9a3 3 0 1 1-3 3 3 3 0 0 1 3-3Z" />
      <path d="m4.5 13.6-.9-3.2 1.9-.9c.2-.6.5-1.2.9-1.7L5.6 5l2.4-1.8 1.7 1.2c.6-.2 1.2-.4 1.8-.5L12 2h3l.5 1.9c.6.1 1.2.3 1.8.5L19 3.2 21.4 5l-.8 2.8c.4.5.7 1.1.9 1.7l1.9.9-.9 3.2-2 .2a7.4 7.4 0 0 1-1 1.6l.8 2.9-2.4 1.7-1.7-1.1a7.7 7.7 0 0 1-1.8.5L15 22h-3l-.5-1.9a7.7 7.7 0 0 1-1.8-.5L8 20.7l-2.4-1.7.8-2.9a7.4 7.4 0 0 1-1-1.6z" />
    </svg>
  )
}

type NavItemProps = {
  label: string
  active?: boolean
  icon: ReactNode
}

function NavItem({ label, active = false, icon }: NavItemProps) {
  return (
    <button type="button" className={`nav-item ${active ? 'is-active' : ''}`}>
      <span className="nav-icon">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function App() {
  const { snapshot, refresh } = usePrinterSnapshot()
  const { pendingCommand, executeCommand } = usePrinterCommands()

  const nozzleFill = useMemo(
    () => clampPercent(snapshot.extruderTemp, NOZZLE_TARGET),
    [snapshot.extruderTemp],
  )
  const bedFill = useMemo(() => clampPercent(snapshot.bedTemp, BED_TARGET), [snapshot.bedTemp])

  const isBusy = pendingCommand !== null

  async function handlePause(): Promise<void> {
    const ok = await executeCommand({ command: 'pause' })
    if (ok) {
      await refresh()
    }
  }

  async function handleStop(): Promise<void> {
    const ok = await executeCommand({ command: 'cancel' })
    if (ok) {
      await refresh()
    }
  }

  return (
    <main className="app-root">
      <section className="screen-shell" data-testid="screen-shell">
        <header className="top-bar">
          <div className="brand-wrap">
            <h1>TreeD Printer</h1>
            <span className="print-state">{statusLabel(snapshot.state)}</span>
          </div>
          <div className="top-icons" aria-label="status icons">
            <WifiIcon />
            <CloudIcon />
          </div>
        </header>

        <div className="content-grid">
          <section className="preview-panel">
            <div className="preview-inner">
              <PrintPreviewIcon />
            </div>
          </section>

          <section className="stats-column">
            <article className="stats-card">
              <div className="temp-grid">
                <div className="metric">
                  <p className="label">Nozzle</p>
                  <p className="value temp">
                    {rounded(snapshot.extruderTemp)}<span>°C</span>
                  </p>
                  <p className="hint">Target: {NOZZLE_TARGET}°C</p>
                  <div className="meter orange">
                    <div className="fill" style={{ width: `${nozzleFill}%` }} />
                  </div>
                </div>

                <div className="metric">
                  <p className="label">Bed</p>
                  <p className="value temp">
                    {rounded(snapshot.bedTemp)}<span>°C</span>
                  </p>
                  <p className="hint">Target: {BED_TARGET}°C</p>
                  <div className="meter green">
                    <div className="fill" style={{ width: `${bedFill}%` }} />
                  </div>
                </div>
              </div>

              <div className="two-up-grid">
                <div className="metric compact">
                  <p className="label">Speed</p>
                  <p className="value percent">
                    {SPEED_PERCENT}<span>%</span>
                  </p>
                </div>
                <div className="metric compact">
                  <p className="label">Flow</p>
                  <p className="value percent">
                    {FLOW_PERCENT}<span>%</span>
                  </p>
                </div>
              </div>

              <div className="metric remaining">
                <p className="label">Remaining</p>
                <p className="value">{REMAINING_TIME}</p>
              </div>
            </article>

            <div className="dual-actions" role="group" aria-label="print actions">
              <button
                type="button"
                className="action action-pause"
                onClick={() => void handlePause()}
                disabled={isBusy}
              >
                {pendingCommand === 'pause' ? 'Pausing' : 'Pause'}
              </button>
              <button
                type="button"
                className="action action-stop"
                onClick={() => void handleStop()}
                disabled={isBusy}
              >
                {pendingCommand === 'cancel' ? 'Stopping' : 'Stop'}
              </button>
            </div>
          </section>
        </div>

        <nav className="bottom-nav" aria-label="Main Navigation">
          <NavItem label="Dashboard" icon={<DashboardIcon />} active />
          <NavItem label="Control" icon={<ControlIcon />} />
          <NavItem label="Files" icon={<FilesIcon />} />
          <NavItem label="Macros" icon={<MacrosIcon />} />
          <NavItem label="Settings" icon={<SettingsIcon />} />
        </nav>
      </section>
    </main>
  )
}

export default App

