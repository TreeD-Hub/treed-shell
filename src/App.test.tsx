import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'

describe('App', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('renders layout according to landscape dashboard frame', async () => {
    render(<App />)

    expect(screen.getByTestId('screen-shell')).toBeInTheDocument()
    expect(screen.getByText('TreeD Принтер')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Печать')).toBeInTheDocument()
    })
    expect(screen.getByText('Обдув')).toBeInTheDocument()
    expect(
      screen.getByText((_, element) => {
        if (!element) {
          return false
        }
        return element.textContent === '215/220°C'
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /Основная навигация/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Уведомления' })).toBeInTheDocument()
    expect(screen.getByText('Ускорение')).toBeInTheDocument()
    expect(screen.getByText('Объемный расход')).toBeInTheDocument()
    expect(screen.getByText('Откат')).toBeInTheDocument()
    expect(screen.getByText('Z-offset')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'шаг babystep' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '0.1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '0.05' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '0.025' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Пауза' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Стоп' })).toBeInTheDocument()
  })

  it('handles pause command from action stack', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Пауза' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Пауза|Пауза.../i })).toBeInTheDocument()
    })
  })

  it('enables one-to-one preview mode via query flag', () => {
    window.history.replaceState({}, '', '/?view=1x1')
    render(<App />)

    const shell = screen.getByTestId('screen-shell')
    expect(shell.closest('main')).toHaveClass('is-one-to-one')
  })
})
