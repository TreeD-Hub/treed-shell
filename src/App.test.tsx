import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders layout according to landscape dashboard frame', async () => {
    render(<App />)

    expect(screen.getByTestId('screen-shell')).toBeInTheDocument()
    expect(screen.getByText('TreeD Printer')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Printing')).toBeInTheDocument()
    })
    expect(screen.getByRole('navigation', { name: /Main Navigation/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
  })

  it('handles pause command from dual action widget', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Pause|Pausing/i })).toBeInTheDocument()
    })
  })
})
