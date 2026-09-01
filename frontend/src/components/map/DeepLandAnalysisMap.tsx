"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Layers,
  MapPin,
  Flame,
  Droplets,
  Building,
  CheckCircle2,
  AlertTriangle,
  Compass,
  TrendingUp,
  Wind,
} from "lucide-react";

import { Property } from "@/types/property";
import { SoilZone, SoilAnalysis, LandGrowthAnalysis, AirIntelligenceAnalysis } from "@/services/landAnalysis";

interface DeepLandAnalysisMapProps {
  properties: Property[];
  soilZones: SoilZone[];
  selectedProperty?: Property | null;
  sampledLocation?: { lat: number; lng: number } | null;
  activeSoil?: SoilAnalysis | null;
  activeGrowth?: LandGrowthAnalysis | null;
  activeAir?: AirIntelligenceAnalysis | null;
  onSelectProperty?: (property: Property) => void;
  onSampleLocation?: (lat: number, lng: number) => void;
}

export default function DeepLandAnalysisMap({
  properties,
  soilZones,
  selectedProperty,
  sampledLocation,
  activeSoil,
  activeGrowth,
  activeAir,
  onSelectProperty,
  onSampleLocation,
}: DeepLandAnalysisMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polygonGroupRef = useRef<L.LayerGroup | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const sampleMarkerRef = useRef<L.Marker | null>(null);

  const [showZones, setShowZones] = useState(true);
  const [showGrowthLayer, setShowGrowthLayer] = useState(false);
  const [showAirLayer, setShowAirLayer] = useState(false);
  const [showProperties, setShowProperties] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView([26.8467, 80.9462], 11);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const polygonGroup = L.layerGroup().addTo(map);
    const markerGroup = L.layerGroup().addTo(map);
    polygonGroupRef.current = polygonGroup;
    markerGroupRef.current = markerGroup;

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (onSampleLocation) {
        onSampleLocation(lat, lng);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render Polygon GIS Overlays
  useEffect(() => {
    if (!polygonGroupRef.current) return;
    polygonGroupRef.current.clearLayers();

    if (!showZones && !showGrowthLayer && !showAirLayer) return;

    soilZones.forEach((zone) => {
      let fillColor = zone.color;
      let fillOpacity = 0.25;

      if (showGrowthLayer) {
        // High construction/growth = purple
        fillColor = "#a855f7";
        fillOpacity = 0.35;
      } else if (showAirLayer) {
        // High air quality = emerald green, low = amber
        fillColor = zone.water_table_avg_m > 15 ? "#10b981" : "#f59e0b";
        fillOpacity = 0.35;
      }

      const polygon = L.polygon(zone.bounds as L.LatLngExpression[], {
        color: fillColor,
        weight: 2,
        fillColor: fillColor,
        fillOpacity: fillOpacity,
      });

      polygon.bindTooltip(
        `<div class="p-1 text-xs font-semibold">
          <p class="text-emerald-400 font-bold">${zone.name}</p>
          <p class="text-[var(--stone-line)]">Soil: ${zone.soil_type}</p>
          <p class="text-purple-300">Bearing: ${zone.bearing_capacity_avg} kN/m²</p>
        </div>`,
        { sticky: true, className: "bg-[var(--ink)] text-white border-[var(--ink)] rounded shadow-lg" }
      );

      polygonGroupRef.current?.addLayer(polygon);
    });
  }, [soilZones, showZones, showGrowthLayer, showAirLayer]);

  // Render Property Markers
  useEffect(() => {
    if (!markerGroupRef.current || !mapRef.current) return;
    markerGroupRef.current.clearLayers();

    if (!showProperties) return;

    properties.forEach((property) => {
      const isSelected = selectedProperty?.id === property.id;

      const customIcon = L.divIcon({
        className: "geb-land-marker-wrapper",
        html: `
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-xl transition-all ${
            isSelected
              ? "bg-emerald-600 ring-4 ring-emerald-400/50 scale-110"
              : "bg-[var(--ink)]/90 border border-[var(--ink)] hover:bg-[var(--copper-700)] hover:scale-105"
          }">
            <span class="w-2 h-2 rounded-full ${isSelected ? "bg-emerald-300 animate-ping" : "bg-emerald-400"}"></span>
            <span>₹${(property.price / 100000).toFixed(1)}L</span>
          </div>
        `,
        iconSize: [80, 32],
        iconAnchor: [40, 16],
      });

      const marker = L.marker([property.latitude, property.longitude], {
        icon: customIcon,
      });

      marker.on("click", () => {
        if (onSelectProperty) {
          onSelectProperty(property);
        }
      });

      markerGroupRef.current?.addLayer(marker);
    });
  }, [properties, selectedProperty, showProperties]);

  // Sample Pin Placement
  useEffect(() => {
    if (!mapRef.current) return;

    if (sampleMarkerRef.current) {
      sampleMarkerRef.current.remove();
      sampleMarkerRef.current = null;
    }

    if (sampledLocation) {
      const pinIcon = L.divIcon({
        className: "geb-sample-pin",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-emerald-500/30 animate-ping absolute"></div>
            <div class="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xl border-2 border-white font-bold text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([sampledLocation.lat, sampledLocation.lng], {
        icon: pinIcon,
      }).addTo(mapRef.current);

      sampleMarkerRef.current = marker;

      mapRef.current.panTo([sampledLocation.lat, sampledLocation.lng], { animate: true });
    }
  }, [sampledLocation]);

  return (
    <div className="relative z-0 isolate w-full h-full min-h-[550px] rounded-2xl overflow-hidden border border-[var(--ink)] shadow-2xl bg-[var(--ink)]">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10 bg-[var(--ink)]/90 backdrop-blur-md border border-[var(--ink)] rounded-xl p-3 shadow-xl space-y-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-bold tracking-wide uppercase pb-1 border-b border-[var(--ink)]">
          <Layers className="w-4 h-4" />
          <span>GIS Layers</span>
        </div>

        <label className="flex items-center gap-2 text-[var(--stone-line)] cursor-pointer hover:text-white transition-colors">
          <input
            type="checkbox"
            checked={showZones}
            onChange={(e) => setShowZones(e.target.checked)}
            className="rounded border-[var(--ink)] text-emerald-500 focus:ring-emerald-500"
          />
          <span>Soil Types & Bearing Map</span>
        </label>

        <label className="flex items-center gap-2 text-[var(--stone-line)] cursor-pointer hover:text-white transition-colors">
          <input
            type="checkbox"
            checked={showGrowthLayer}
            onChange={(e) => setShowGrowthLayer(e.target.checked)}
            className="rounded border-[var(--ink)] text-purple-500 focus:ring-purple-500"
          />
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-purple-400" /> Satellite Growth Corridor
          </span>
        </label>

        <label className="flex items-center gap-2 text-[var(--stone-line)] cursor-pointer hover:text-white transition-colors">
          <input
            type="checkbox"
            checked={showAirLayer}
            onChange={(e) => setShowAirLayer(e.target.checked)}
            className="rounded border-[var(--ink)] text-orange-500 focus:ring-orange-500"
          />
          <span className="flex items-center gap-1">
            <Wind className="w-3 h-3 text-orange-400" /> Air Quality (AQI) Heatmap
          </span>
        </label>

        <label className="flex items-center gap-2 text-[var(--stone-line)] cursor-pointer hover:text-white transition-colors">
          <input
            type="checkbox"
            checked={showProperties}
            onChange={(e) => setShowProperties(e.target.checked)}
            className="rounded border-[var(--ink)] text-emerald-500 focus:ring-emerald-500"
          />
          <span>Property Listings</span>
        </label>
      </div>

      {/* Instruction Banner */}
      <div className="absolute bottom-4 left-4 z-10 bg-[var(--ink)]/85 backdrop-blur-md border border-[var(--ink)]/80 rounded-lg px-3 py-1.5 text-[11px] text-[var(--stone-line)] flex items-center gap-2 shadow-lg">
        <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
        <span>Click map to sample coordinates for **Soil + Growth + Air Intelligence**</span>
      </div>
    </div>
  );
}
