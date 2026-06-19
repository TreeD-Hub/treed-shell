import type { ComponentProps } from 'react'
import { DashboardPage } from './DashboardPage'

type DashboardPageProps = ComponentProps<typeof DashboardPage>

type DashboardChromeProps = Pick<DashboardPageProps, 'logoSrc' | 'statusDock'>
type DashboardPrintProps = Pick<
  DashboardPageProps,
  | 'adjustedEtaTime'
  | 'displayLayerCurrent'
  | 'displayLayerTotal'
  | 'displayPrintFileName'
  | 'hasActivePrint'
  | 'isBusy'
  | 'isPrintPaused'
  | 'pendingCommand'
  | 'printCancelBlockReason'
  | 'printFill'
  | 'printPauseBlockReason'
>
type DashboardTuneProps = Pick<
  DashboardPageProps,
  | 'babystepActiveIndex'
  | 'babystepBlockReason'
  | 'babystepStep'
  | 'processMetrics'
  | 'quickMetrics'
  | 'temperatureTargets'
  | 'zOffsetMm'
>
type DashboardIdleProps = Pick<
  DashboardPageProps,
  | 'armedIdleWidgetId'
  | 'draggingIdleWidgetId'
  | 'idleHeroStatusLabel'
  | 'idleNotesInputRef'
  | 'idleNotesKeyboardRows'
  | 'idleNotesText'
  | 'idleWidgetOrder'
  | 'idleWidgetRefs'
  | 'isIdleNotesKeyboardOpen'
  | 'maintenanceSummary'
>
type DashboardActionProps = Pick<
  DashboardPageProps,
  | 'onBabystepAdjust'
  | 'onBabystepStepChange'
  | 'onIdleNotesChange'
  | 'onIdleNotesKeyboardClose'
  | 'onIdleNotesKeyboardOpen'
  | 'onIdleNotesKeyMouseDown'
  | 'onIdleNotesVirtualKey'
  | 'onIdleWidgetDragHandleClick'
  | 'onIdleWidgetDragPointerDown'
  | 'onIdleWidgetDragPointerEnd'
  | 'onIdleWidgetDragPointerMove'
  | 'onIdleWidgetTargetOpen'
  | 'onPause'
  | 'onPrintTuneGroupOpen'
  | 'onStopRequest'
>

export type DashboardContainerProps = {
  chrome: DashboardChromeProps
  print: DashboardPrintProps
  tune: DashboardTuneProps
  idle: DashboardIdleProps
  actions: DashboardActionProps
}

export function DashboardContainer({
  chrome,
  print,
  tune,
  idle,
  actions,
}: DashboardContainerProps) {
  return (
    <DashboardPage
      {...chrome}
      {...print}
      {...tune}
      {...idle}
      {...actions}
    />
  )
}
