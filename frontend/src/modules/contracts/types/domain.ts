export type OrganizerSource = 'direct' | 'indirect'

export interface OrganizerContractDraft {
  organizerSource: OrganizerSource
  pilgrimCount: number
  organizerName: string
  passportNumber: string
  nationality: string
  mobileNumber: string
  country: string
  city: string
  languages: string
  hajjExperience: string
}
