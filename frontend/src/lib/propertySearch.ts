import { Property } from "@/types/property";

export interface PropertyFilters {
  query?: string;
  propertyType?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadiusKm = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function filterProperties(
  properties: Property[],
  filters: PropertyFilters
) {
  return properties.filter((property) => {
    if (
      filters.listingType &&
      filters.listingType !== "all"
    ) {
      const propListingType = property.listingType || (property.title && property.title.toLowerCase().includes("rent") ? "rent" : "sale");
      if (propListingType !== filters.listingType) {
        return false;
      }
    }

    if (
      filters.propertyType &&
      filters.propertyType !== "all" &&
      property.propertyType !== filters.propertyType
    ) {
      return false;
    }

    const checkPrice = property.monthlyRent || property.price;

    if (
      filters.minPrice !== undefined &&
      checkPrice < filters.minPrice
    ) {
      return false;
    }

    if (
      filters.maxPrice !== undefined &&
      checkPrice > filters.maxPrice
    ) {
      return false;
    }

    if (
      filters.latitude !== undefined &&
      filters.longitude !== undefined &&
      filters.radiusKm !== undefined
    ) {
      const distance = calculateDistance(
        filters.latitude,
        filters.longitude,
        property.latitude,
        property.longitude
      );

      if (distance > filters.radiusKm) {
        return false;
      }
    }

    if (filters.query) {
      const searchText = filters.query.toLowerCase();

      const searchableText = [
        property.title,
        property.propertyType,
        property.city,
        property.locality,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(searchText)) {
        return false;
      }
    }

    return true;
  });
}
