import { Property } from "@/types/property";

export const properties: Property[] = [
  {
    id: "geb-001",
    title: "Premium Residential Plot",
    propertyType: "plot",
    price: 4800000,
    area: 1500,
    areaUnit: "sqft",
    city: "Lucknow",
    locality: "Gomti Nagar Extension",
    latitude: 26.8467,
    longitude: 80.9462,
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80",
    source: "geb",
    sourceName: "GEB",
    investmentScore: 8.7,
    featured: true,
  },
  {
    id: "geb-002",
    title: "Modern 3 BHK Apartment",
    propertyType: "apartment",
    price: 7200000,
    area: 1850,
    areaUnit: "sqft",
    city: "Lucknow",
    locality: "Shaheed Path",
    latitude: 26.8167,
    longitude: 81.0076,
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80",
    source: "geb",
    sourceName: "GEB",
    investmentScore: 8.1,
    featured: true,
  },
  {
    id: "ext-001",
    title: "Investment Plot Opportunity",
    propertyType: "plot",
    price: 5200000,
    area: 1800,
    areaUnit: "sqft",
    city: "Lucknow",
    locality: "Sultanpur Road",
    latitude: 26.795,
    longitude: 81.04,
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80",
    source: "external",
    sourceName: "External Listing",
    sourceUrl: "https://example.com",
    investmentScore: 8.3,
    featured: true,
  },
  {
    id: "geb-003",
    title: "Luxury Villa",
    propertyType: "villa",
    price: 14500000,
    area: 3200,
    areaUnit: "sqft",
    city: "Lucknow",
    locality: "Gomti Nagar",
    latitude: 26.856,
    longitude: 81.0,
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=80",
    source: "geb",
    sourceName: "GEB",
    investmentScore: 7.9,
    featured: true,
  },
];

export function getFeaturedProperties() {
  return properties.filter((property) => property.featured);
}
