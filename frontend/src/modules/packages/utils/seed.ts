import type { PackageDemoData } from '../types/domain'

/** Returns synthetic first-run package data. @returns Seed records for the local demo. */
export function seedPackageData(): PackageDemoData {
  const providers = [
    {
      id: 'provider-demo-1',
      name: 'شركة ضيافة المشاعر التجريبية',
      categories: ['accommodation', 'mashair', 'catering'] as const,
      active: true
    },
    {
      id: 'provider-demo-2',
      name: 'خدمات النقل التجريبية',
      categories: ['transport', 'airline'] as const,
      active: true
    }
  ]
  return {
    providers: providers.map((provider) => ({ ...provider, categories: [...provider.categories] })),
    packages: [
      {
        id: 'package-demo-1',
        name: 'باقة ضيافة مكة',
        description: 'نموذج تجريبي لباقة حجاج الخارج.',
        pilgrimType: 'international',
        season: '1448',
        providerId: 'provider-demo-1',
        startDate: '2027-05-10',
        endDate: '2027-05-20',
        currency: 'SAR',
        bookingPolicy: 'تأكيد الطلب حسب التوافر.',
        cancellationPolicy: 'تُراجع الشروط مع مقدم الخدمة.',
        bookingChannel: 'قناة داخلية',
        includedServices: ['السكن', 'النقل للمشاعر'],
        excludedServices: ['الطيران'],
        services: {
          accommodation: [
            {
              name: 'سكن تجريبي',
              city: 'مكة المكرمة',
              location: 'منطقة مركزية',
              classification: '4 نجوم',
              nights: 5,
              checkIn: '2027-05-10',
              checkOut: '2027-05-15',
              amenities: 'وجبات وخدمة استقبال'
            }
          ],
          mashair: {
            mina: 'مخيم مجهز',
            arafah: 'خدمات ضيافة',
            muzdalifah: 'ترتيب انتقال',
            campLevel: 'مميز',
            facilities: 'تكييف ومرافق أساسية',
            transport: 'حافلات بين المشاعر'
          }
        },
        status: 'available'
      },
      {
        id: 'package-demo-2',
        name: 'باقة ضيف الرحمن الدولية',
        description: 'مسودة تجريبية لباقات الحجاج القادمين من الخارج.',
        pilgrimType: 'international',
        season: '1448',
        providerId: 'provider-demo-2',
        startDate: '2027-05-08',
        endDate: '2027-05-22',
        currency: 'SAR',
        bookingPolicy: '',
        cancellationPolicy: '',
        bookingChannel: '',
        includedServices: ['الطيران'],
        excludedServices: [],
        services: {
          flights: [
            {
              airline: 'ناقل تجريبي',
              origin: 'مطار المغادرة',
              destination: 'جدة',
              departureAt: '',
              arrivalAt: '',
              flightNumber: '',
              travelClass: 'اقتصادية',
              baggageAllowance: 'قطعة واحدة'
            }
          ],
          visa: {
            included: true,
            visaType: 'تأشيرة حج',
            requirements: 'جواز ساري',
            responsibleParty: 'مقدم الخدمة'
          }
        },
        status: 'draft'
      }
    ],
    blocks: [
      {
        id: 'block-demo-1',
        code: 'D-01',
        name: 'بلوك مكة التجريبي',
        season: '1448',
        pilgrimType: 'international',
        packageId: 'package-demo-1'
      },
      {
        id: 'block-demo-2',
        code: 'I-01',
        name: 'بلوك الضيوف التجريبي',
        season: '1448',
        pilgrimType: 'international',
        packageId: null
      }
    ]
  }
}
