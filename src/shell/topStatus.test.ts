import { describe, expect, it } from 'vitest'
import {
  POWER_MENU_ACTIONS,
  resolveTopPopupPosition,
} from './topStatus'

describe('top status popup helpers', () => {
  it('keeps fallback popup position inside the 5-inch shell canvas', () => {
    const position = resolveTopPopupPosition({
      id: 'power',
      shellWidth: 960,
      anchorBottomY: 0,
    })

    expect(position.top).toBe(8)
    expect(position.left).toBeGreaterThanOrEqual(8)
    expect(position.left + 360).toBeLessThanOrEqual(952)
    expect(position.arrowLeft).toBeGreaterThanOrEqual(18)
    expect(position.arrowLeft).toBeLessThanOrEqual(342)
  })

  it('keeps dangerous host power actions explicit', () => {
    expect(POWER_MENU_ACTIONS.map((action) => action.command)).toEqual([
      'restartKlipper',
      'firmwareRestart',
      'restartMoonraker',
      'rebootHost',
      'shutdownHost',
    ])
    expect(POWER_MENU_ACTIONS.filter((action) => action.tone === 'danger').map((action) => action.command)).toEqual([
      'rebootHost',
      'shutdownHost',
    ])
  })
})
