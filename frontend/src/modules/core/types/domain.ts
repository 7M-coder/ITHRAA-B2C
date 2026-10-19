export type Nationality = 'Saudi' | 'NonSaudi'
export type EmploymentStatus = 'Active' | 'Terminated'
export interface Employee {
  id: string
  fullName: string
  nationalId: string
  bankIban: string
  idExpiryDate: string
  nationality: Nationality
  jobTitle: string
  basicSalary: number
  housingAllowance: number
  transportAllowance: number
  gosiRate: number
  employmentStatus?: EmploymentStatus
  uncompensatedLeaveDays?: number
}
export type AssetType = 'Car' | 'Laptop' | 'Advance'
export type AssetStatus = 'Active' | 'Returned' | 'Lost'
export interface Asset {
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
  employees: Employee[]
  assets: Asset[]
  clearances: Clearance[]
}
