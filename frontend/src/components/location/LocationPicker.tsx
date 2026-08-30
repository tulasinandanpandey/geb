"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  MapPin,
  LocateFixed,
  Loader2,
} from "lucide-react";

import L from "leaflet";
import "leaflet/dist/leaflet.css";


interface LocationData {
  latitude: number;
  longitude: number;
  displayName: string;
  city: string;
  locality: string;
}


interface LocationPickerProps {
  latitude?: number;
  longitude?: number;

  onLocationSelect: (
    location: LocationData
  ) => void;
}


interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;

  address?: {
    city?: string;
    town?: string;
    municipality?: string;
    village?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    county?: string;
    state?: string;
  };
}


const DEFAULT_LAT = 26.8467;
const DEFAULT_LNG = 80.9462;


export default function LocationPicker({
  latitude,
  longitude,
  onLocationSelect,
}: LocationPickerProps) {

  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<L.Map | null>(null);

  const markerRef =
    useRef<L.Marker | null>(null);


  const [search, setSearch] =
    useState("");

  const [searching, setSearching] =
    useState(false);

  const [reverseLoading, setReverseLoading] =
    useState(false);

  const [selectedAddress, setSelectedAddress] =
    useState("");

  const [selectedCity, setSelectedCity] =
    useState("");

  const [selectedLocality, setSelectedLocality] =
    useState("");


  /*
   * ==========================================================
   * EXTRACT CITY + LOCALITY
   * ==========================================================
   */

  function extractLocationParts(
    address: SearchResult["address"]
  ) {

    if (!address) {

      return {
        city: "",
        locality: "",
      };

    }


    const city =
      address.city ||
      address.town ||
      address.municipality ||
      address.village ||
      address.county ||
      "";


    const locality =
      address.suburb ||
      address.neighbourhood ||
      address.city_district ||
      "";


    return {
      city,
      locality,
    };

  }


  /*
   * ==========================================================
   * INITIALIZE MAP
   * ==========================================================
   */

  useEffect(() => {

    if (
      !mapContainerRef.current ||
      mapRef.current
    ) {
      return;
    }


    const initialLat =
      latitude ?? DEFAULT_LAT;

    const initialLng =
      longitude ?? DEFAULT_LNG;


    const map = L.map(
      mapContainerRef.current,
      {
        center: [
          initialLat,
          initialLng,
        ],

        zoom: 12,

        zoomControl: true,
      }
    );


    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          "&copy; OpenStreetMap contributors",

        maxZoom: 19,
      }
    ).addTo(map);


    mapRef.current = map;


    /*
     * Click map
     */

    map.on(
      "click",
      async (event) => {

        const {
          lat,
          lng,
        } = event.latlng;


        await selectLocation(
          lat,
          lng
        );

      }
    );


    /*
     * Existing location
     */

    if (
      latitude !== undefined &&
      longitude !== undefined
    ) {

      placeMarker(
        map,
        latitude,
        longitude
      );

    }


    return () => {

      map.remove();

      mapRef.current = null;

    };

  }, []);


  /*
   * ==========================================================
   * PLACE MARKER
   * ==========================================================
   */

  function placeMarker(
    map: L.Map,
    lat: number,
    lng: number
  ) {

    if (markerRef.current) {

      markerRef.current.remove();

    }


    const marker =
      L.marker(
        [lat, lng],
        {
          draggable: true,
        }
      ).addTo(map);


    marker.on(
      "dragend",
      async () => {

        const position =
          marker.getLatLng();


        await selectLocation(
          position.lat,
          position.lng,
          false
        );

      }
    );


    markerRef.current =
      marker;

  }


  /*
   * ==========================================================
   * REVERSE GEOCODING
   * ==========================================================
   */

  async function selectLocation(
    lat: number,
    lng: number,
    moveMap = true
  ) {

    const map =
      mapRef.current;


    if (!map) {
      return;
    }


    if (moveMap) {

      map.setView(
        [lat, lng],
        Math.max(
          map.getZoom(),
          15
        )
      );

    }


    placeMarker(
      map,
      lat,
      lng
    );


    setReverseLoading(true);


    try {

      const response =
        await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              Accept:
                "application/json",
            },
          }
        );


      if (!response.ok) {

        throw new Error(
          "Reverse geocoding failed"
        );

      }


      const data:
        SearchResult =
        await response.json();


      const displayName =
        data.display_name ||
        `${lat.toFixed(6)}, ${lng.toFixed(6)}`;


      const {
        city,
        locality,
      } =
        extractLocationParts(
          data.address
        );


      setSelectedAddress(
        displayName
      );

      setSelectedCity(
        city
      );

      setSelectedLocality(
        locality
      );


      setSearch(
        displayName
      );


      onLocationSelect({

        latitude: lat,

        longitude: lng,

        displayName,

        city,

        locality,

      });


    } catch (error) {

      console.error(
        "Reverse geocoding failed:",
        error
      );


      const fallback =
        `${lat.toFixed(6)}, ${lng.toFixed(6)}`;


      setSelectedAddress(
        fallback
      );


      setSelectedCity("");

      setSelectedLocality("");


      setSearch(
        fallback
      );


      onLocationSelect({

        latitude: lat,

        longitude: lng,

        displayName: fallback,

        city: "",

        locality: "",

      });

    } finally {

      setReverseLoading(false);

    }

  }


  /*
   * ==========================================================
   * SEARCH LOCATION
   * ==========================================================
   */

  async function searchLocation() {

    if (!search.trim()) {
      return;
    }


    setSearching(true);


    try {

      const response =
        await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=5&addressdetails=1`,
          {
            headers: {
              Accept:
                "application/json",
            },
          }
        );


      if (!response.ok) {

        throw new Error(
          "Location search failed"
        );

      }


      const results:
        SearchResult[] =
        await response.json();


      if (
        !results ||
        results.length === 0
      ) {

        alert(
          "Location not found. Try a city, locality or landmark."
        );

        return;

      }


      const result =
        results[0];


      const lat =
        Number(result.lat);

      const lng =
        Number(result.lon);


      const map =
        mapRef.current;


      if (map) {

        map.setView(
          [lat, lng],
          15
        );

      }


      /*
       * Use the search result's
       * address immediately.
       */

      const {
        city,
        locality,
      } =
        extractLocationParts(
          result.address
        );


      setSelectedAddress(
        result.display_name
      );

      setSelectedCity(
        city
      );

      setSelectedLocality(
        locality
      );


      setSearch(
        result.display_name
      );


      placeMarker(
        map!,
        lat,
        lng
      );


      onLocationSelect({

        latitude: lat,

        longitude: lng,

        displayName:
          result.display_name,

        city,

        locality,

      });


    } catch (error) {

      console.error(
        "Location search failed:",
        error
      );


      alert(
        "Unable to search this location. Please try again."
      );

    } finally {

      setSearching(false);

    }

  }


  /*
   * ==========================================================
   * USE MY LOCATION
   * ==========================================================
   */

  function useMyLocation() {

    if (
      !navigator.geolocation
    ) {

      alert(
        "Location services are not supported by this browser."
      );

      return;

    }


    navigator.geolocation.getCurrentPosition(
      async (position) => {

        await selectLocation(
          position.coords.latitude,
          position.coords.longitude
        );

      },
      () => {

        alert(
          "Unable to access your location."
        );

      }
    );

  }


  return (

    <div className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white">


      {/* SEARCH */}

      <div className="border-b border-zinc-100 p-3">

        <div className="flex gap-2">

          <div className="flex flex-1 items-center gap-3 rounded-xl bg-zinc-50 px-4">

            <Search
              size={18}
              className="shrink-0 text-zinc-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              onKeyDown={(event) => {

                if (
                  event.key === "Enter"
                ) {

                  event.preventDefault();

                  searchLocation();

                }

              }}
              placeholder="Search city, locality or landmark..."
              className="w-full bg-transparent py-3 text-sm font-medium outline-none placeholder:text-zinc-400"
            />

          </div>


          <button
            type="button"
            onClick={searchLocation}
            disabled={searching}
            className="flex items-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >

            {searching ? (

              <Loader2
                size={17}
                className="animate-spin"
              />

            ) : (

              <Search size={17} />

            )}

            Search

          </button>


          <button
            type="button"
            onClick={useMyLocation}
            className="hidden items-center justify-center rounded-xl border border-zinc-200 px-4 transition hover:bg-zinc-50 sm:flex"
            title="Use my location"
          >

            <LocateFixed
              size={18}
            />

          </button>

        </div>

      </div>


      {/* MAP */}

      <div
        ref={mapContainerRef}
        className="h-[380px] w-full"
      />


      {/* LOCATION RESULT */}

      <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-4">

        <div className="flex items-start gap-3">

          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">

            {reverseLoading ? (

              <Loader2
                size={17}
                className="animate-spin text-zinc-500"
              />

            ) : (

              <MapPin
                size={17}
                className="text-zinc-700"
              />

            )}

          </div>


          <div className="min-w-0 flex-1">

            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Selected property location
            </p>


            <p className="mt-1 text-sm font-medium text-zinc-800">

              {selectedAddress
                ? selectedAddress
                : "Search for a location or click on the map"}

            </p>


            {selectedCity && (

              <div className="mt-3 flex flex-wrap gap-2">

                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm">

                  City · {selectedCity}

                </span>


                {selectedLocality && (

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm">

                    Locality · {selectedLocality}

                  </span>

                )}

              </div>

            )}


            {latitude !== undefined &&
              longitude !== undefined && (

                <p className="mt-2 text-xs text-zinc-400">

                  {latitude.toFixed(6)},{" "}
                  {longitude.toFixed(6)}

                </p>

              )}

          </div>

        </div>

      </div>

    </div>

  );

}
