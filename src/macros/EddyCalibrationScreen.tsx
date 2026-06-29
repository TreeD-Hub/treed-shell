import { EDDY_TEST_Z_STEP_OPTIONS } from '@treed/printer-logic'
import type { ExecuteCommandArgs, PrinterCommandId } from '../core/commands'
import type { PrinterEddyCalibrationSnapshot, PrinterSnapshot } from '../core/transport/types'
import { joinClassNames } from '../ui'

type EddyCalibrationScreenProps = {
  snapshot: PrinterSnapshot
  pendingCommand: PrinterCommandId | null
  executeCommand: (args: ExecuteCommandArgs) => Promise<boolean>
  getCommandBlockReason: (command: PrinterCommandId, args?: ExecuteCommandArgs) => string | null
}

type EddyStep = {
  id: keyof Pick<
    PrinterEddyCalibrationSnapshot,
    'primaryDone' | 'temperatureDone' | 'z0Done' | 'screwsDone' | 'meshDone'
  >
  title: string
  command: Extract<PrinterCommandId,
    | 'eddyDriveCurrentCalibrate'
    | 'eddyTemperatureStart'
    | 'eddyCheckZ0'
    | 'eddyScrewsTiltStart'
    | 'eddyBedMeshCalibrate'
  >
  required: boolean
}

const EDDY_STEPS: readonly EddyStep[] = [
  {
    id: 'primaryDone',
    title: 'Первичная калибровка Eddy',
    command: 'eddyDriveCurrentCalibrate',
    required: true,
  },
  {
    id: 'temperatureDone',
    title: 'Температурная калибровка',
    command: 'eddyTemperatureStart',
    required: true,
  },
  {
    id: 'z0Done',
    title: 'Поиск Z0',
    command: 'eddyCheckZ0',
    required: true,
  },
  {
    id: 'screwsDone',
    title: 'Выравнивание винтов стола',
    command: 'eddyScrewsTiltStart',
    required: true,
  },
  {
    id: 'meshDone',
    title: 'Построение карты стола',
    command: 'eddyBedMeshCalibrate',
    required: true,
  },
]

const PROMPT_LABELS: Record<PrinterEddyCalibrationSnapshot['operatorPrompt'], string> = {
  none: 'Готов к следующему действию',
  drive_current: 'Калибровка тока катушки',
  paper_test: 'Paper test: настройте высоту и нажмите ACCEPT',
  temperature_points: 'Ожидание температурных точек Eddy',
  verify_z0: 'Проверьте повторяемость Z0',
  adjust_screws: 'Регулируйте винты и повторяйте измерение',
  mesh_scan: 'Идет построение карты стола',
  restart: 'Ожидается перезапуск Klipper',
}

function formatStepState(isDone: boolean, isActive: boolean): string {
  if (isDone) {
    return 'готово'
  }

  return isActive ? 'в процессе' : 'ожидает'
}

