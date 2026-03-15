import { type ChangeEvent, type CSSProperties, type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePrinterCommands } from './core/commands'
import { usePrinterSnapshot } from './core/store/usePrinterSnapshot'
import {
  BABYSTEP_STEP_OPTIONS,
  BOTTOM_NAV_ITEMS,
  DASHBOARD_VALUES,
  PROCESS_METRIC_DEFINITIONS,
  QUICK_METRIC_DEFINITIONS,
  type ScreenId,
  TEMPERATURE_METRIC_DEFINITIONS,
  TOP_STATUS_BUTTONS,
  type TopStatusButtonId,
} from './dashboard/config'
import {
  clampPercent,
  rounded,
  statusLabel,
} from './dashboard/helpers'
import {
  ActionSquareButton,
  AxisCrossControls,
  HorizontalSteppedSlider,
  NavItemButton,
  PlainMetric,
  PrintFileCard,
  PrintPreviewIcon,
  SegmentedToggle,
  StatusIconButton,
  TemperatureMetric,
  type AxisId,
  type JoystickVector,
  VerticalAxisSlider,
  VirtualJoystick,
} from './ui'
import { PRINT_FILE_LIBRARY, type PrintFileItem } from './printFiles'
import treeDLogoAsset from './assets/logo_treeD-28.svg'
import './App.css'

const DEFAULT_SCREEN: ScreenId = 'dashboard'
const CLOUD_LINK_URL = 'https://treed.pro'
const CLOUD_QR_IMAGE_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=144x144&data=https%3A%2F%2Ftreed.pro'
const TOP_POPUP_MAX_WIDTH = 360
const TOP_POPUP_GAP = 8
const TOP_POPUP_SIDE_PADDING = 8
const TOP_POPUP_ARROW_EDGE = 18
const FALLBACK_SCREEN_WIDTH = 960
const TOP_BAR_BUTTON_SIZE = 56
const TOP_BAR_BUTTON_GAP = 8
const TOP_BAR_RIGHT_PADDING = 24
const FILE_MODAL_TITLE_ID = 'print-file-modal-title'
const PRINT_CANCEL_MODAL_TITLE_ID = 'print-cancel-modal-title'
type FilesSortKey = 'name' | 'addedAt'
type ParkingMode = 'all' | 'axis'
type MovementMode = 'buttons' | 'joystick'
type MoveStepKey = '1' | '10' | '25' | '100'
type PrintHeadPosition = {
  x: number
  y: number
  z: number
}
const TOP_BAR_POPUP_TITLES: Record<TopStatusButtonId, string> = {
  wifi: 'Состояние Wi-Fi',
  cloud: 'Состояние облака',
  notifications: 'Уведомления',
  power: 'Выключение принтера',
}
type TopPopupPosition = {
  top: number
  left: number
  arrowLeft: number
}

const FILES_SORT_OPTIONS: Array<{ id: FilesSortKey; label: string }> = [
  { id: 'name', label: 'По имени' },
  { id: 'addedAt', label: 'По добавлению' },
]
const PARKING_MODE_OPTIONS: Array<{ id: ParkingMode; label: string }> = [
  { id: 'all', label: 'Все оси' },
  { id: 'axis', label: 'По оси' },
]
const PARKING_AXIS_OPTIONS: Array<{ id: AxisId; label: string }> = [
  { id: 'X', label: 'X' },
  { id: 'Y', label: 'Y' },
  { id: 'Z', label: 'Z' },
]
const MOVEMENT_MODE_OPTIONS: Array<{ id: MovementMode; label: string }> = [
  { id: 'buttons', label: 'Крестовина' },
  { id: 'joystick', label: 'Джойстик' },
]
const MOVE_STEP_OPTIONS: Array<{ id: MoveStepKey; label: string; valueMm: number }> = [
  { id: '1', label: '1 мм', valueMm: 1 },
  { id: '10', label: '10 мм', valueMm: 10 },
  { id: '25', label: '25 мм', valueMm: 25 },
  { id: '100', label: '100 мм', valueMm: 100 },
]
const HEAD_X_BOUNDS_MM = { min: 0, max: 250 } as const
const HEAD_Y_BOUNDS_MM = { min: 0, max: 250 } as const
const HEAD_Z_BOUNDS_MM = { min: 0, max: 200 } as const
const MODEL_FAN_BOUNDS_PERCENT = { min: 0, max: 100 } as const
const MODEL_FAN_STEP_PERCENT = 5
const MAX_JOYSTICK_SPEED_MM_S = 50
const MAINTENANCE_STATUS = {
  runtimeHours: 874,
  hoursLeft: 126,
} as const
const IDLE_NOTES_DEFAULT_TEXT = [
  'Перед запуском проверьте очистку стола и состояние поверхности.',
  'Если модель новая, сделайте короткий тест первого слоя.',
].join('\n')
const IDLE_NOTES_KEYBOARD_ROWS: string[][] = [
  ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х'],
  ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
  ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю'],
]

function clampAxisValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function snapValueByStep(value: number, min: number, max: number, step: number): number {
  const safeStep = Math.max(1, step)
  const clamped = clampAxisValue(value, min, max)
  const steps = Math.round((clamped - min) / safeStep)
  return clampAxisValue(min + (steps * safeStep), min, max)
}

function normalizeHeadPosition(position: PrintHeadPosition): PrintHeadPosition {
  return {
    x: clampAxisValue(position.x, HEAD_X_BOUNDS_MM.min, HEAD_X_BOUNDS_MM.max),
    y: clampAxisValue(position.y, HEAD_Y_BOUNDS_MM.min, HEAD_Y_BOUNDS_MM.max),
    z: clampAxisValue(position.z, HEAD_Z_BOUNDS_MM.min, HEAD_Z_BOUNDS_MM.max),
  }
}

function formatAxisCoordinate(value: number): string {
  return value.toFixed(1)
}

function resolveFallbackAnchorCenterX(id: TopStatusButtonId, screenWidth: number): number {
  const buttonIndex = TOP_STATUS_BUTTONS.findIndex((item) => item.id === id)
  const buttonsFromRight = TOP_STATUS_BUTTONS.length - 1 - Math.max(0, buttonIndex)
  return (
    screenWidth -
    TOP_BAR_RIGHT_PADDING -
    (TOP_BAR_BUTTON_SIZE / 2) -
    (buttonsFromRight * (TOP_BAR_BUTTON_SIZE + TOP_BAR_BUTTON_GAP))
  )
}

