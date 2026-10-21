import type { z } from 'zod'
import type { accommodationSchema } from '../validations/schemas'
export type Accommodation = z.input<typeof accommodationSchema>
export type RoomCounts = { double: number; triple: number; quadruple: number; suites: number }
