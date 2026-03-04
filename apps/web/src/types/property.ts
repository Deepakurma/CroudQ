export type PublicPropertySharingType = {
  type: string;
  price: number;
  features: string[];
};

export type PublicPropertySummary = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  location: string;
  address: string;
  inchargeName: string;
  phoneNumber: string;
  mapUrl: string;
  landmarks: string[];
  rules: string[];
  images: string[];
  amenities: string[];
  propertyType: string;
  sharingTypes: PublicPropertySharingType[];
  minPrice: number;
};

export type PublicPropertyDetail = Omit<PublicPropertySummary, 'minPrice'>;
