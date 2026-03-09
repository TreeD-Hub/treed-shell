import type { CommandClient, CommandResult, ExecuteCommandArgs } from './types'

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs)
  })
}

function buildMessage(args: ExecuteCommandArgs): string {
  switch (args.command) {
    case 'start':
      return `Mock: print start for ${args.filename ?? '<empty>'}`
    case 'pause':
      return 'Mock: print paused'
    case 'resume':
      return 'Mock: print resumed'
    case 'cancel':
      return 'Mock: print canceled'
    case 'home':
      return 'Mock: G28 sent'
    case 'emergencyStop':
      return 'Mock: emergency stop triggered'
    default:
      return 'Mock: command executed'
  }
}

export function createMockCommandClient(): CommandClient {
  return {
    async execute(args: ExecuteCommandArgs): Promise<CommandResult> {
      await wait(220)

      return {
        command: args.command,
        ok: true,
        message: buildMessage(args),
        at: new Date().toISOString(),
      }
    },
  }
}
