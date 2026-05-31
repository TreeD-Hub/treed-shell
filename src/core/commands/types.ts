export type PrinterCommandId =
  | 'start'
  | 'pause'
  | 'resume'
  | 'cancel'
  | 'emergencyStop'
  | 'home'
  | 'homeAll'
  | 'homeXY'
  | 'homeZ'
  | 'moveAxis'
  | 'setNozzleTarget'
  | 'setBedTarget'
  | 'turnOffHeaters'
  | 'setFanPercent'
  | 'loadFilament'
  | 'unloadFilament'
  | 'zParkZeroEddy'
  | 'shaperCalibrateLight'
  | 'shaperCalibrateFull'
  | 'xyMotionTest'
  | 'consoleGcode'
  | 'rebootHost'
  | 'restartKlipper'
  | 'firmwareRestart'
  | 'restartMoonraker'
  | 'shutdownHost'

export type AxisId = 'X' | 'Y' | 'Z'

export type ExecuteCommandArgs =
  | {
      command: 'start'
      filename: string
    }
  | {
      command: 'pause' | 'resume' | 'cancel' | 'emergencyStop'
    }
  | {
      command:
        | 'home'
        | 'homeAll'
        | 'homeXY'
        | 'homeZ'
        | 'turnOffHeaters'
        | 'zParkZeroEddy'
        | 'shaperCalibrateLight'
        | 'shaperCalibrateFull'
        | 'xyMotionTest'
        | 'rebootHost'
        | 'restartKlipper'
        | 'firmwareRestart'
        | 'restartMoonraker'
        | 'shutdownHost'
    }
  | {
      command: 'moveAxis'
      axis: AxisId
      distanceMm: number
      feedRateMmPerMin?: number
      speedMmS?: number
    }
  | {
      command: 'setNozzleTarget' | 'setBedTarget'
      targetCelsius: number
      wait?: boolean
    }
  | {
      command: 'setFanPercent'
      percent: number
    }
  | {
      command: 'loadFilament' | 'unloadFilament'
      lengthMm?: number
      speedMmS?: number
    }
  | {
      command: 'consoleGcode'
      gcode?: string
      script?: string
    }

export interface CommandSuccessResult {
  command: PrinterCommandId
  ok: true
  message: string
  at: string
}

export interface CommandUnsupportedResult {
  command: PrinterCommandId
  ok: false
  kind: 'unsupported'
  message: string
  at: string
}

export type CommandResult = CommandSuccessResult | CommandUnsupportedResult

export interface CommandClient {
  execute: (args: ExecuteCommandArgs) => Promise<CommandResult>
}
