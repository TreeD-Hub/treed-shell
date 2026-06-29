import { EddyCalibrationScreen } from './EddyCalibrationScreen'
import type { ExecuteCommandArgs, PrinterCommandId } from '../core/commands'
import type { PrinterSnapshot } from '../core/transport/types'

export type MacrosContainerProps = {
  snapshot: PrinterSnapshot
  pendingCommand: PrinterCommandId | null
  executeCommand: (args: ExecuteCommandArgs) => Promise<boolean>
  getCommandBlockReason: (command: PrinterCommandId, args?: ExecuteCommandArgs) => string | null
}

export function MacrosContainer(props: MacrosContainerProps) {
  return <EddyCalibrationScreen {...props} />
}
