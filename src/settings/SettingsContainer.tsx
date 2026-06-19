import { SettingsPage, type SettingsPageProps } from './SettingsPage'

export type SettingsContainerProps = SettingsPageProps

export function SettingsContainer(props: SettingsContainerProps) {
  return <SettingsPage {...props} />
}
