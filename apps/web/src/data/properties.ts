export type Property = {
  slug: string;
  name: string;
  shortDescription: string;
  location: string;
  address: string;
  inchargeName: string;
  phoneNumber: string;
  mapUrl: string;
  images: string[];
  amenities: string[];
  facilities: string[];
  rules: string[];
  sharingTypes: {
    type: string;
    price: number;
    features: string[];
  }[];
};

export const baseProperties: Property[] = [
  {
    slug: 'greenfield-boys-property',
    name: 'Greenfield Boys Property',
    shortDescription:
      'Comfortable double and triple sharing rooms for students and working professionals.',
    location: 'Hyderabad',
    address: '12-3-41, Himayatnagar Main Road, Hyderabad, Telangana 500029',
    inchargeName: 'Ravi Kumar',
    phoneNumber: '+919100123456',
    mapUrl: 'https://maps.google.com/?q=Himayatnagar+Hyderabad',
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=1200'
    ],
    amenities: ['Wi-Fi', 'Power Backup', 'RO Water', 'Laundry Service', '24x7 Security'],
    facilities: ['Study Hall', 'TV Lounge', 'Parking', 'Mess Hall', 'Biometric Entry'],
    rules: [
      'Valid ID proof is mandatory during check-in.',
      'Entry after 10:30 PM requires prior approval.',
      'No smoking or alcohol inside property premises.',
      'Maintain silence in common study areas after 9:00 PM.'
    ],
    sharingTypes: [
      { type: 'Single', price: 9000, features: ['Private Room', 'Attached Washroom', 'AC'] },
      { type: '2-Sharing', price: 7500, features: ['Twin Beds', 'Shared Washroom', 'AC/Non-AC'] },
      { type: '3-Sharing', price: 6000, features: ['Bunk Beds', 'Shared Washroom', 'Fans'] }
    ]
  },
  {
    slug: 'sunrise-ladies-property',
    name: 'Sunrise Ladies Property',
    shortDescription:
      'Secure women-only property with hygienic food, housekeeping, and transport access.',
    location: 'Bengaluru',
    address: '44, 2nd Cross, Koramangala 5th Block, Bengaluru, Karnataka 560095',
    inchargeName: 'Sushmita Reddy',
    phoneNumber: '+919345678210',
    mapUrl: 'https://maps.google.com/?q=Koramangala+5th+Block+Bengaluru',
    images: [
      'https://images.unsplash.com/photo-1512918766674-ed62b9a79ad6?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1520277739336-7bf67edfa768?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1515362655824-9a74989f318e?auto=format&fit=crop&q=80&w=1200'
    ],
    amenities: [
      'High-Speed Wi-Fi',
      'CCTV Surveillance',
      'Daily Housekeeping',
      'Hot Water',
      'RO Water'
    ],
    facilities: ['Lift Access', 'Reading Room', 'In-house Cook', 'Fridge Access', 'First Aid Desk'],
    rules: [
      'Visitors are allowed only in reception area.',
      'Quiet hours are from 10:00 PM to 6:00 AM.',
      'Monthly fee to be paid before the 5th of each month.',
      'Any damage to property is chargeable.'
    ],
    sharingTypes: [
      { type: 'Single', price: 12000, features: ['Private Room', 'Attached Washroom', 'AC'] },
      { type: '2-Sharing', price: 9500, features: ['Twin Beds', 'Shared Washroom', 'AC'] },
      {
        type: '4-Sharing',
        price: 7000,
        features: ['Spacious Room', 'Shared Washroom', 'Personal Locker']
      }
    ]
  }
];

// Generate more properties for demo
export const properties: Property[] = Array.from({ length: 12 }, (_, i) => {
  const base = baseProperties[i % baseProperties.length];
  return {
    ...base,
    slug: `${base.slug}-${i + 1}`,
    name: `${base.name} Unit ${i + 1}`
  };
});

export const propertyLocations = Array.from(
  new Set(properties.map((property) => property.location))
).sort();

export function getPropertyBySlug(slug: string) {
  return properties.find((property) => property.slug === slug);
}