const SCREEN_PLACEHOLDERS: Record<Exclude<ScreenId, 'dashboard' | 'files'>, { title: string; description: string }> = {
  control: {
    title: 'Управление',
    description: 'Раздел управления принтером подключен в навигацию и готов к наполнению рабочими блоками.',
  },
  macros: {
    title: 'Макросы',
    description: 'Экран макросов подключен в каркас маршрутизации. Здесь будут быстрые сценарии и сервисные команды.',
  },
  settings: {
    title: 'Настройки',
    description: 'Экран настроек подключен в каркас маршрутизации. Здесь будут параметры UI и подключения к Moonraker.',
  },
}

function App() {
  const { snapshot, refresh } = usePrinterSnapshot()
  const { pendingCommand, executeCommand } = usePrinterCommands()
  const screenShellRef = useRef<HTMLElement | null>(null)
  const topButtonRefs = useRef<Record<TopStatusButtonId, HTMLButtonElement | null>>({
    wifi: null,
    cloud: null,
    notifications: null,
    power: null,
  })
  const [babystepStep, setBabystepStep] = useState<number>(BABYSTEP_STEP_OPTIONS[1])
  const [activeTopPopup, setActiveTopPopup] = useState<TopStatusButtonId | null>(null)
  const [powerPopupNotice, setPowerPopupNotice] = useState<string>('')
  const [topPopupPosition, setTopPopupPosition] = useState<TopPopupPosition | null>(null)
  const [activeScreen, setActiveScreen] = useState<ScreenId>(DEFAULT_SCREEN)
  const [filesSortKey, setFilesSortKey] = useState<FilesSortKey>('name')
  const [filesLibrary, setFilesLibrary] = useState<PrintFileItem[]>(() => [...PRINT_FILE_LIBRARY])
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [activePrintFileName, setActivePrintFileName] = useState<string | null>(null)
  const [isPrintCancelConfirmOpen, setIsPrintCancelConfirmOpen] = useState<boolean>(false)
  const [idleNotesText, setIdleNotesText] = useState<string>(IDLE_NOTES_DEFAULT_TEXT)
  const [isIdleNotesKeyboardOpen, setIsIdleNotesKeyboardOpen] = useState<boolean>(false)
  const [parkingMode, setParkingMode] = useState<ParkingMode>('all')
  const [parkingAxis, setParkingAxis] = useState<AxisId>('X')
  const [movementMode, setMovementMode] = useState<MovementMode>('buttons')
  const [moveStepKey, setMoveStepKey] = useState<MoveStepKey>('1')
  const [isServiceModeEnabled, setIsServiceModeEnabled] = useState<boolean>(false)
  const [modelFanPercent, setModelFanPercent] = useState<number>(() => (
    snapValueByStep(snapshot.modelFanPercent, MODEL_FAN_BOUNDS_PERCENT.min, MODEL_FAN_BOUNDS_PERCENT.max, MODEL_FAN_STEP_PERCENT)
  ))
  const [joystickVector, setJoystickVector] = useState<JoystickVector>({ x: 0, y: 0 })
  const [printHeadPosition, setPrintHeadPosition] = useState<PrintHeadPosition>(() =>
    normalizeHeadPosition({
      x: snapshot.toolheadX,
      y: snapshot.toolheadY,
      z: snapshot.toolheadZ,
    }),
  )
  const idleNotesInputRef = useRef<HTMLTextAreaElement | null>(null)

  const printFill = Math.max(0, Math.min(100, DASHBOARD_VALUES.progressPercent))
  const isBusy = pendingCommand !== null
  const hasActivePrint = activePrintFileName !== null
  const isFilesScreenActive = activeScreen === 'files'
  const activeNavIndex = Math.max(
    0,
    BOTTOM_NAV_ITEMS.findIndex((item) => item.id === activeScreen),
  )
  const babystepActiveIndex = Math.max(
    0,
    BABYSTEP_STEP_OPTIONS.findIndex((step) => step === babystepStep),
  )
  const formattedSnapshotTime = useMemo(() => {
    const parsed = new Date(snapshot.updatedAt)
    if (Number.isNaN(parsed.getTime())) {
      return '—'
    }
    return parsed.toLocaleTimeString('ru-RU')
  }, [snapshot.updatedAt])
  const connectionLabel = snapshot.connection === 'online' ? 'Подключено' : 'Офлайн'
  const wifiSsidLabel = snapshot.connection === 'online' ? snapshot.wifiSsid : 'Не подключено'
  const wifiIpLabel = snapshot.connection === 'online' ? snapshot.ipAddress : '—'
  const cloudStatusLabel = snapshot.connection === 'online' ? 'В сети' : 'Не в сети'
  const idleNozzleTempLabel = `${rounded(snapshot.extruderTemp)} °C`
  const idleBedTempLabel = `${rounded(snapshot.bedTemp)} °C`
  const topBarScreenLabel = useMemo(() => {
    if (activeScreen === 'dashboard') {
      return hasActivePrint ? statusLabel(snapshot.state) : 'Ожидание печати'
    }

    return BOTTOM_NAV_ITEMS.find((item) => item.id === activeScreen)?.label ?? statusLabel(snapshot.state)
  }, [activeScreen, hasActivePrint, snapshot.state])
  const sortedPrintFiles = useMemo(() => {
    const nextItems = [...filesLibrary]

    if (filesSortKey === 'addedAt') {
      nextItems.sort((left, right) => Date.parse(right.addedAt) - Date.parse(left.addedAt))
      return nextItems
    }

    nextItems.sort((left, right) => left.name.localeCompare(right.name, 'en'))
    return nextItems
  }, [filesLibrary, filesSortKey])
  const selectedPrintFile = useMemo(() => {
    if (selectedFileId === null) {
      return null
    }

    return filesLibrary.find((item) => item.id === selectedFileId) ?? null
  }, [filesLibrary, selectedFileId])
  const moveStepMm = useMemo(() => {
    const selectedStep = MOVE_STEP_OPTIONS.find((item) => item.id === moveStepKey)
    return selectedStep?.valueMm ?? 1
  }, [moveStepKey])
  const joystickSpeedMmS = useMemo(
    () => Math.hypot(joystickVector.x, joystickVector.y) * MAX_JOYSTICK_SPEED_MM_S,
    [joystickVector.x, joystickVector.y],
  )
  const axisCoordinatesLabel = `X ${formatAxisCoordinate(printHeadPosition.x)}  Y ${formatAxisCoordinate(printHeadPosition.y)}  Z ${formatAxisCoordinate(printHeadPosition.z)}`

  const temperatureValueByKey = {
    nozzle: snapshot.extruderTemp,
    bed: snapshot.bedTemp,
  } as const

  const temperatureMetrics = TEMPERATURE_METRIC_DEFINITIONS.map((definition) => {
    const currentValue = temperatureValueByKey[definition.key]

    return {
      ...definition,
      current: rounded(currentValue),
      fillPercent: clampPercent(currentValue, definition.target),
    }
  })

  const quickMetricValueByKey = {
    volumetricFlow: DASHBOARD_VALUES.volumetricFlowMm3S,
    fan: rounded(snapshot.modelFanPercent),
    flow: DASHBOARD_VALUES.flowPercent,
  } as const

  const quickMetrics = QUICK_METRIC_DEFINITIONS.map((definition) => ({
    ...definition,
    value: quickMetricValueByKey[definition.key],
  }))

  const processMetricValueByKey = {
    speed: DASHBOARD_VALUES.speedMmS,
    accel: DASHBOARD_VALUES.accelMmS2,
    kFactor: DASHBOARD_VALUES.kFactorLaPa,
    retract: DASHBOARD_VALUES.retractMm,
  } as const

  const processMetrics = PROCESS_METRIC_DEFINITIONS.map((definition) => ({
    ...definition,
    value: processMetricValueByKey[definition.key],
  }))

  const closeTopPopup = useCallback(() => {
    setActiveTopPopup(null)
    setTopPopupPosition(null)
  }, [])

  const resolveTopPopupPosition = useCallback((id: TopStatusButtonId): TopPopupPosition => {
    const shellElement = screenShellRef.current
    const anchorButton = topButtonRefs.current[id]
    const shellRect = shellElement?.getBoundingClientRect()
    const anchorRect = anchorButton?.getBoundingClientRect()
    const shellWidth = shellRect && shellRect.width > 0 ? shellRect.width : FALLBACK_SCREEN_WIDTH
    const popupWidth = Math.min(TOP_POPUP_MAX_WIDTH, shellWidth - (TOP_POPUP_SIDE_PADDING * 2))

    const anchorCenterX =
      shellRect && anchorRect && shellRect.width > 0 && anchorRect.width > 0
        ? anchorRect.left - shellRect.left + (anchorRect.width / 2)
        : resolveFallbackAnchorCenterX(id, shellWidth)

    let left = anchorCenterX - (popupWidth / 2)
    left = Math.max(TOP_POPUP_SIDE_PADDING, Math.min(left, shellWidth - popupWidth - TOP_POPUP_SIDE_PADDING))

    const arrowLeft = Math.max(
      TOP_POPUP_ARROW_EDGE,
      Math.min(anchorCenterX - left, popupWidth - TOP_POPUP_ARROW_EDGE),
    )

    return {
      top: TOP_POPUP_GAP,
      left,
      arrowLeft,
    }
  }, [])

  const openTopPopup = useCallback(
    (id: TopStatusButtonId) => {
      if (activeTopPopup === id) {
        closeTopPopup()
        return
      }
      setPowerPopupNotice('')
      setTopPopupPosition(resolveTopPopupPosition(id))
      setActiveTopPopup(id)
    },
    [activeTopPopup, closeTopPopup, resolveTopPopupPosition],
  )

  const openWifiSettings = useCallback(() => {
    setActiveScreen('settings')
    closeTopPopup()
  }, [closeTopPopup])

  function handleFilesSortChange(nextSortKey: FilesSortKey): void {
    if (nextSortKey === filesSortKey) {
      return
    }

    setFilesSortKey(nextSortKey)
  }

  function handleParkingModeChange(nextMode: ParkingMode): void {
    setParkingMode(nextMode)
  }

  function handleParkingAxisChange(nextAxis: AxisId): void {
    setParkingAxis(nextAxis)
  }

  function handleMoveStepChange(nextStep: MoveStepKey): void {
    setMoveStepKey(nextStep)
  }

  function handleMovementModeChange(nextMode: MovementMode): void {
    setMovementMode(nextMode)
  }

  function handleModelFanPercentChange(nextValue: number): void {
    setModelFanPercent(
      snapValueByStep(nextValue, MODEL_FAN_BOUNDS_PERCENT.min, MODEL_FAN_BOUNDS_PERCENT.max, MODEL_FAN_STEP_PERCENT),
    )
  }

  const closeFileModal = useCallback(() => {
    setSelectedFileId(null)
  }, [])

  const closePrintCancelConfirm = useCallback(() => {
    setIsPrintCancelConfirmOpen(false)
  }, [])

  const setIdleNotesCaret = useCallback((nextCaret: number) => {
    if (typeof window === 'undefined') {
      return
    }

    window.requestAnimationFrame(() => {
      const input = idleNotesInputRef.current
      if (input === null) {
        return
      }
      input.focus()
      input.setSelectionRange(nextCaret, nextCaret)
    })
  }, [])

  const handleIdleNotesChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setIdleNotesText(event.target.value)
  }, [])

  const handleIdleNotesKeyboardOpen = useCallback(() => {
    setIsIdleNotesKeyboardOpen(true)
  }, [])

  const handleIdleNotesKeyboardClose = useCallback(() => {
    setIsIdleNotesKeyboardOpen(false)
  }, [])

  const handleIdleNotesKeyMouseDown = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }, [])

  const handleIdleNotesVirtualKey = useCallback((key: string) => {
    const input = idleNotesInputRef.current
    if (input === null) {
      return
    }

    if (key === 'close') {
      setIsIdleNotesKeyboardOpen(false)
      return
    }

    const selectionStart = input.selectionStart ?? idleNotesText.length
    const selectionEnd = input.selectionEnd ?? idleNotesText.length
    let nextText = idleNotesText
    let nextCaret = selectionStart

    if (key === 'backspace') {
      if (selectionStart !== selectionEnd) {
        nextText = `${idleNotesText.slice(0, selectionStart)}${idleNotesText.slice(selectionEnd)}`
        nextCaret = selectionStart
      } else if (selectionStart > 0) {
        nextText = `${idleNotesText.slice(0, selectionStart - 1)}${idleNotesText.slice(selectionStart)}`
        nextCaret = selectionStart - 1
      }
    } else {
      const value = key === 'space'
        ? ' '
        : key === 'enter'
          ? '\n'
          : key
      nextText = `${idleNotesText.slice(0, selectionStart)}${value}${idleNotesText.slice(selectionEnd)}`
      nextCaret = selectionStart + value.length
    }

    if (nextText === idleNotesText) {
      setIdleNotesCaret(nextCaret)
      return
    }

    setIdleNotesText(nextText)
    setIdleNotesCaret(nextCaret)
  }, [idleNotesText, setIdleNotesCaret])

  function handlePrintFileSelect(fileId: string): void {
    setSelectedFileId(fileId)
  }

  function handleDeleteSelectedFile(): void {
    if (selectedPrintFile === null) {
      return
    }

    if (activePrintFileName === selectedPrintFile.name) {
      setActivePrintFileName(null)
    }
    setFilesLibrary((currentItems) => currentItems.filter((item) => item.id !== selectedPrintFile.id))
    closeFileModal()
  }

  async function handleStartSelectedFile(): Promise<void> {
    if (selectedPrintFile === null) {
      return
    }

    const ok = await executeCommand({
      command: 'start',
      filename: selectedPrintFile.name,
    })
    if (ok) {
      setActivePrintFileName(selectedPrintFile.name)
      await refresh()
      setActiveScreen('dashboard')
      closeFileModal()
    }
  }

  async function handleParkingCommand(): Promise<void> {
    const ok = await executeCommand({ command: 'home' })
    if (!ok) {
      return
    }

    await refresh()
    setPrintHeadPosition((prevPosition) => {
      if (parkingMode === 'all') {
        return { ...prevPosition, x: 0, y: 0, z: 0 }
      }

      if (parkingAxis === 'X') {
        return { ...prevPosition, x: 0 }
      }

      if (parkingAxis === 'Y') {
        return { ...prevPosition, y: 0 }
      }

      return { ...prevPosition, z: 0 }
    })
  }

  function handleServiceModeToggle(): void {
    setIsServiceModeEnabled((prevValue) => !prevValue)
  }

  function handleAxisMove(axis: AxisId, direction: -1 | 1): void {
    setPrintHeadPosition((prevPosition) => {
      const delta = direction * moveStepMm
      return {
        ...prevPosition,
        x: axis === 'X'
          ? clampAxisValue(prevPosition.x + delta, HEAD_X_BOUNDS_MM.min, HEAD_X_BOUNDS_MM.max)
          : prevPosition.x,
        y: axis === 'Y'
          ? clampAxisValue(prevPosition.y + delta, HEAD_Y_BOUNDS_MM.min, HEAD_Y_BOUNDS_MM.max)
          : prevPosition.y,
        z: axis === 'Z'
          ? clampAxisValue(prevPosition.z + delta, HEAD_Z_BOUNDS_MM.min, HEAD_Z_BOUNDS_MM.max)
          : prevPosition.z,
      }
    })
  }

  function handleJoystickVectorChange(nextVector: JoystickVector): void {
    setJoystickVector(nextVector)
  }

  function handleJoystickZChange(nextValue: number): void {
    setPrintHeadPosition((prevPosition) => ({
      ...prevPosition,
      z: clampAxisValue(nextValue, HEAD_Z_BOUNDS_MM.min, HEAD_Z_BOUNDS_MM.max),
    }))
  }

  function handleMotorsDisable(): void {
    // Команда отключения моторов будет подключена после интеграции backend.
  }

  useEffect(() => {
    if (activeTopPopup === null || typeof window === 'undefined') {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeTopPopup()
      }
    }

    const handleResize = () => {
      setTopPopupPosition(resolveTopPopupPosition(activeTopPopup))
    }

    window.addEventListener('keydown', handleEscape)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('resize', handleResize)
    }
  }, [activeTopPopup, closeTopPopup, resolveTopPopupPosition])

  useEffect(() => {
    if (selectedFileId === null || typeof window === 'undefined') {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFileModal()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [closeFileModal, selectedFileId])

  useEffect(() => {
    if (!isPrintCancelConfirmOpen || typeof window === 'undefined') {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePrintCancelConfirm()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [closePrintCancelConfirm, isPrintCancelConfirmOpen])

  useEffect(() => {
    if (!isIdleNotesKeyboardOpen || typeof window === 'undefined') {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleIdleNotesKeyboardClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [handleIdleNotesKeyboardClose, isIdleNotesKeyboardOpen])

  useEffect(() => {
    if (activeScreen !== 'dashboard' || hasActivePrint) {
      setIsIdleNotesKeyboardOpen(false)
    }
  }, [activeScreen, hasActivePrint])

  useEffect(() => {
    if (activeScreen !== 'files' && selectedFileId !== null) {
      closeFileModal()
    }
  }, [activeScreen, closeFileModal, selectedFileId])

  useEffect(() => {
    if (movementMode !== 'joystick' && (joystickVector.x !== 0 || joystickVector.y !== 0)) {
      setJoystickVector({ x: 0, y: 0 })
    }
  }, [joystickVector.x, joystickVector.y, movementMode])

  useEffect(() => {
    setModelFanPercent((currentValue) => {
      const nextValue = snapValueByStep(
        snapshot.modelFanPercent,
        MODEL_FAN_BOUNDS_PERCENT.min,
        MODEL_FAN_BOUNDS_PERCENT.max,
        MODEL_FAN_STEP_PERCENT,
      )

      return currentValue === nextValue ? currentValue : nextValue
    })
  }, [snapshot.modelFanPercent])

  useEffect(() => {
    if (movementMode === 'joystick') {
      return
    }

    setPrintHeadPosition(
      normalizeHeadPosition({
        x: snapshot.toolheadX,
        y: snapshot.toolheadY,
        z: snapshot.toolheadZ,
      }),
    )
  }, [movementMode, snapshot.toolheadX, snapshot.toolheadY, snapshot.toolheadZ])

  useEffect(() => {
    if (movementMode !== 'joystick' || (joystickVector.x === 0 && joystickVector.y === 0)) {
      return
    }

    let frameHandle: number | null = null
    let previousTimestamp: number | null = null

    const tick = (timestamp: number) => {
      if (previousTimestamp === null) {
        previousTimestamp = timestamp
      }
      const deltaSeconds = clampAxisValue((timestamp - previousTimestamp) / 1000, 0, 0.1)
      previousTimestamp = timestamp

      setPrintHeadPosition((prevPosition) => normalizeHeadPosition({
        x: prevPosition.x + (joystickVector.x * MAX_JOYSTICK_SPEED_MM_S * deltaSeconds),
        y: prevPosition.y + (joystickVector.y * MAX_JOYSTICK_SPEED_MM_S * deltaSeconds),
        z: prevPosition.z,
      }))

      frameHandle = window.requestAnimationFrame(tick)
    }

    frameHandle = window.requestAnimationFrame(tick)
    return () => {
      if (frameHandle !== null) {
        window.cancelAnimationFrame(frameHandle)
      }
    }
  }, [joystickVector.x, joystickVector.y, movementMode])

  function setTopButtonRef(id: TopStatusButtonId, node: HTMLButtonElement | null): void {
    topButtonRefs.current[id] = node
  }

  function handlePowerShutdownPlaceholder(): void {
    setPowerPopupNotice('Команда выключения пока не подключена к backend.')
  }

  async function handlePause(): Promise<void> {
    const ok = await executeCommand({ command: 'pause' })
    if (ok) {
      await refresh()
    }
  }

  function handleStopRequest(): void {
    setIsPrintCancelConfirmOpen(true)
  }

  async function handleStopConfirm(): Promise<void> {
    const ok = await executeCommand({ command: 'cancel' })
    if (ok) {
      setActivePrintFileName(null)
      await refresh()
      setActiveScreen('dashboard')
      closePrintCancelConfirm()
    }
  }

  return (
    <main className="app-root">
      <section className="screen-shell" data-testid="screen-shell" ref={screenShellRef}>
        <header className="top-bar">
          <div className="brand-wrap">
            <h1>TreeD Принтер</h1>
            <span className="print-state" data-testid="top-bar-screen-label">{topBarScreenLabel}</span>
          </div>
          <div className="top-icons" aria-label="иконки статуса">
            {TOP_STATUS_BUTTONS.map((item) => (
              <StatusIconButton
                key={item.id}
                icon={item.icon}
                label={item.label}
                tone={item.tone}
                showNotificationDot={item.showNotificationDot}
                className={activeTopPopup === item.id ? 'is-active' : undefined}
                aria-haspopup="dialog"
                aria-expanded={activeTopPopup === item.id}
                onClick={() => openTopPopup(item.id)}
                ref={(node) => setTopButtonRef(item.id, node)}
              />
            ))}
          </div>
        </header>

        <div className={`content-grid ${isFilesScreenActive ? 'is-files-active' : ''}`}>
          {activeScreen === 'dashboard' ? (
            hasActivePrint ? (
              <>
              <section className="job-card">
                <div className="preview-panel">
                  <div className="preview-inner">
                    <PrintPreviewIcon />
                  </div>
                </div>

                <div className="job-info">
                  <p className="job-name">{activePrintFileName ?? DASHBOARD_VALUES.fileName}</p>

                  <div className="job-metrics">
                    <div>
                      <p className="label">Прогресс</p>
                      <p className="job-main-value">{DASHBOARD_VALUES.progressPercent}%</p>
                    </div>
                    <div className="job-metrics-right">
                      <p className="label">Конец</p>
                      <p className="job-main-value">{DASHBOARD_VALUES.etaTime}</p>
                    </div>
                  </div>

                  <div className="job-meter">
                    <div className="job-meter-fill" style={{ width: `${printFill}%` }} />
                  </div>

                  <div className="job-layer-row">
                    <span className="label">Слой</span>
                    <strong>
                      {DASHBOARD_VALUES.layerCurrent} / {DASHBOARD_VALUES.layerTotal}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="right-column">
                <div className="stats-actions-row">
                  <article className="stats-card">
                    <div className="temp-grid">
                      {temperatureMetrics.map((metric) => (
                        <TemperatureMetric
                          key={metric.label}
                          label={metric.label}
                          current={metric.current}
                          target={metric.target}
                          meterTone={metric.meterTone}
                          fillPercent={metric.fillPercent}
                        />
                      ))}
                    </div>

                    <div className="three-up-grid">
                      {quickMetrics.map((metric) => (
                        <PlainMetric
                          key={metric.label}
                          label={metric.label}
                          value={metric.value}
                          unit={metric.unit}
                          valueClassName={metric.valueClassName}
                        />
                      ))}
                    </div>
                  </article>

                  <div className="action-stack" role="group" aria-label="действия печати">
                    <ActionSquareButton
                      icon="actionPause"
                      label={pendingCommand === 'pause' ? 'Пауза...' : 'Пауза'}
                      onClick={() => void handlePause()}
                      disabled={isBusy}
                    />
                    <ActionSquareButton
                      icon="actionStopCritical"
                      tone="danger"
                      label={pendingCommand === 'cancel' ? 'Стоп...' : 'Стоп'}
                      onClick={handleStopRequest}
                      disabled={isBusy}
                    />
                  </div>
                </div>

                <div className="process-row">
                  <article className="process-card">
                    <div className="process-grid">
                      {processMetrics.map((metric) => (
                        <PlainMetric
                          key={metric.label}
                          label={metric.label}
                          value={metric.value}
                          unit={metric.unit}
                          valueClassName="process-value"
                        />
                      ))}
                    </div>
                  </article>

                  <aside className="zoffset-card">
                    <div className="zoffset-head">
                      <p className="label">Z-offset</p>
                      <p className="value zoffset-value">
                        {DASHBOARD_VALUES.zOffsetMm.toFixed(2)}<span>мм</span>
                      </p>
                    </div>
                    <div
                      className="step-selector"
                      role="group"
                      aria-label="шаг babystep"
                      style={{ '--step-active-index': String(babystepActiveIndex) } as CSSProperties}
                    >
                      <span className="step-selector-indicator" aria-hidden="true" />
                      {BABYSTEP_STEP_OPTIONS.map((step) => (
                        <button
                          key={step}
                          type="button"
                          className={`step-btn ${babystepStep === step ? 'is-active' : ''}`}
                          onClick={() => setBabystepStep(step)}
                          aria-pressed={babystepStep === step}
                        >
                          {step}
                        </button>
                      ))}
                    </div>
                    <div className="babystep-controls" role="group" aria-label="управление babystep">
                      <button
                        type="button"
                        className="babystep-btn"
                        aria-label={`Babystep минус ${babystepStep}`}
                      >
                        -
                      </button>
                      <button
                        type="button"
                        className="babystep-btn"
                        aria-label={`Babystep плюс ${babystepStep}`}
                      >
                        +
                      </button>
                    </div>
                  </aside>
                </div>
              </section>
              </>
            ) : (
              <section className="dashboard-idle-screen" data-testid="screen-dashboard-idle">
                <div className="dashboard-idle-hero">
                  <div className="dashboard-idle-logo" aria-hidden="true">
                    <img className="dashboard-idle-logo-image" src={treeDLogoAsset} alt="" />
                  </div>
                </div>

                <aside className="dashboard-idle-sidebar">
                  <article className="idle-mini-widget idle-mini-widget-temps">
                    <p className="idle-mini-label">Температура</p>
                    <div className="idle-temp-grid">
                      <p><span>Сопло</span><strong>{idleNozzleTempLabel}</strong></p>
                      <p><span>Стол</span><strong>{idleBedTempLabel}</strong></p>
                    </div>
                  </article>

                  <article className="idle-mini-widget idle-mini-widget-service">
                    <p className="idle-mini-label">ТО</p>
                    <div className="idle-service-metrics">
                      <p><span>Пробег</span><strong>{MAINTENANCE_STATUS.runtimeHours} ч</strong></p>
                      <p><span>До ТО</span><strong>{MAINTENANCE_STATUS.hoursLeft} ч</strong></p>
                    </div>
                    <div className="idle-service-time">
                      <span>Время</span>
                      <strong>{formattedSnapshotTime}</strong>
                    </div>
                  </article>

                  <article className="dashboard-idle-notes" aria-label="Заметки">
                    <h3>Заметки</h3>
                    <textarea
                      ref={idleNotesInputRef}
                      className="dashboard-idle-notes-input"
                      value={idleNotesText}
                      onFocus={handleIdleNotesKeyboardOpen}
                      onChange={handleIdleNotesChange}
                      spellCheck={false}
                      data-testid="idle-notes-input"
                    />
                  </article>
                </aside>

                {isIdleNotesKeyboardOpen ? (
                  <div className="idle-notes-keyboard" data-testid="idle-notes-keyboard">
                    {IDLE_NOTES_KEYBOARD_ROWS.map((row, rowIndex) => (
                      <div className="idle-notes-keyboard-row" key={`idle-notes-keyboard-row-${rowIndex}`}>
                        {row.map((label) => (
                          <button
                            key={label}
                            type="button"
                            className="idle-notes-keyboard-key"
                            aria-label={`Символ ${label}`}
                            onMouseDown={handleIdleNotesKeyMouseDown}
                            onClick={() => handleIdleNotesVirtualKey(label.toLocaleLowerCase('ru-RU'))}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    ))}

                    <div className="idle-notes-keyboard-row idle-notes-keyboard-row-actions">
                      <button
                        type="button"
                        className="idle-notes-keyboard-key idle-notes-keyboard-key-action"
                        aria-label="Удалить символ"
                        onMouseDown={handleIdleNotesKeyMouseDown}
                        onClick={() => handleIdleNotesVirtualKey('backspace')}
                      >
                        ⌫
                      </button>
                      <button
                        type="button"
                        className="idle-notes-keyboard-key idle-notes-keyboard-key-space"
                        aria-label="Пробел"
                        onMouseDown={handleIdleNotesKeyMouseDown}
                        onClick={() => handleIdleNotesVirtualKey('space')}
                      >
                        Пробел
                      </button>
                      <button
                        type="button"
                        className="idle-notes-keyboard-key idle-notes-keyboard-key-action"
                        aria-label="Новая строка"
                        onMouseDown={handleIdleNotesKeyMouseDown}
                        onClick={() => handleIdleNotesVirtualKey('enter')}
                      >
                        ↵
                      </button>
                      <button
                        type="button"
                        className="idle-notes-keyboard-key idle-notes-keyboard-key-close"
                        aria-label="Скрыть клавиатуру"
                        onMouseDown={handleIdleNotesKeyMouseDown}
                        onClick={handleIdleNotesKeyboardClose}
                      >
                        Скрыть
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>
            )
          ) : isFilesScreenActive ? (
            <section className="files-screen" data-testid="screen-files">
              <div className="files-scroll-area" data-testid="files-scroll-area">
                <header className="files-screen-head">
                  <div className="files-screen-copy">
                    <p className="files-screen-note">Прокрутите вниз, чтобы найти нужную модель.</p>
                  </div>
                  <div className="files-sort-group" role="group" aria-label="Сортировка файлов">
                    <span className="files-sort-indicator" aria-hidden="true" />
                    {FILES_SORT_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`files-sort-btn ${filesSortKey === option.id ? 'is-active' : ''}`}
                        aria-pressed={filesSortKey === option.id}
                        data-testid={`files-sort-${option.id}`}
                        onClick={() => handleFilesSortChange(option.id)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </header>

                <div className="files-grid" data-testid="file-card-grid">
                  {sortedPrintFiles.length > 0 ? (
                    sortedPrintFiles.map((item) => (
                      <PrintFileCard
                        key={item.id}
                        name={item.name}
                        printTime={item.printTime}
                        weight={item.weight}
                        onClick={() => handlePrintFileSelect(item.id)}
                      />
                    ))
                  ) : (
                    <p className="files-empty">Список файлов пуст.</p>
                  )}
                </div>
              </div>
            </section>
          ) : activeScreen === 'control' ? (
            <section className="control-screen" data-testid="screen-control">
              <div className="control-scroll-area">
                <header className="control-screen-head">
                  <p className="control-screen-note">Парковка, сервисный режим и ручное перемещение осей.</p>
                </header>

                <div className="control-grid">
                  <div className="control-side-stack">
                    <div className="control-side-top">
                      <article className="control-card control-card-parking">
                        <h3 className="control-card-title">Парковка</h3>
                        <SegmentedToggle
                          options={PARKING_MODE_OPTIONS}
                          value={parkingMode}
                          onChange={handleParkingModeChange}
                          ariaLabel="Режим парковки"
                          testIdPrefix="parking-mode"
                        />
                        {parkingMode === 'axis' ? (
                          <SegmentedToggle
                            options={PARKING_AXIS_OPTIONS}
                            value={parkingAxis}
                            onChange={handleParkingAxisChange}
                            ariaLabel="Выбор оси парковки"
                            testIdPrefix="parking-axis"
                          />
                        ) : null}
                        <button
                          type="button"
                          className="control-action-btn"
                          data-testid="parking-action-button"
                          onClick={() => void handleParkingCommand()}
                          disabled={isBusy}
                        >
                          {pendingCommand === 'home'
                            ? 'Парковка...'
                            : parkingMode === 'all'
                              ? 'Парковка по всем осям'
                              : `Парковка оси ${parkingAxis}`}
                        </button>

                        <button
                          type="button"
                          className="control-action-btn control-action-btn-danger"
                          data-testid="motors-disable-button"
                          onClick={handleMotorsDisable}
                          disabled={isBusy}
                        >
                          Отключить моторы
                        </button>
                      </article>

                      <article className="control-card control-card-service">
                        <h3 className="control-card-title">Сервисный режим</h3>
                        <p className="control-status-row">
                          <span>Статус</span>
                          <strong>{isServiceModeEnabled ? 'Включен' : 'Выключен'}</strong>
                        </p>
                        <button
                          type="button"
                          className="control-service-btn"
                          data-testid="service-mode-button"
                          aria-pressed={isServiceModeEnabled}
                          onClick={handleServiceModeToggle}
                        >
                          {isServiceModeEnabled ? 'Выключить сервисный режим' : 'Включить сервисный режим'}
                        </button>
                        <p className="control-card-hint">Используйте только во время обслуживания принтера.</p>
                      </article>
                    </div>

                    <article className="control-card control-card-fan">
                      <h3 className="control-card-title">Управление обдувом</h3>
                      <p className="control-status-row">
                        <span>Обдув модели</span>
                        <strong>{modelFanPercent}%</strong>
                      </p>
                      <HorizontalSteppedSlider
                        value={modelFanPercent}
                        min={MODEL_FAN_BOUNDS_PERCENT.min}
                        max={MODEL_FAN_BOUNDS_PERCENT.max}
                        step={MODEL_FAN_STEP_PERCENT}
                        onChange={handleModelFanPercentChange}
                        disabled={isBusy}
                        testId="model-fan-slider"
                      />
                    </article>
                  </div>

                  <article className="control-card control-card-motion">
                    <h3 className="control-card-title">Перемещение по осям</h3>
                    <SegmentedToggle
                      options={MOVEMENT_MODE_OPTIONS}
                      value={movementMode}
                      onChange={handleMovementModeChange}
                      ariaLabel="Режим перемещения"
                      testIdPrefix="move-mode"
                    />
                    {movementMode === 'buttons' ? (
                      <div className="control-motion-buttons">
                        <SegmentedToggle
                          options={MOVE_STEP_OPTIONS}
                          value={moveStepKey}
                          onChange={handleMoveStepChange}
                          ariaLabel="Шаг перемещения"
                          testIdPrefix="move-step"
                        />
                        <div className="control-coordinates-panel">
                          <p className="joystick-readout" data-testid="axis-coordinates">{axisCoordinatesLabel}</p>
                        </div>
                        <div className="control-cross-wrap">
                          <AxisCrossControls
                            onMove={handleAxisMove}
                            disabled={isBusy}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="joystick-panel">
                        <div className="joystick-xy-control">
                          <p className="joystick-axis-title">XY</p>
                          <VirtualJoystick
                            testId="axis-joystick"
                            disabled={isBusy}
                            onVectorChange={handleJoystickVectorChange}
                          />
                        </div>
                        <div className="joystick-z-control">
                          <p className="joystick-axis-title">Z</p>
                          <VerticalAxisSlider
                            value={printHeadPosition.z}
                            min={HEAD_Z_BOUNDS_MM.min}
                            max={HEAD_Z_BOUNDS_MM.max}
                            step={1}
                            onChange={handleJoystickZChange}
                            minAtTop
                            disabled={isBusy}
                            testId="axis-z-slider"
                          />
                        </div>
                        <div className="joystick-meta">
                          <div className="joystick-meta-block">
                            <p className="joystick-meta-label">Координаты</p>
                            <p className="joystick-readout" data-testid="axis-coordinates">{axisCoordinatesLabel}</p>
                          </div>
                          <div className="joystick-meta-block">
                            <p className="joystick-meta-label">Скорость XY</p>
                            <p className="joystick-readout">{joystickSpeedMmS.toFixed(1)} / 50 мм/с</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                </div>

              </div>
            </section>
          ) : (
            <section className="screen-placeholder" data-testid={`screen-${activeScreen}`}>
              <p className="screen-placeholder-body">{SCREEN_PLACEHOLDERS[activeScreen].description}</p>
            </section>
          )}
        </div>

        <nav
          className="bottom-nav"
          aria-label="Основная навигация"
          style={{ '--nav-active-index': String(activeNavIndex) } as CSSProperties}
        >
          <span className="bottom-nav-indicator" aria-hidden="true" />
          {BOTTOM_NAV_ITEMS.map((item) => (
            <NavItemButton
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={item.id === activeScreen}
              aria-current={item.id === activeScreen ? 'page' : undefined}
              onClick={() => setActiveScreen(item.id)}
            />
          ))}
        </nav>

        {selectedPrintFile !== null ? (
          <div className="file-modal-layer" role="presentation" onClick={closeFileModal}>
            <section
              className="file-modal-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={FILE_MODAL_TITLE_ID}
              data-testid="print-file-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="file-modal-head">
                <h2 id={FILE_MODAL_TITLE_ID}>Файл печати</h2>
                <button type="button" className="file-modal-close" aria-label="Закрыть окно файла" onClick={closeFileModal}>
                  ×
                </button>
              </header>

              <div className="file-modal-preview" aria-hidden="true">
                <PrintPreviewIcon />
              </div>

              <p className="file-modal-name">{selectedPrintFile.name}</p>

              <dl className="file-modal-meta">
                <div>
                  <dt>Время печати</dt>
                  <dd>{selectedPrintFile.printTime}</dd>
                </div>
                <div>
                  <dt>Масса</dt>
                  <dd>{selectedPrintFile.weight}</dd>
                </div>
                <div>
                  <dt>Материал</dt>
                  <dd>{selectedPrintFile.material}</dd>
                </div>
              </dl>

              <div className="file-modal-actions">
                <button
                  type="button"
                  className="file-modal-action"
                  data-testid="print-file-start-button"
                  onClick={() => void handleStartSelectedFile()}
                  disabled={isBusy}
                >
                  {pendingCommand === 'start' ? 'Запуск...' : 'Старт печати'}
                </button>
                <button
                  type="button"
                  className="file-modal-action file-modal-action-danger"
                  data-testid="print-file-delete-button"
                  onClick={handleDeleteSelectedFile}
                  disabled={isBusy}
                >
                  Удалить файл
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {isPrintCancelConfirmOpen ? (
          <div className="print-cancel-modal-layer" role="presentation" onClick={closePrintCancelConfirm}>
            <section
              className="print-cancel-modal-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={PRINT_CANCEL_MODAL_TITLE_ID}
              data-testid="print-cancel-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="print-cancel-modal-head">
                <h2 id={PRINT_CANCEL_MODAL_TITLE_ID}>Подтвердите отмену печати</h2>
                <button
                  type="button"
                  className="print-cancel-modal-close"
                  aria-label="Закрыть окно подтверждения отмены печати"
                  onClick={closePrintCancelConfirm}
                  disabled={isBusy}
                >
                  ×
                </button>
              </header>

              <p className="print-cancel-modal-body">
                Текущая задача будет остановлена. Вы уверены, что хотите отменить печать?
              </p>

              <div className="print-cancel-modal-actions">
                <button
                  type="button"
                  className="file-modal-action"
                  data-testid="print-cancel-close-button"
                  onClick={closePrintCancelConfirm}
                  disabled={isBusy}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="file-modal-action file-modal-action-danger"
                  data-testid="print-cancel-confirm-button"
                  onClick={() => void handleStopConfirm()}
                  disabled={isBusy}
                >
                  {pendingCommand === 'cancel' ? 'Остановка...' : 'Остановить печать'}
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {activeTopPopup !== null ? (
          <div className="top-popup-layer" role="presentation" onClick={closeTopPopup}>
            <section
              className="top-popup-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="top-popup-title"
              data-testid={`top-popup-${activeTopPopup}`}
              style={
                topPopupPosition
                  ? ({
                      top: `${topPopupPosition.top}px`,
                      left: `${topPopupPosition.left}px`,
                      '--top-popup-arrow-left': `${topPopupPosition.arrowLeft}px`,
                    } as CSSProperties)
                  : undefined
              }
              onClick={(event) => event.stopPropagation()}
            >
              <header className="top-popup-head">
                <h2 id="top-popup-title">{TOP_BAR_POPUP_TITLES[activeTopPopup]}</h2>
                <button type="button" className="top-popup-close" aria-label="Закрыть окно" onClick={closeTopPopup}>
                  ×
                </button>
              </header>

              {activeTopPopup === 'wifi' ? (
                <div className="top-popup-content">
                  <dl className="top-popup-kv">
                    <div>
                      <dt>Статус сети</dt>
                      <dd>{connectionLabel}</dd>
                    </div>
                    <div>
                      <dt>Wi-Fi сеть</dt>
                      <dd>{wifiSsidLabel}</dd>
                    </div>
                    <div>
                      <dt>IP адрес</dt>
                      <dd>{wifiIpLabel}</dd>
                    </div>
                    <div>
                      <dt>Время</dt>
                      <dd>{formattedSnapshotTime}</dd>
                    </div>
                  </dl>
                  <div className="top-popup-actions">
                    <button type="button" className="top-popup-action" onClick={openWifiSettings}>
                      Перейти в настройки Wi-Fi
                    </button>
                  </div>
                </div>
              ) : null}

              {activeTopPopup === 'cloud' ? (
                <div className="top-popup-content">
                  <dl className="top-popup-kv">
                    <div>
                      <dt>Состояние</dt>
                      <dd>{cloudStatusLabel}</dd>
                    </div>
                  </dl>
                  <a
                    className="top-popup-qr-link"
                    href={CLOUD_LINK_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Открыть treed.pro для добавления устройства"
                  >
                    <img
                      className="top-popup-qr-image"
                      src={CLOUD_QR_IMAGE_URL}
                      alt="QR-код для перехода на treed.pro"
                    />
                    <span>Сканируйте QR или откройте treed.pro</span>
                  </a>
                </div>
              ) : null}

              {activeTopPopup === 'notifications' ? (
                <div className="top-popup-content">
                  <p className="top-popup-note">Последнее сообщение от принтера:</p>
                  <ul className="top-popup-list">
                    <li>{snapshot.message}</li>
                  </ul>
                  <p className="top-popup-secondary">Новые системные уведомления будут добавляться в этот список.</p>
                </div>
              ) : null}

              {activeTopPopup === 'power' ? (
                <div className="top-popup-content">
                  <p className="top-popup-warning">
                    Выключение принтера остановит текущую задачу и потребует ручного запуска питания.
                  </p>
                  <div className="top-popup-actions">
                    <button type="button" className="top-popup-action top-popup-action-danger" onClick={handlePowerShutdownPlaceholder}>
                      Выключить принтер
                    </button>
                    <button type="button" className="top-popup-action" onClick={closeTopPopup}>
                      Отмена
                    </button>
                  </div>
                  {powerPopupNotice ? <p className="top-popup-secondary">{powerPopupNotice}</p> : null}
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default App
