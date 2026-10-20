import { useEffect } from 'react'
import type { MutableRefObject } from 'react'
import { useBlocker } from 'react-router-dom'
import { App } from 'antd'
import { useTranslation } from 'react-i18next'
/** Confirms router exits and browser unloads while a draft has unsaved changes. @param dirty - Whether edits differ from saved data. @param allow - Allows navigation after a successful save. @returns Nothing. */
export function useUnsavedPackage(dirty: boolean, allow: MutableRefObject<boolean>) {
  const { modal } = App.useApp()
  const { t } = useTranslation('packages')
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      !allow.current &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search)
  )
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    const dialog = modal.confirm({
      title: t('editor.unsavedTitle'),
      content: t('editor.unsaved'),
      okText: t('editor.leave'),
      cancelText: t('editor.keepEditing'),
      onOk: () => blocker.proceed(),
      onCancel: () => blocker.reset()
    })
    return () => dialog.destroy()
  }, [blocker, modal, t])
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty && !allow.current) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty, allow])
}
