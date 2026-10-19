import { describe, expect, it } from 'vitest'
import { getPackageDuration, matchesBlock } from '../utils/domain'

describe('package domain helpers', () => {
  it('calculates inclusive duration and handles invalid ranges', () => {
    expect(getPackageDuration('2027-05-10', '2027-05-10')).toBe(1)
    expect(getPackageDuration('2027-05-10', '2027-05-13')).toBe(4)
    expect(getPackageDuration('2027-05-13', '2027-05-10')).toBe(0)
  })

  it('matches a block only when the season and pilgrim type agree', () => {
    const item = { season: '1448', pilgrimType: 'domestic' as const }
    expect(matchesBlock(item, '1448', 'domestic')).toBe(true)
    expect(matchesBlock(item, '1449', 'domestic')).toBe(false)
    expect(matchesBlock(item, '1448', 'international')).toBe(false)
  })
})
