export type PrinterCommandId =
  | 'start'
  | 'pause'
  | 'resume'
  | 'cancel'
  | 'home'
  | 'emergencyStop'

export interface ExecuteCommandArgs {
  command: PrinterCommandId
  filename?: string
}

export interface CommandResult {
  command: PrinterCommandId
  ok: true
  message: string
  at: string
}

export interface CommandClient {
  execute: (args: ExecuteCommandArgs) => Promise<CommandResult>
}
