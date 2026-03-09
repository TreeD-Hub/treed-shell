import { useCallback, useMemo, useState } from 'react'
import { dataMode } from '../../config'
import { createMockCommandClient } from './mockCommandClient'
import { createMoonrakerCommandClient } from './moonrakerCommandClient'
import type { CommandResult, PrinterCommandId } from './types'

type ExecuteCommandInput = {
  command: PrinterCommandId
  filename?: string
}

export function usePrinterCommands() {
  const [pendingCommand, setPendingCommand] = useState<PrinterCommandId | null>(
    null,
  )
  const [error, setError] = useState('')
  const [lastResult, setLastResult] = useState<CommandResult | null>(null)

  const client = useMemo(() => {
    return dataMode === 'live'
      ? createMoonrakerCommandClient()
      : createMockCommandClient()
  }, [])

  const executeCommand = useCallback(
    async ({ command, filename }: ExecuteCommandInput): Promise<boolean> => {
      if (pendingCommand) {
        return false
      }

      setPendingCommand(command)
      setError('')

      try {
        const result = await client.execute({
          command,
          filename,
        })
        setLastResult(result)
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown command error'
        setError(message)
        return false
      } finally {
        setPendingCommand(null)
      }
    },
    [client, pendingCommand],
  )

  const clearCommandError = useCallback(() => {
    setError('')
  }, [])

  return {
    pendingCommand,
    error,
    lastResult,
    executeCommand,
    clearCommandError,
  }
}
