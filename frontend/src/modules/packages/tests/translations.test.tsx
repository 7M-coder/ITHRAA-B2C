import { expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import i18n from 'i18next'
import ar from '../../../../public/locales/ar/packages.json'
import en from '../../../../public/locales/en/packages.json'
import { usePackageTranslations } from '../hooks/usePackageTranslations'

it('refreshes an already loaded older dictionary and updates the translated room label', async () => {
  await i18n.changeLanguage('ar')
  const original = structuredClone(i18n.getResourceBundle('ar', 'packages'))
  const stale = structuredClone(original)
  delete stale.editor.roomTypesLabel
  i18n.removeResourceBundle('ar', 'packages')
  i18n.addResourceBundle('ar', 'packages', stale)
  const reload = vi.spyOn(i18n, 'reloadResources').mockImplementation(async () => {
    i18n.addResourceBundle('ar', 'packages', original, true, true)
    i18n.emit('loaded', { ar: { packages: true } })
  })
  try {
    const { result, unmount } = renderHook(() => usePackageTranslations())
    await waitFor(() =>
      expect(result.current.t('editor.roomTypesLabel')).toBe('أنواع الغرف المتاحة')
    )
    expect(reload).toHaveBeenCalledWith('ar', 'packages')
    unmount()
  } finally {
    reload.mockRestore()
    i18n.addResourceBundle('ar', 'packages', original, true, true)
  }
})

/** Returns leaf paths for matching Arabic and English package dictionaries. @param value - Resource object. @param prefix - Parent key. @returns Sorted translation keys. */
function translationKeys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value)
    .flatMap(([key, item]) => {
      const path = prefix ? `${prefix}.${key}` : key
      return item && typeof item === 'object'
        ? translationKeys(item as Record<string, unknown>, path)
        : [path]
    })
    .sort()
}

it('provides matching Arabic and English keys, including dynamic room and service labels', () => {
  expect(translationKeys(ar)).toEqual(translationKeys(en))
  for (const dictionary of [ar, en]) {
    expect(dictionary.editor.roomTypesLabel).toBeTruthy()
    for (const type of ['2', '3', '4'] as const)
      expect(dictionary.editor.roomTypes[type]).toBeTruthy()
    expect(Object.keys(dictionary.editor.servicePrices.items)).toHaveLength(13)
  }
})
