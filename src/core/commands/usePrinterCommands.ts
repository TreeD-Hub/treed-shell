import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createCommandClient } from '#runtime'
import { getTreeDCommandBlockReason, type TreeDCommandRuntimeContext } from './catalog'
import type { CommandResult, ExecuteCommandArgs, PrinterCommandId } from './types'

type QueuedCoalescedCommand = {
  args: ExecuteCommandArgs
  resolve: (value: boolean) => void
}

const COALESCED_COMMAND_RATE_LIMIT_MS = 120
const COALESCED_COMMANDS = new Set<PrinterCommandId>([
  'setFanPercent',
  'setPrintSpeedFactorPercent',
  'setPrintFlowFactorPercent',
  'setPrintAccel',
  'setPressureAdvance',
  'setRetractionLength',
])

function isCoalescedCommand(command: PrinterCommandId): boolean {
  return COALESCED_COMMANDS.has(command)
}

export function usePrinterCommands(runtimeContext: TreeDCommandRuntimeContext) {
  const powerCapability = runtimeContext.capabilities.power
  const [pendingCommand, setPendingCommand] = useState<PrinterCommandId | null>(
    null,
  )
  const [error, setError] = useState('')
  const lastErrorRef = useRef('')
  const [lastResult, setLastResult] = useState<CommandResult | null>(null)
  const activeCommandRef = useRef<PrinterCommandId | null>(null)
  const queuedCoalescedCommandsRef = useRef<Map<PrinterCommandId, QueuedCoalescedCommand>>(new Map())
  const coalescedCommandTimersRef = useRef<Map<PrinterCommandId, number>>(new Map())
  const lastCoalescedCommandRunAtRef = useRef<Map<PrinterCommandId, number>>(new Map())
  const runtimeContextRef = useRef(runtimeContext)

  const client = useMemo(() => {
    return createCommandClient({ capabilities: { power: powerCapability } })
  }, [powerCapability])

  runtimeContextRef.current = runtimeContext

  const executeCommand = useCallback(
    async (args: ExecuteCommandArgs): Promise<boolean> => {
      const { command } = args

      function runQueuedCommand(commandToRun?: PrinterCommandId): void {
        if (activeCommandRef.current !== null) {
          return
        }

        const nextEntry = commandToRun === undefined
          ? queuedCoalescedCommandsRef.current.entries().next().value
          : [commandToRun, queuedCoalescedCommandsRef.current.get(commandToRun)] as const
        if (nextEntry === undefined || nextEntry[1] === undefined) {
          return
        }

        const [queuedCommand, queued] = nextEntry
        queuedCoalescedCommandsRef.current.delete(queuedCommand)
        const timerId = coalescedCommandTimersRef.current.get(queuedCommand)
        if (timerId !== undefined) {
          window.clearTimeout(timerId)
          coalescedCommandTimersRef.current.delete(queuedCommand)
        }
        void executeCommand(queued.args).then(queued.resolve)
      }

      function scheduleQueuedCommand(queuedCommand: PrinterCommandId, delayMs: number): void {
        if (coalescedCommandTimersRef.current.has(queuedCommand)) {
          return
        }

        const timerId = window.setTimeout(() => {
          coalescedCommandTimersRef.current.delete(queuedCommand)
          runQueuedCommand(queuedCommand)
        }, delayMs)
        coalescedCommandTimersRef.current.set(queuedCommand, timerId)
      }

      function queueCoalescedCommand(delayMs?: number): Promise<boolean> {
        const previousQueuedCommand = queuedCoalescedCommandsRef.current.get(command)
        previousQueuedCommand?.resolve(false)

        return new Promise<boolean>((resolve) => {
          queuedCoalescedCommandsRef.current.set(command, {
            args,
            resolve,
          })

          if (delayMs !== undefined) {
            scheduleQueuedCommand(command, delayMs)
          }
        })
      }

      if (activeCommandRef.current !== null) {
        if (isCoalescedCommand(command)) {
          return queueCoalescedCommand()
        }

        return false
      }

      if (isCoalescedCommand(command)) {
        const lastRunAt = lastCoalescedCommandRunAtRef.current.get(command)
        if (lastRunAt !== undefined) {
          const delayMs = COALESCED_COMMAND_RATE_LIMIT_MS - (Date.now() - lastRunAt)
          if (delayMs > 0) {
            return queueCoalescedCommand(delayMs)
          }
        }
      }

      const blockReason = getTreeDCommandBlockReason(command, runtimeContextRef.current, args)
      if (blockReason !== null) {
        const result: CommandResult = {
          command,
          ok: false,
          kind: 'unsupported',
          message: blockReason,
          at: new Date().toISOString(),
        }
        lastErrorRef.current = blockReason
        setError(blockReason)
        setLastResult(result)
        return false
      }

      activeCommandRef.current = command
      if (isCoalescedCommand(command)) {
        lastCoalescedCommandRunAtRef.current.set(command, Date.now())
      }
      setPendingCommand(command)
      lastErrorRef.current = ''
      setError('')

      try {
        const result = await client.execute(args)
        setLastResult(result)
        if (!result.ok) {
          lastErrorRef.current = result.message
          setError(result.message)
          return false
        }

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown command error'
        lastErrorRef.current = message
        setError(message)
        return false
      } finally {
        activeCommandRef.current = null
        setPendingCommand(null)
        runQueuedCommand()
      }
    },
    [client],
  )

  useEffect(() => {
    const coalescedCommandTimers = coalescedCommandTimersRef.current
    const queuedCoalescedCommands = queuedCoalescedCommandsRef.current

    return () => {
      for (const timerId of coalescedCommandTimers.values()) {
        window.clearTimeout(timerId)
      }
      coalescedCommandTimers.clear()
      for (const queued of queuedCoalescedCommands.values()) {
        queued.resolve(false)
      }
      queuedCoalescedCommands.clear()
    }
  }, [])

  const clearCommandError = useCallback(() => {
    lastErrorRef.current = ''
    setError('')
  }, [])

  const getLastCommandError = useCallback(() => lastErrorRef.current, [])

  return {
    pendingCommand,
    error,
    lastResult,
    executeCommand,
    clearCommandError,
    getLastCommandError,
  }
}
