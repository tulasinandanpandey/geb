export type PropertyType =
  | "plot"
  | "house"
  | "apartment"
  | "commercial"
  | "villa";

export type ListingType = "sale" | "rent";

export type FurnishingStatus = "unfurnished" | "semi_furnished" | "fully_furnished";

export type PropertySource =
  | "geb"
  | "external"
  | "broker";


export interface Property {
  id: string;
  title: string;
  propertyType: PropertyType;
  listingType?: ListingType;
  price: number;
  monthlyRent?: number;
  securityDeposit?: number;
  availableFrom?: string;
  furnishingStatus?: FurnishingStatus;
  bhk?: number;

  area: number;
  areaUnit: "sqft" | "sqm";
  city: string;
  locality: string;
  latitude: number;
  longitude: number;
  image: string;
  images?: string[];
  source: PropertySource;
  sourceName: string;
  sourceUrl?: string;
  investmentScore?: number;
  featured?: boolean;
  status?: string;
  rejectionReason?: string;
  description?: string;
  sellerId?: string;

  seller?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
  };

  createdAt?: string;
  updatedAt?: string;
}
