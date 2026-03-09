import { moonrakerUrl } from '../../config'
import type { CommandClient, CommandResult, ExecuteCommandArgs } from './types'

type MoonrakerEnvelope = {
  error?: {
    message?: string
  }
}

async function parseMoonrakerError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as MoonrakerEnvelope
    if (payload.error?.message) {
      return payload.error.message
    }
  } catch {
    // Ignore parse errors and return HTTP status below.
  }

  return `HTTP ${response.status}`
}

async function callMoonraker(path: string, init?: RequestInit): Promise<void> {
  const response = await fetch(`${moonrakerUrl}${path}`, {
    method: 'POST',
    ...init,
  })

  if (!response.ok) {
    throw new Error(await parseMoonrakerError(response))
  }
}

function commandSuccessMessage(args: ExecuteCommandArgs): string {
  switch (args.command) {
    case 'start':
      return `Print started: ${args.filename ?? '<empty>'}`
    case 'pause':
      return 'Pause request sent'
    case 'resume':
      return 'Resume request sent'
    case 'cancel':
      return 'Cancel request sent'
    case 'home':
      return 'G28 sent'
    case 'emergencyStop':
      return 'Emergency stop sent'
    default:
      return 'Command sent'
  }
}

export function createMoonrakerCommandClient(): CommandClient {
  return {
    async execute(args: ExecuteCommandArgs): Promise<CommandResult> {
      switch (args.command) {
        case 'start': {
          const filename = (args.filename ?? '').trim()

          if (!filename) {
            throw new Error('Please provide a file name to start printing')
          }

          await callMoonraker(
            `/printer/print/start?filename=${encodeURIComponent(filename)}`,
          )
          break
        }
        case 'pause':
          await callMoonraker('/printer/print/pause')
          break
        case 'resume':
          await callMoonraker('/printer/print/resume')
          break
        case 'cancel':
          await callMoonraker('/printer/print/cancel')
          break
        case 'home':
          await callMoonraker('/printer/gcode/script', {
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              script: 'G28',
            }),
          })
          break
        case 'emergencyStop':
          await callMoonraker('/printer/emergency_stop')
          break
        default:
          throw new Error('Unknown command')
      }

      return {
        command: args.command,
        ok: true,
        message: commandSuccessMessage(args),
        at: new Date().toISOString(),
      }
    },
  }
}
