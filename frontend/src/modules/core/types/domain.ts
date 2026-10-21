import type { NationalityCode } from '../../employees/types/nationality'
export type Nationality = 'Saudi' | 'NonSaudi'
export type EmploymentStatus = 'Active' | 'Terminated'
export interface Employee {
  id: string
  fullName: string
  nationalId: string
  bankIban: string
  idExpiryDate: string
  nationality: Nationality
  nationalityCode?: NationalityCode
  otherNationality?: string
  phone?: string
  email?: string
  department?: string
  startDate?: string
  jobTitle: string
  basicSalary: number
  housingAllowance: number
  transportAllowance: number
  gosiRate: number
  employmentStatus?: EmploymentStatus
  uncompensatedLeaveDays?: number
}
export type AssetType = 'Car' | 'Laptop' | 'Advance' | 'Equipment'
export type AssetStatus = 'Active' | 'Returned' | 'Lost'
export interface Asset {
  workflow?: import('../../custody/types/workflow').CustodyWorkflow
  id: string
  employeeId: string
  type: AssetType
  description: string
  serialNumber: string
  assignedAt: string
  status: AssetStatus
}
export interface Clearance {
  employeeId: string
  issuedAt: string
}
export interface DemoData {
  inventory?: import('../../custody/types/workflow').InventoryItem[]
  employees: Employee[]
  assets: Asset[]
  clearances: Clearance[]
}
