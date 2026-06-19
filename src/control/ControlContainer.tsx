import type { ComponentProps } from 'react'
import { ControlPage } from './ControlPage'

export type ControlContainerProps = ComponentProps<typeof ControlPage>

export function ControlContainer(props: ControlContainerProps) {
  return <ControlPage {...props} />
}
