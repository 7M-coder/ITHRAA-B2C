import { afterEach, describe, expect, it, vi } from 'vitest'
import { printContractDocument } from '../utils/printContract'

describe('contract print document', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('prints only the contract, without the app page content', async () => {
    document.body.innerHTML =
      '<div id="contract-print-root"><h1>Contract</h1></div><div id="app-content">Long app content</div>'
    const write = vi.fn()
    const print = vi.fn()
    const fakeWindow = {
      document: { open: vi.fn(), write, close: vi.fn(), readyState: 'complete', images: [] },
      focus: vi.fn(),
      print,
      close: vi.fn(),
      addEventListener: vi.fn()
    }
    vi.spyOn(window, 'open').mockReturnValue(fakeWindow as unknown as Window)

    expect(printContractDocument()).toBe(true)
    expect(write).toHaveBeenCalledOnce()
    const printHtml = write.mock.calls[0][0] as string
    expect(printHtml).toContain('Contract')
    expect(printHtml).not.toContain('Long app content')
    await vi.waitFor(() => expect(print).toHaveBeenCalledOnce())
  })

  it('returns false if no preview exists or the print window is blocked', () => {
    expect(printContractDocument()).toBe(false)
    document.body.innerHTML = '<div id="contract-print-root">Contract</div>'
    vi.spyOn(window, 'open').mockReturnValue(null)
    expect(printContractDocument()).toBe(false)
  })
})
