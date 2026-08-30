"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Search,
  Loader2,
  LocateFixed,
  MapPin,
} from "lucide-react";

import { Property } from "@/types/property";

interface PropertyMapProps {
  properties: Property[];
  selectedPropertyId?: string;
  onPropertySelect?: (property: Property) => void;
  onLocationSearch?: (
    latitude: number,
    longitude: number,
    locationName: string
  ) => void;
}

interface LocationResult {
  lat: string;
  lon: string;
  display_name: string;
}

function formatPrice(price: number) {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  }

  return `₹${(price / 100000).toFixed(1)} L`;
}

function createMarkerIcon(property: Property) {
  const sourceClass =
    property.source === "geb"
      ? "geb"
      : property.source === "external"
        ? "external"
        : "broker";

  return L.divIcon({
    className: "geb-map-marker-wrapper",
    html: `
      <div class="geb-map-marker ${sourceClass}">
        <span>${formatPrice(property.price)}</span>
      </div>
    `,
    iconSize: [90, 38],
    iconAnchor: [45, 38],
    popupAnchor: [0, -38],
  });
}

export default function PropertyMap({
  properties,
  selectedPropertyId,
  onPropertySelect,
  onLocationSearch,
}: PropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [searchError, setSearchError] = useState("");

  /*
   * ==========================================================
   * CREATE MAP
   * ==========================================================
   */

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView([26.8467, 80.9462], 11);

    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(map);

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
      }
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /*
   * ==========================================================
   * PROPERTY MARKERS
   * ==========================================================
   */

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    Object.values(markersRef.current).forEach((marker) => {
      marker.remove();
    });

    markersRef.current = {};

    properties.forEach((property) => {
      const marker = L.marker(
        [property.latitude, property.longitude],
        {
          icon: createMarkerIcon(property),
        }
      ).addTo(map);

      marker.bindPopup(`
        <div class="geb-popup">

          <img
            src="${property.image}"
            alt="${property.title}"
            class="geb-popup-image"
          />

          <div class="geb-popup-content">

            <div class="geb-popup-price">
              ${formatPrice(property.price)}
            </div>

            <div class="geb-popup-title">
              ${property.title}
            </div>

            <div class="geb-popup-location">
              ${property.locality}, ${property.city}
            </div>

            <div class="geb-popup-details">
              ${property.area.toLocaleString()} ${property.areaUnit}
              · ${property.propertyType}
            </div>

            ${
              property.investmentScore
                ? `<div class="geb-popup-score">
                    ✦ AI Investment Score ${property.investmentScore}/10
                  </div>`
                : ""
            }

          </div>

        </div>
      `);

      marker.on("click", () => {
        onPropertySelect?.(property);
      });

      markersRef.current[property.id] = marker;
    });

    /*
     * Fit map to available properties
     */

    if (properties.length > 0) {
      const bounds = L.latLngBounds(
        properties.map((property) => [
          property.latitude,
          property.longitude,
        ])
      );

      map.fitBounds(bounds, {
        padding: [70, 70],
        maxZoom: 13,
      });
    }
  }, [properties, onPropertySelect]);

  /*
   * ==========================================================
   * SELECTED PROPERTY
   * ==========================================================
   */

  useEffect(() => {
    if (!selectedPropertyId || !mapRef.current) {
      return;
    }

    const property = properties.find(
      (item) => item.id === selectedPropertyId
    );

    if (!property) {
      return;
    }

    mapRef.current.flyTo(
      [property.latitude, property.longitude],
      14,
      {
        duration: 0.8,
      }
    );

    markersRef.current[property.id]?.openPopup();
  }, [selectedPropertyId, properties]);

  /*
   * ==========================================================
   * SEARCH LOCATION
   * ==========================================================
   */

  async function searchLocation() {
    const query = searchQuery.trim();

    if (!query) {
      return;
    }

    setSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Location search failed");
      }

      const results: LocationResult[] =
        await response.json();

      if (!results.length) {
        setSearchError(
          "Location not found. Try another search."
        );
        return;
      }

      setSearchResults(results);

      const firstResult = results[0];

      const latitude = Number(firstResult.lat);
      const longitude = Number(firstResult.lon);

      /*
       * Tell the parent page about the searched location.
       *
       * The parent will use these coordinates to find
       * nearby properties.
       */

      onLocationSearch?.(
        latitude,
        longitude,
        firstResult.display_name
      );

      mapRef.current?.flyTo(
        [latitude, longitude],
        13,
        {
          duration: 1,
        }
      );
    } catch {
      setSearchError(
        "Unable to search this location. Please try again."
      );
    } finally {
      setSearching(false);
    }
  }

  /*
   * ==========================================================
   * SELECT SEARCH RESULT
   * ==========================================================
   */

  function selectLocation(result: LocationResult) {
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);

    setSearchQuery(result.display_name);
    setSearchResults([]);
    setSearchError("");

    onLocationSearch?.(
      latitude,
      longitude,
      result.display_name
    );

    mapRef.current?.flyTo(
      [latitude, longitude],
      14,
      {
        duration: 1,
      }
    );
  }

  /*
   * ==========================================================
   * ENTER KEY
   * ==========================================================
   */

  function handleSearchKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      searchLocation();
    }
  }

  /*
   * ==========================================================
   * CURRENT LOCATION
   * ==========================================================
   */

  function locateUser() {
    if (!navigator.geolocation) {
      setSearchError(
        "Location services are not available."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        onLocationSearch?.(
          latitude,
          longitude,
          "Your current location"
        );

        mapRef.current?.flyTo(
          [latitude, longitude],
          14,
          {
            duration: 1,
          }
        );
      },
      () => {
        setSearchError(
          "Unable to access your current location."
        );
      }
    );
  }

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="relative h-full w-full">

      {/* MAP */}

      <div
        ref={mapContainerRef}
        className="h-full min-h-[360px] w-full"
      />


      {/* =====================================================
          LOCATION SEARCH
      ===================================================== */}

      <div className="absolute left-4 top-4 z-[1000] w-[min(420px,calc(100%-32px))]">

        <div className="flex items-center rounded-2xl border border-black/10 bg-white/95 p-1.5 shadow-xl backdrop-blur-md">

          <Search
            size={18}
            className="ml-3 shrink-0 text-zinc-400"
          />

          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSearchError("");
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search city, locality or area..."
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-medium outline-none placeholder:text-zinc-400"
          />

          <button
            onClick={searchLocation}
            disabled={searching}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white transition hover:bg-zinc-800 disabled:opacity-60"
          >

            {searching ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Search size={17} />
            )}

          </button>

        </div>


        {/* SEARCH RESULTS */}

        {searchResults.length > 0 && (

          <div className="mt-2 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-xl">

            {searchResults.map((result, index) => (

              <button
                key={`${result.lat}-${result.lon}-${index}`}
                onClick={() =>
                  selectLocation(result)
                }
                className="flex w-full items-start gap-3 border-b border-zinc-100 px-4 py-3 text-left last:border-0 hover:bg-zinc-50"
              >

                <MapPin
                  size={16}
                  className="mt-0.5 shrink-0 text-zinc-400"
                />

                <span className="text-xs leading-5 text-zinc-600">
                  {result.display_name}
                </span>

              </button>

            ))}

          </div>

        )}


        {/* SEARCH ERROR */}

        {searchError && (

          <div className="mt-2 rounded-xl border border-red-100 bg-white px-4 py-3 text-xs font-medium text-red-500 shadow-lg">

            {searchError}

          </div>

        )}

      </div>


      {/* =====================================================
          CURRENT LOCATION
      ===================================================== */}

      <button
        onClick={locateUser}
        title="Use my location"
        className="absolute bottom-4 right-16 z-[1000] flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white/95 text-zinc-700 shadow-lg backdrop-blur-md transition hover:bg-zinc-50"
      >

        <LocateFixed size={17} />

      </button>

    </div>
  );
}
