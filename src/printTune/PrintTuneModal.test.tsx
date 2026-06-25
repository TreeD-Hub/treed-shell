import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PrintTuneModal, type PrintTuneModalProps } from './PrintTuneModal'

function createProps(overrides: Partial<PrintTuneModalProps> = {}): PrintTuneModalProps {
  const props: PrintTuneModalProps = {
    activeGroup: 'nozzle',
    temperature: {
      currentNozzleTemp: 205,
      currentBedTemp: 58,
      nozzleTargetTemp: 210,
      bedTargetTemp: 60,
      nozzleMaxC: 300,
      bedMaxC: 120,
      chartMode: 'both',
      chartSeries: [],
      keyboardTarget: null,
      keyboardValue: '',
      renderKeyboardPanel: () => null,
      onKeyboardOpen: vi.fn(),
      onChartModeChange: vi.fn(),
      onNozzleTargetChange: vi.fn(),
      onBedTargetChange: vi.fn(),
      onPresetApply: vi.fn(),
    },
    values: {
      fanPercent: 40,
      flowPercent: 100,
      speedFactorPercent: 100,
      accelMmS2: 3000,
      kFactor: 0.04,
      retractMm: 0.8,
    },
    handlers: {
      onFanPercentChange: vi.fn(),
      onFlowPercentChange: vi.fn(),
      onSpeedFactorChange: vi.fn(),
      onAccelChange: vi.fn(),
      onKFactorChange: vi.fn(),
      onRetractChange: vi.fn(),
    },
    keyboard: {
      target: null,
      value: '',
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onDigit: vi.fn(),
      onDecimal: vi.fn(),
      onBackspace: vi.fn(),
      onSubmit: vi.fn(),
    },
    onClose: vi.fn(),
    onApply: vi.fn(),
  }

  return {
    ...props,
    ...overrides,
  }
}

describe('PrintTuneModal', () => {
  it('routes temperature preset clicks through the combined heating target handler', () => {
    const props = createProps()

    render(<PrintTuneModal {...props} />)

    fireEvent.click(screen.getByTestId('print-tune-temp-preset-abs'))

    expect(props.temperature.onPresetApply).toHaveBeenCalledWith(245, 100)
    expect(props.temperature.onNozzleTargetChange).not.toHaveBeenCalled()
    expect(props.temperature.onBedTargetChange).not.toHaveBeenCalled()
  })
})
