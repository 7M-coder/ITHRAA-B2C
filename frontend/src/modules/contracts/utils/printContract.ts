const CONTRACT_DOCUMENT_ID = 'contract-print-root'

/** Opens a clean print document containing only the rendered contract, avoiding blank app pages. @returns Whether a printable window was opened. */
export function printContractDocument(): boolean {
  const contract = document.getElementById(CONTRACT_DOCUMENT_ID)
  if (!contract) return false
  const printWindow = window.open('', '_blank')
  if (!printWindow) return false

  const styles = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((style) => style.outerHTML)
    .join('\n')
  const baseUrl = `${window.location.origin}/`
  const language = contract.dir === 'ltr' ? 'en' : 'ar'
  const title =
    language === 'en' ? 'Fixed-Term Organizer Employment Contract' : 'عقد عمل محدد المدة للمنظم'
  printWindow.document.open()
  printWindow.document.write(`<!doctype html>
    <html lang="${language}" dir="${contract.dir || 'rtl'}">
      <head>
        <meta charset="utf-8" />
        <base href="${baseUrl}" />
        <title>${title}</title>
        ${styles}
      </head>
      <body>${contract.outerHTML}</body>
    </html>`)
  printWindow.document.close()

  const printWhenReady = () => {
    const images = Array.from(printWindow.document.images)
    const resources: Promise<unknown>[] = images.map((image) =>
      image.decode().catch(() => undefined)
    )
    if (printWindow.document.fonts) resources.push(printWindow.document.fonts.ready)
    void Promise.all(resources).then(() => {
      printWindow.focus()
      printWindow.print()
    })
    printWindow.addEventListener('afterprint', () => printWindow.close(), { once: true })
  }
  if (printWindow.document.readyState === 'complete') printWhenReady()
  else printWindow.addEventListener('load', printWhenReady, { once: true })
  return true
}