export function EddyCalibrationScreen({
  snapshot,
  pendingCommand,
  executeCommand,
  getCommandBlockReason,
}: EddyCalibrationScreenProps) {
  const calibration = snapshot.v2.eddy.calibration
  const completedRequiredCount = EDDY_STEPS.filter((step) => calibration[step.id]).length
  const autosaveCommand: ExecuteCommandArgs = {
    command: snapshot.v2.eddy.autosaveEnabled ? 'eddyAutosaveDisable' : 'eddyAutosaveEnable',
  }
  const autosaveBlockReason = getCommandBlockReason(autosaveCommand.command, autosaveCommand)
  const isAutosaveBusy = pendingCommand === 'eddyAutosaveEnable' || pendingCommand === 'eddyAutosaveDisable'

  function runCommand(args: ExecuteCommandArgs, blockReason: string | null): void {
    if (blockReason !== null) {
      return
    }

    void executeCommand(args)
  }

  return (
    <section className="macros-screen" data-testid="screen-macros">
      <div className="macros-eddy-shell">
        <header className="macros-eddy-header">
          <div className="macros-eddy-title-group">
            <p className="macros-eddy-kicker">Макросы</p>
            <h1>Калибровка Eddy</h1>
          </div>
          <div className="macros-eddy-summary" aria-label="Прогресс обязательной калибровки">
            <strong>{completedRequiredCount}/5</strong>
            <span>{calibration.requiredDone ? 'обязательные шаги готовы' : PROMPT_LABELS[calibration.operatorPrompt]}</span>
          </div>
        </header>

        <div className="macros-eddy-grid">
          <div className="macros-eddy-steps">
            {EDDY_STEPS.map((step) => {
              const args: ExecuteCommandArgs = { command: step.command }
              const blockReason = getCommandBlockReason(step.command, args)
              const isActive = calibration.activeStep === step.id.replace('Done', '')
              const isDone = calibration[step.id]
              const isBusy = pendingCommand === step.command

              return (
                <button
                  key={step.id}
                  type="button"
                  className={joinClassNames('macros-eddy-step-btn', isDone && 'is-done', isActive && 'is-active')}
                  aria-label={step.title}
                  aria-disabled={blockReason !== null || isBusy}
                  disabled={blockReason !== null || isBusy}
                  onClick={() => runCommand(args, blockReason)}
                >
                  <span className="macros-eddy-step-title">{step.title}</span>
                  <span className="macros-eddy-step-meta">
                    {step.required ? 'обязательный' : 'опциональный'} / {formatStepState(isDone, isActive)}
                  </span>
                </button>
              )
            })}

            <button
              type="button"
              className={joinClassNames(
                'macros-eddy-step-btn',
                'is-optional',
                snapshot.v2.eddy.autosaveEnabled && 'is-done',
              )}
              aria-label="Автосохранение Z-offset"
              aria-disabled={autosaveBlockReason !== null || isAutosaveBusy}
              disabled={autosaveBlockReason !== null || isAutosaveBusy}
              onClick={() => runCommand(autosaveCommand, autosaveBlockReason)}
            >
              <span className="macros-eddy-step-title">Автосохранение Z-offset</span>
              <span className="macros-eddy-step-meta">
                опциональный / {snapshot.v2.eddy.autosaveEnabled ? 'включено' : 'выключено'}
              </span>
            </button>
          </div>

          <aside className="macros-eddy-operator">
            <div className="macros-eddy-status-card">
              <p>Активный шаг</p>
              <strong>{calibration.activeStep === 'not_started' ? 'не начато' : calibration.activeStep}</strong>
              <span>{PROMPT_LABELS[calibration.operatorPrompt]}</span>
            </div>

            <div className="macros-eddy-paper-card">
              <p>Paper test</p>
              <div className="macros-eddy-testz-grid">
                {EDDY_TEST_Z_STEP_OPTIONS.map((deltaMm) => {
                  const args: ExecuteCommandArgs = { command: 'eddyTestZ', deltaMm }
                  const blockReason = getCommandBlockReason('eddyTestZ', args)
                  const label = `${deltaMm > 0 ? '+' : ''}${deltaMm}`

                  return (
                    <button
                      key={deltaMm}
                      type="button"
                      aria-label={`TESTZ ${label} мм`}
                      aria-disabled={blockReason !== null || pendingCommand === 'eddyTestZ'}
                      disabled={blockReason !== null || pendingCommand === 'eddyTestZ'}
                      onClick={() => runCommand(args, blockReason)}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <div className="macros-eddy-accept-row">
                <button
                  type="button"
                  onClick={() => runCommand(
                    { command: 'eddyPrimaryAcceptSave' },
                    getCommandBlockReason('eddyPrimaryAcceptSave', { command: 'eddyPrimaryAcceptSave' }),
                  )}
                >
                  ACCEPT первичная
                </button>
                <button
                  type="button"
                  onClick={() => runCommand(
                    { command: 'eddyTemperatureAcceptSave' },
                    getCommandBlockReason('eddyTemperatureAcceptSave', { command: 'eddyTemperatureAcceptSave' }),
                  )}
                >
                  ACCEPT температура
                </button>
              </div>
            </div>

            <button
              type="button"
              className="macros-eddy-screws-done"
              onClick={() => runCommand(
                { command: 'eddyScrewsTiltDone' },
                getCommandBlockReason('eddyScrewsTiltDone', { command: 'eddyScrewsTiltDone' }),
              )}
            >
              Винты выровнены
            </button>
          </aside>
        </div>
      </div>
    </section>
  )
}
