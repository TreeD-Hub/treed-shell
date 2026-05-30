import { useCallback, useMemo, useState } from 'react'
import { dataMode } from '../../config'
import { createMockCommandClient } from './mockCommandClient'
import { createMoonrakerCommandClient } from './moonrakerCommandClient'
import type { CommandResult, ExecuteCommandArgs, PrinterCommandId } from './types'

type RuntimeCommandCapabilities = {
  power?: boolean
}

export function usePrinterCommands(capabilities: RuntimeCommandCapabilities = {}) {
  const powerCapability = capabilities.power
  const [pendingCommand, setPendingCommand] = useState<PrinterCommandId | null>(
    null,
  )
  const [error, setError] = useState('')
  const [lastResult, setLastResult] = useState<CommandResult | null>(null)

  const client = useMemo(() => {
    return dataMode === 'live'
      ? createMoonrakerCommandClient({ capabilities: { power: powerCapability } })
      : createMockCommandClient()
  }, [powerCapability])

  const executeCommand = useCallback(
    async (args: ExecuteCommandArgs): Promise<boolean> => {
      const { command } = args

      if (pendingCommand) {
        return false
      }

      setPendingCommand(command)
      setError('')

      try {
        const result = await client.execute(args)
        setLastResult(result)
        if (!result.ok) {
          setError(result.message)
          return false
        }

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
