"use client";

import { ArrowUpRight, MapPin, Sparkles, Image as ImageIcon } from "lucide-react";
import { Property } from "@/types/property";

interface PropertyCardProps {
  property: Property;
}

function formatPrice(price: number) {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  }

  return `₹${(price / 100000).toFixed(1)} L`;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <article className="group flex flex-col justify-between h-full w-full overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="min-w-0 flex-1 flex flex-col">
        <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-zinc-100 shrink-0 flex items-center justify-center">
          {property.image ? (
            <img
              src={property.image}
              alt={property.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="text-zinc-300 flex flex-col items-center justify-center">
              <ImageIcon size={40} />
            </div>
          )}

          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            {property.source === "geb"
              ? "GEB Listing"
              : property.source === "external"
                ? "External Listing"
                : "Broker"}
          </div>

          {property.investmentScore && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-black/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <Sparkles size={13} />
              {property.investmentScore}/10
            </div>
          )}
        </div>

        <div className="p-5 flex-1 flex flex-col justify-between min-w-0">
          <div className="min-w-0 w-full">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold tracking-tight text-zinc-900 truncate">
                  {formatPrice(property.price)}
                </p>
                <p className="mt-1 text-sm capitalize text-zinc-500 truncate">
                  {property.propertyType} · {property.area.toLocaleString()}{" "}
                  {property.areaUnit}
                </p>
              </div>

              <button className="rounded-full border border-zinc-200 p-2 transition hover:bg-zinc-100 shrink-0">
                <ArrowUpRight size={18} />
              </button>
            </div>

            <h3 className="font-semibold text-zinc-900 break-words whitespace-normal line-clamp-2 leading-snug">
              {property.title}
            </h3>
          </div>

          <div className="mt-3 flex items-start gap-1.5 text-sm text-zinc-500 break-words whitespace-normal leading-tight">
            <MapPin size={15} className="mt-0.5 shrink-0" />
            <span className="break-words">
              {property.locality ? `${property.locality}, ` : ""}{property.city}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
