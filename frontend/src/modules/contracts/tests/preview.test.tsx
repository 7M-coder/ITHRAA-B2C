import { App } from 'antd'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@/tests/utils/test-utils'
import { OrganizerContractPreview } from '../components/OrganizerContractPreview'
import type { OrganizerContractDraft } from '../types/domain'

const contract: OrganizerContractDraft = {
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

describe('organizer contract preview', () => {
  it('renders the filled fields and formatted compensation', () => {
    render(
      <App>
        <OrganizerContractPreview contract={contract} />
      </App>
    )
    expect(screen.getAllByText('Mohammed Ahmed').length).toBeGreaterThan(0)
    expect(screen.getByText('A12345678')).toBeInTheDocument()
    expect(screen.getByText('Three seasons supporting pilgrims in Makkah.')).toBeInTheDocument()
    expect(screen.getByText('46')).toBeInTheDocument()
  })
})
