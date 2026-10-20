import type { HajjPackage, ServiceProvider } from './domain'
export interface EditorStepProps {
  item: HajjPackage
  onChange: (item: HajjPackage) => void
  providers?: ServiceProvider[]
}
