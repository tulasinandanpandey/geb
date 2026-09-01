import { Property } from "@/types/property";
import { supabase } from "@/lib/supabase/client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";


interface ApiProperty {
  id: string;
  title: string;
  property_type: string;
  listing_type?: string | null;
  price: number;
  monthly_rent?: number | null;
  security_deposit?: number | null;
  available_from?: string | null;
  furnishing_status?: string | null;
  bhk?: number | null;
  area: number | null;
  area_unit: string | null;
  city: string;
  locality: string | null;
  latitude: number;
  longitude: number;
  image: string | null;
  images?: string[] | null;
  source: string;
  source_name: string | null;
  source_url: string | null;
  investment_score: number | null;
  featured: boolean;
  status: string;
  description: string | null;
  seller_id: string | null;
  seller?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string | null;
    avatar_url?: string | null;
  } | null;
  created_at: string | null;
  updated_at: string | null;
  rejection_reason: string | null;
}


interface PropertiesResponse {
  success: boolean;
  count: number;
  properties: ApiProperty[];
}


interface PropertyResponse {
  success: boolean;
  message?: string;
  property: ApiProperty;
}


function mapProperty(
  property: ApiProperty
): Property {

  return {
    id: property.id,
    title: property.title,
    propertyType: property.property_type as Property["propertyType"],
    listingType: (property.listing_type as any) || (property.title.toLowerCase().includes("rent") ? "rent" : "sale"),
    price: Number(property.price),
    monthlyRent: property.monthly_rent ? Number(property.monthly_rent) : undefined,
    securityDeposit: property.security_deposit ? Number(property.security_deposit) : undefined,
    availableFrom: property.available_from ?? undefined,
    furnishingStatus: (property.furnishing_status as any) ?? undefined,
    bhk: property.bhk ? Number(property.bhk) : undefined,
    area: Number(property.area ?? 0),
    areaUnit: property.area_unit === "sqm" ? "sqm" : "sqft",
    city: property.city,
    locality: property.locality ?? "",
    latitude: Number(property.latitude),
    longitude: Number(property.longitude),
    image: property.image ?? "",
    images: property.images ?? [],
    source: property.source as Property["source"],
    sourceName: property.source_name ?? "",
    sourceUrl: property.source_url ?? undefined,
    investmentScore: property.investment_score ?? undefined,
    featured: property.featured ?? false,
    status: property.status as Property["status"],
    description: property.description ?? undefined,
    sellerId: property.seller_id ?? undefined,
    seller: property.seller ? {
      id: property.seller.id,
      full_name: property.seller.full_name,
      email: property.seller.email,
      phone: property.seller.phone ?? undefined,
      avatar_url: property.seller.avatar_url ?? undefined,
    } : undefined,
    createdAt: property.created_at ?? undefined,
    updatedAt: property.updated_at ?? undefined,
    rejectionReason: property.rejection_reason ?? undefined,
  };
}


export async function getProperties(): Promise<Property[]> {
  const response = await fetch(
    `${API_URL}/api/properties/`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch properties: ${response.status}`
    );
  }

  const data: PropertiesResponse = await response.json();
  return data.properties.map(mapProperty);
}


export interface CreatePropertyInput {
  title: string;
  property_type: string;
  listing_type?: string;
  price: number;
  monthly_rent?: number;
  security_deposit?: number;
  available_from?: string;
  furnishing_status?: string;
  bhk?: number;
  area?: number;
  area_unit?: string;
  city: string;
  locality?: string;
  latitude: number;
  longitude: number;
  image?: string;
  images?: string[];
  description?: string;
}


export async function createProperty(
  property: CreatePropertyInput
): Promise<Property> {
  await supabase.auth.getUser();
  const {
    data: {
      session,
    },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error(
      "You must be logged in to list a property."
    );
  }

  const response = await fetch(
    `${API_URL}/api/properties/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(property),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.detail || `Failed to create property: ${response.status}`
    );
  }

  const data: PropertyResponse = await response.json();
  return mapProperty(data.property);
}


export async function getPropertyById(
  id: string
): Promise<Property> {
  const response = await fetch(
    `${API_URL}/api/properties/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch property: ${response.status}`
    );
  }

  const data = await response.json();
  return mapProperty(data.property);
}

export async function getMyProperties(): Promise<Property[]> {
  await supabase.auth.getUser();
  const {
    data: {
      session,
    },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error(
      "You must be logged in to view your properties."
    );
  }

  const response = await fetch(
    `${API_URL}/api/properties/mine`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.detail || `Failed to fetch your properties: ${response.status}`
    );
  }

  const data: PropertiesResponse = await response.json();
  return data.properties.map(mapProperty);
}
