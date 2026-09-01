const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface NPKFertility {
  nitrogen_kg_ha: number;
  phosphorus_kg_ha: number;
  potassium_kg_ha: number;
  organic_carbon_percent: number;
  overall_health: string;
}

export interface SoilAnalysis {
  property_id?: string | null;
  property_title?: string | null;
  latitude: number;
  longitude: number;
  area_sqft?: number | null;
  zone_name: string;
  soil_type: string;
  soil_ph: number;
  bearing_capacity_kpa: number;
  water_table_depth_m: number;
  elevation_m: number;
  slope_percent: number;
  npk_fertility: NPKFertility;
  flood_risk: "Low" | "Medium" | "High";
  erosion_risk: "Low" | "Medium" | "High";
  seismic_zone: string;
  construction_suitability_score: number;
  agricultural_suitability_score: number;
  recommended_foundation: string;
  suitable_crops: string[];
  soil_remediation_notes: string;
  summary: string;
}

export interface LandGrowthAnalysis {
  property_id?: string | null;
  property_title?: string | null;
  latitude: number;
  longitude: number;
  area_sqft?: number | null;
  growth_stage: string;
  land_use_zoning: string;
  ndvi_vegetation_index: number;
  ndvi_5year_trend: string;
  builtup_expansion_5yr_pct: number;
  highway_distance_km: number;
  metro_distance_km: number;
  commercial_hub_distance_km: number;
  appreciation_velocity_score: number;
  zoning_transition_probability: string;
  summary: string;
}

export interface AirIntelligenceAnalysis {
  property_id?: string | null;
  property_title?: string | null;
  latitude: number;
  longitude: number;
  aqi: number;
  aqi_category: "Good" | "Satisfactory" | "Moderate" | "Poor" | "Severe";
  health_impact: string;
  pm25_ug_m3: number;
  pm10_ug_m3: number;
  no2_ppb: number;
  co_ppm: number;
  green_belt_buffer_km: number;
  industrial_buffer_km: number;
  seasonal_monsoon_aqi: number;
  seasonal_winter_aqi: number;
  environmental_health_score: number;
  data_source: string;
  summary: string;
}

export interface CombinerAnalysis {
  property_title?: string;
  latitude: number;
  longitude: number;
  overall_suitability_score: number;
  investment_suitability_score: number;
  residential_living_score: number;
  agricultural_yield_score: number;
  key_tradeoffs: string[];
  data_confidence_rating: string;
  uncertainty_disclosures: string[];
  summary: string;
}

export interface BuilderFeasibilityAnalysis {
  property_id?: string | null;
  property_title?: string | null;
  plot_area_sqft: number;
  road_width_m: number;
  proposed_usage: string;
  estimated_coverage_pct: number;
  max_ground_coverage_sqft: number;
  estimated_far_multiplier: number;
  potential_builtup_sqft: number;
  estimated_max_floors: string;
  recommended_foundation: string;
  basement_feasibility: string;
  bearing_capacity_kpa: number;
  regulatory_disclaimer: string;
  summary: string;
}

export interface ComprehensiveLandReport {
  soil_analysis: SoilAnalysis;
  growth_analysis: LandGrowthAnalysis;
  air_analysis: AirIntelligenceAnalysis;
  combiner_analysis: CombinerAnalysis;
  builder_analysis: BuilderFeasibilityAnalysis;
}

export interface SoilZone {
  id: string;
  name: string;
  soil_type: string;
  color: string;
  center: [number, number];
  bounds: [[number, number], [number, number], [number, number], [number, number]];
  bearing_capacity_avg: number;
  ph_avg: number;
  water_table_avg_m: number;
  agricultural_score: number;
  construction_score: number;
  primary_crops: string[];
  foundation: string;
}

export interface AnalyzeLandInput {
  property_id?: string;
  latitude?: number;
  longitude?: number;
}

export interface AgentQueryInput {
  message: string;
  analysis: any;
  conversation_history?: Array<{ role: string; content: string }>;
}

export async function analyzeLand(input: AnalyzeLandInput): Promise<SoilAnalysis> {
  const response = await fetch(`${API_URL}/api/land-analysis/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  return data.analysis;
}

export async function analyzeComprehensiveLand(input: AnalyzeLandInput): Promise<ComprehensiveLandReport> {
  const response = await fetch(`${API_URL}/api/land-analysis/comprehensive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return await response.json();
}

export async function getSoilZones(): Promise<SoilZone[]> {
  const response = await fetch(`${API_URL}/api/land-analysis/zones`, { cache: "no-store" });
  const data = await response.json();
  return data.zones;
}

export async function querySoilAgent(input: AgentQueryInput): Promise<string> {
  const response = await fetch(`${API_URL}/api/land-analysis/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: input.message, analysis: input.analysis, conversation_history: input.conversation_history }),
  });
  const data = await response.json();
  return data.answer;
}

export async function queryGrowthAgent(input: AgentQueryInput): Promise<string> {
  const response = await fetch(`${API_URL}/api/land-analysis/growth/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  return data.answer;
}

export async function queryAirAgent(input: AgentQueryInput): Promise<string> {
  const response = await fetch(`${API_URL}/api/land-analysis/air/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  return data.answer;
}

export async function queryCombinerAgent(input: AgentQueryInput): Promise<string> {
  const response = await fetch(`${API_URL}/api/land-analysis/combiner/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  return data.answer;
}

export async function queryBuilderAgent(input: AgentQueryInput): Promise<string> {
  const response = await fetch(`${API_URL}/api/land-analysis/builder/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  return data.answer;
}
