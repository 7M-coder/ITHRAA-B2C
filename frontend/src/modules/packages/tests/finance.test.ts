import { describe, it, expect } from 'vitest'
import { completePackage } from './fixtures'
import {
  editorData,
  optionCost,
  readiness,
  removeStay,
  packageWarnings,
  stayNights,
  financialSummary
} from '../utils/finance'
import { packageSchema } from '../validations/schemas'
import { canAssignPackage } from '../utils/domain'
import { newPackage } from '../utils/editor'
describe('package financial model', () => {
  it('supports a minimal draft with only name and season', () => {
    expect(
      packageSchema.safeParse({ ...newPackage(), name: 'Draft', season: '1448' }).success
    ).toBe(true)
  })
  it('calculates room-night costs per person and uses full-stay bed cost once', () => {
    const p = completePackage()
    const result = optionCost(p, editorData(p).options[0])
    expect(result.total).toBe(650)
    expect(result.lines.map((l) => l.amount)).toEqual([450, 200])
    expect(result.taxComplete).toBe(true)
  })
  it('distributes group costs and respects option-specific services', () => {
    const p = completePackage(),
      e = editorData(p)
    e.options.push({ ...e.options[0], id: 'option-b' })
    e.costs = [
      {
        id: 'bus',
        name: 'Bus',
        amount: 5000,
        basis: 'group',
        divisor: 46,
        optionId: null,
        tax: 'excluded'
      },
      {
        id: 'special',
        name: 'Special',
        amount: 100,
        basis: 'person',
        divisor: null,
        optionId: 'option-b',
        tax: 'unknown'
      }
    ]
    expect(optionCost(p, e.options[0]).total).toBe(758.7)
    expect(optionCost(p, e.options[1]).total).toBe(858.7)
    expect(optionCost(p, e.options[0]).taxComplete).toBe(false)
  })
  it('rounds only the sum, not individual cost lines', () => {
    const p = completePackage(),
      e = editorData(p)
    e.stays.forEach((s) => s.rooms.forEach((r) => (r.amount = 0)))
    e.costs = [1, 2, 3].map((id) => ({
      id: String(id),
      name: 'Third',
      amount: 1,
      basis: 'group' as const,
      divisor: 3,
      optionId: null,
      tax: 'included' as const
    }))
    expect(optionCost(p, e.options[0]).total).toBe(1)
  })
  it('distinguishes missing amounts from explicit zero', () => {
    const p = completePackage(),
      e = editorData(p)
    e.stays[0].rooms[1].amount = null
    expect(optionCost(p, e.options[0]).total).toBeNull()
    e.stays[0].rooms[1].amount = 0
    expect(optionCost(p, e.options[0]).total).toBe(200)
    e.options[0].approvedAmount = 0
    expect(readiness(p)).toEqual([])
  })
  it.each([-1, NaN, Infinity])('rejects invalid amount %s', (amount) => {
    const p = completePackage()
    editorData(p).stays[0].rooms[1].amount = amount
    expect(packageSchema.safeParse(p).success).toBe(false)
    expect(optionCost(p, editorData(p).options[0]).total).toBeNull()
  })
  it('rejects zero and fractional group distribution counts', () => {
    const p = completePackage(),
      e = editorData(p)
    for (const divisor of [0, -1, 1.5]) {
      e.costs = [
        {
          id: 'x',
          name: 'Bus',
          amount: 20,
          basis: 'group',
          divisor,
          optionId: null,
          tax: 'included'
        }
      ]
      expect(packageSchema.safeParse(p).success).toBe(false)
      expect(optionCost(p, e.options[0]).total).toBeNull()
    }
  })
  it('keeps both modes independent and prevents cost drafts from being sold', () => {
    const p = completePackage(),
      e = editorData(p)
    expect(canAssignPackage(p)).toBe(true)
    e.mode = 'cost_draft'
    expect(canAssignPackage(p)).toBe(false)
    expect(packageSchema.safeParse(p).success).toBe(false)
    expect(financialSummary(p, (k) => k)).toContain('editor.estimatedCost')
    e.mode = 'approved_price'
    expect(e.options[0].approvedAmount).toBe(1200)
    expect(optionCost(p, e.options[0]).total).toBe(650)
  })
  it('requires approval and known tax before availability, but accepts incomplete drafts', () => {
    const p = completePackage(),
      e = editorData(p)
    e.approval.by = ''
    e.options[0].tax = 'unknown'
    expect(readiness(p)).toEqual(expect.arrayContaining(['approval', 'prices']))
    expect(packageSchema.safeParse(p).success).toBe(false)
    expect(packageSchema.safeParse({ ...p, status: 'draft' }).success).toBe(true)
    expect(financialSummary(p, (k) => k)).toBe('editor.incomplete')
  })
  it('preserves option associations when stages reorder and makes deleted selections incomplete', () => {
    const p = completePackage(),
      e = editorData(p)
    e.stays.reverse()
    expect(optionCost(p, e.options[0]).total).toBe(650)
    const changed = removeStay(p, 'stay-a')
    expect(editorData(changed).options[0].selections).toEqual({ 'stay-b': 4 })
    const restored = {
      ...changed,
      editor: { ...editorData(changed), stays: [...editorData(changed).stays, e.stays[1]] }
    }
    expect(readiness(restored)).toContain('options')
  })
  it('validates calendar dates, stage ordering and program bounds; overlap and beds only warn', () => {
    const p = completePackage(),
      e = editorData(p)
    expect(stayNights('2027-02-30', '2027-03-04')).toBeNull()
    e.stays[0].checkOut = '2027-05-10'
    expect(packageSchema.safeParse(p).success).toBe(false)
    e.stays[0].checkOut = '2027-05-14'
    e.stays[0].rooms[1].beds = 44
    expect(packageSchema.safeParse(p).success).toBe(true)
    expect(packageWarnings(p)).toEqual(expect.arrayContaining(['overlap', 'beds']))
    e.stays[0].checkIn = '2027-05-09'
    expect(packageSchema.safeParse(p).success).toBe(false)
  })
  it('rejects removed references and unsafe text even in drafts', () => {
    const p = completePackage()
    p.status = 'draft'
    editorData(p).options[0].selections.invalid = 2
    expect(packageSchema.safeParse(p).success).toBe(false)
    delete editorData(p).options[0].selections.invalid
    p.name = '<script>alert(1)</script>'
    expect(packageSchema.safeParse(p).success).toBe(false)
  })
})

it('rejects domestic packages and defaults new drafts to international pilgrims', () => {
  expect(newPackage().pilgrimType).toBe('international')
  expect(packageSchema.safeParse({ ...completePackage(), pilgrimType: 'domestic' }).success).toBe(
    false
  )
})

it('starts new packages in calculation mode without requiring a pre-approved selling price', () => {
  const p = newPackage()
  expect(editorData(p).mode).toBe('cost_draft')
  expect(packageSchema.safeParse({ ...p, name: 'Calculated draft' }).success).toBe(true)
})
