export type PropertyType =
  | "plot"
  | "house"
  | "apartment"
  | "commercial"
  | "villa";

export type PropertySource =
  | "geb"
  | "external"
  | "broker";


export interface Property {

  id: string;

  title: string;

  propertyType: PropertyType;

  price: number;

  area: number;

  areaUnit: "sqft" | "sqm";

  city: string;

  locality: string;

  latitude: number;

  longitude: number;

  /*
   * Cover image.
   *
   * Kept for backward compatibility
   * with the existing PropertyCard.
   */
  image: string;

  /*
   * Complete property gallery.
   */
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

