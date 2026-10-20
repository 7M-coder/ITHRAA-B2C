import { describe, expect, it } from 'vitest'
import { organizerContractSchema } from '../validations/schemas'
import type { OrganizerContractDraft } from '../types/domain'

const validContract: OrganizerContractDraft = {
  organizerSource: 'direct',
  pilgrimCount: 46,
  organizerName: 'Mohammed Ahmed',
  passportNumber: 'A12345678',
  nationality: 'Saudi',
  mobileNumber: '+966501234567',
  country: 'Saudi Arabia',
  city: 'Jeddah',
  languages: 'Arabic, English',
  hajjExperience: 'Three seasons supporting pilgrims in Makkah.'
}

describe('organizer contract draft', () => {
  it('accepts all required organizer details', () => {
    expect(organizerContractSchema.safeParse(validContract).success).toBe(true)
  })

  it('requires an English name, passport number and valid pilgrim count', () => {
    expect(
      organizerContractSchema.safeParse({ ...validContract, organizerName: 'محمد' }).success
    ).toBe(false)
    expect(
      organizerContractSchema.safeParse({ ...validContract, passportNumber: 'جواز123' }).success
    ).toBe(false)
    expect(organizerContractSchema.safeParse({ ...validContract, pilgrimCount: 0 }).success).toBe(
      false
    )
  })

  it('accepts both direct and indirect organizer sources', () => {
    expect(
      organizerContractSchema.safeParse({ ...validContract, organizerSource: 'indirect' }).success
    ).toBe(true)
  })

  it('rejects unsafe text', () => {
    expect(
      organizerContractSchema.safeParse({
        ...validContract,
        hajjExperience: '<script>alert(1)</script>'
      }).success
    ).toBe(false)
  })
})
