"use client";

import { ArrowUpRight, MapPin, Sparkles, Image as ImageIcon } from "lucide-react";
import { Property } from "@/types/property";

interface PropertyCardProps {
  property: Property;
}

function formatDisplayPrice(property: Property) {
  const isRent = property.listingType === "rent" || (property.title && property.title.toLowerCase().includes("rent"));
  const priceVal = property.monthlyRent || property.price;

  if (isRent) {
    if (priceVal >= 100000) {
      return `₹${(priceVal / 100000).toFixed(2)} L / month`;
    }
    return `₹${priceVal.toLocaleString("en-IN")} / month`;
  }

  if (priceVal >= 10000000) {
    return `₹${(priceVal / 10000000).toFixed(2)} Cr`;
  }

  return `₹${(priceVal / 100000).toFixed(1)} L`;
}

function formatFurnishing(status?: string) {
  if (!status) return null;
  if (status === "fully_furnished") return "Fully Furnished";
  if (status === "semi_furnished") return "Semi Furnished";
  if (status === "unfurnished") return "Unfurnished";
  return status;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const isRent = property.listingType === "rent" || (property.title && property.title.toLowerCase().includes("rent"));
  const furnishingText = formatFurnishing(property.furnishingStatus);

  return (
    <article className="group flex flex-col justify-between h-full w-full overflow-hidden rounded-[28px] border border-[var(--stone-line)] bg-[var(--paper-raised)] transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--copper-900)]/10">
      <div className="min-w-0 flex-1 flex flex-col">
        <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-[var(--paper)] shrink-0 flex items-center justify-center">
          {property.image ? (
            <img
              src={property.image}
              alt={property.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="text-[var(--stone-line)] flex flex-col items-center justify-center">
              <ImageIcon size={40} />
            </div>
          )}

          <div className="absolute left-4 top-4 flex items-center gap-1.5">
            <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide bg-[var(--copper-600)] text-white shadow-sm">
              {isRent ? "For rent" : "For sale"}
            </span>

            {property.bhk && (
              <span className="rounded-full bg-[var(--ink)]/85 text-white px-2.5 py-1 text-[11px] font-bold backdrop-blur">
                {property.bhk} BHK
              </span>
            )}
          </div>

          {property.investmentScore && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-[var(--ink)]/85 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <Sparkles size={13} className="text-[var(--copper-400)]" />
              {property.investmentScore}/10
            </div>
          )}
        </div>

        <div className="p-5 flex-1 flex flex-col justify-between min-w-0">
          <div className="min-w-0 w-full">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--copper-700)] truncate">
                  {formatDisplayPrice(property)}
                </p>
                <p className="mt-1 text-xs sm:text-sm capitalize text-[var(--ink-soft)] truncate font-medium">
                  {property.propertyType} · {property.area.toLocaleString()}{" "}
                  {property.areaUnit}
                  {furnishingText ? ` · ${furnishingText}` : ""}
                </p>
              </div>

              <button className="rounded-full border border-[var(--stone-line)] p-2 transition hover:bg-[var(--copper-50)] hover:text-[var(--copper-600)] shrink-0">
                <ArrowUpRight size={18} />
              </button>
            </div>

            <h3 className="font-display text-lg font-semibold text-[var(--ink)] break-words whitespace-normal line-clamp-2 leading-snug">
              {property.title}
            </h3>
          </div>

          <div className="mt-3 flex items-start gap-1.5 text-xs sm:text-sm text-[var(--ink-soft)] break-words whitespace-normal leading-tight">
            <MapPin size={15} className="mt-0.5 shrink-0 text-[var(--copper-600)]" />
            <span className="break-words font-medium">
              {property.locality ? `${property.locality}, ` : ""}{property.city}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
