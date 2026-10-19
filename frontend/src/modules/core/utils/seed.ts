import type { DemoData, Employee } from '../types/domain'
import { isoDate } from './domain'
/** Creates synthetic first-run data with dates relative to today. @returns Demo records. */
export function seedData(): DemoData {
  const day = (offset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return isoDate(d)
  }
  const names = [
    'أحمد عبدالله العتيبي',
    'سارة محمد القحطاني',
    'محمد إبراهيم حسن',
    'نورة خالد الحربي',
    'عمر محمود علي',
    'خالد سعد الدوسري',
    'ريم عبدالله الغامدي',
    'يوسف أحمد منصور'
  ]
  const jobs = [
    'مدير الموارد البشرية',
    'أخصائية موارد بشرية',
    'محاسب مالي',
    'منسقة عمليات',
    'مشرف خدمات',
    'مسؤول مشتريات',
    'أخصائية إدارية',
    'دعم تقني'
  ]
  const employees: Employee[] = names.map((fullName, i) => ({
    id: `employee-${i + 1}`,
    fullName,
    jobTitle: jobs[i],
    nationality: i % 3 === 2 ? 'NonSaudi' : 'Saudi',
    nationalId: `${i % 3 === 2 ? '2' : '1'}00000000${i + 1}`,
    bankIban: `SA${String(i + 1).padStart(22, '0')}`,
    idExpiryDate: day([-12, 18, 140, 28, 230, 90, 320, -3][i]),
    basicSalary: [12000, 8000, 6500, 7000, 5500, 9000, 7500, 6000][i],
    housingAllowance: 2000,
    transportAllowance: 500,
    gosiRate: i % 3 === 2 ? 0 : 9.75,
    employmentStatus: i > 5 ? 'Terminated' : 'Active',
    uncompensatedLeaveDays: i === 6 ? 4 : 0
  }))
  return {
    employees,
    assets: [
      {
        id: 'asset-1',
        employeeId: 'employee-1',
        type: 'Laptop',
        description: 'MacBook Pro 14 — جهاز العمل',
        serialNumber: 'DEMO-MB-001',
        assignedAt: day(-90),
        status: 'Active'
      },
      {
        id: 'asset-2',
        employeeId: 'employee-2',
        type: 'Laptop',
        description: 'Dell Latitude — جهاز العمل',
        serialNumber: 'DEMO-DL-002',
        assignedAt: day(-60),
        status: 'Active'
      },
      {
        id: 'asset-3',
        employeeId: 'employee-3',
        type: 'Advance',
        description: 'سلفة مصاريف تشغيلية',
        serialNumber: '',
        assignedAt: day(-20),
        status: 'Active'
      },
      {
        id: 'asset-4',
        employeeId: 'employee-5',
        type: 'Car',
        description: 'Toyota Corolla — سيارة خدمات',
        serialNumber: 'DEMO-CAR-01',
        assignedAt: day(-70),
        status: 'Active'
      },
      {
        id: 'asset-5',
        employeeId: 'employee-7',
        type: 'Laptop',
        description: 'HP EliteBook — جهاز العمل',
        serialNumber: 'DEMO-HP-003',
        assignedAt: day(-150),
        status: 'Active'
      },
      {
        id: 'asset-6',
        employeeId: 'employee-7',
        type: 'Advance',
        description: 'سلفة مالية غير مسواة',
        serialNumber: '',
        assignedAt: day(-35),
        status: 'Lost'
      },
      {
        id: 'asset-7',
        employeeId: 'employee-8',
        type: 'Laptop',
        description: 'Lenovo ThinkPad — جهاز العمل',
        serialNumber: 'DEMO-LN-004',
        assignedAt: day(-180),
        status: 'Returned'
      }
    ],
    clearances: []
  }
}
