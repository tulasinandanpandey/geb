"use client";

import dynamic from "next/dynamic";
import {
  Building2,
  Image as ImageIcon,
  Send,
  Sparkles,
  Tag,
  Calendar,
  Home as HomeIcon,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { createProperty } from "@/services/properties";
import PropertyImageUploader from "@/components/upload/PropertyImageUploader";
import Navbar from "@/components/layout/Navbar";

const LocationPicker = dynamic(
  () => import("@/components/location/LocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] items-center justify-center rounded-[1.5rem] bg-[var(--paper)]">
        <div className="text-sm font-medium text-[var(--ink-soft)]">
          Loading location picker...
        </div>
      </div>
    ),
  }
);

const propertyTypes = [
  { label: "Plot", value: "plot" },
  { label: "House", value: "house" },
  { label: "Apartment", value: "apartment" },
  { label: "Villa", value: "villa" },
  { label: "Commercial", value: "commercial" },
];

const furnishingOptions = [
  { label: "Unfurnished", value: "unfurnished" },
  { label: "Semi Furnished", value: "semi_furnished" },
  { label: "Fully Furnished", value: "fully_furnished" },
];

const bhkOptions = [
  { label: "1 BHK", value: 1 },
  { label: "2 BHK", value: 2 },
  { label: "3 BHK", value: 3 },
  { label: "4+ BHK", value: 4 },
];

interface SelectedLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  city: string;
  locality: string;
}

export default function ListPropertyPage() {
  const [listingType, setListingType] = useState<"sale" | "rent">("sale");
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("apartment");
  const [price, setPrice] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [furnishingStatus, setFurnishingStatus] = useState("semi_furnished");
  const [bhk, setBhk] = useState("2");
  const [availableFrom, setAvailableFrom] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [selectedLocation, setSelectedLocation] = useState("");
  const [image, setImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleLocationSelect(location: SelectedLocation) {
    setLatitude(location.latitude);
    setLongitude(location.longitude);
    setSelectedLocation(location.displayName);
    if (location.city) setCity(location.city);
    if (location.locality) setLocality(location.locality);
  }

  function handleUploadComplete(urls: string[]) {
    setImages(urls);
    setImage(urls[0] || "");
    if (urls.length > 0) setError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !title.trim() ||
      !price ||
      !city.trim() ||
      latitude === undefined ||
      longitude === undefined
    ) {
      setError(
        "Please fill in the required fields and select the exact property location on the map."
      );
      return;
    }

    if (images.length === 0) {
      setError("Please upload at least one property photo before publishing.");
      return;
    }

    try {
      setLoading(true);

      const priceVal = Number(price);
      await createProperty({
        title: title.trim(),
        property_type: propertyType,
        listing_type: listingType,
        price: priceVal,
        monthly_rent: listingType === "rent" ? priceVal : undefined,
        security_deposit: securityDeposit ? Number(securityDeposit) : undefined,
        available_from: availableFrom || undefined,
        furnishing_status: listingType === "rent" ? furnishingStatus : undefined,
        bhk: listingType === "rent" || propertyType === "apartment" || propertyType === "house" || propertyType === "villa" ? Number(bhk) : undefined,
        area: area ? Number(area) : undefined,
        area_unit: "sqft",
        city: city.trim(),
        locality: locality.trim() || undefined,
        latitude,
        longitude,
        image: images[0],
        images,
        description: description.trim() || undefined,
      });

      setSuccess(`Your property has been listed for ${listingType.toUpperCase()} successfully on GEB.`);

      // Reset form
      setTitle("");
      setPrice("");
      setSecurityDeposit("");
      setArea("");
      setCity("");
      setLocality("");
      setLatitude(undefined);
      setLongitude(undefined);
      setSelectedLocation("");
      setImage("");
      setImages([]);
      setDescription("");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while listing the property."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Navbar />

      {/* HEADER */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 15% 0%, var(--copper-100), transparent 45%)",
          }}
        />
      <div className="relative mx-auto max-w-5xl px-6 pb-8 pt-12 lg:px-8">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--stone-line)] bg-white px-4 py-2 text-sm font-medium shadow-sm">
          <Sparkles size={15} className="text-[var(--violet)]" />
          List For Sale or Rent on GEB
        </div>

        <h1 className="font-display text-5xl font-medium tracking-tight md:text-7xl">
          List your property.
          <br />
          <span className="text-[var(--ink-soft)]">Reach buyers & renters.</span>
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
          List your plot, apartment, or house for sale or rent. Make it discoverable through our marketplace, maps, and AI discovery.
        </p>
      </div>
      </section>

      {/* FORM */}
      <section className="mx-auto max-w-5xl px-6 pb-20 lg:px-8">
        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-[var(--stone-line)] bg-white p-6 shadow-xl shadow-black/5 md:p-10 space-y-10"
        >
          {/* LISTING TYPE TOGGLE */}
          <div className="border-b border-[var(--stone-line)] pb-8">
            <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-[var(--ink-soft)]">
              Listing Goal *
            </label>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <button
                type="button"
                onClick={() => setListingType("sale")}
                className={`flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-extrabold text-sm border transition-all ${
                  listingType === "sale"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                    : "bg-[var(--paper)] text-[var(--ink-soft)] border-[var(--stone-line)] hover:bg-[var(--paper)]"
                }`}
              >
                <Tag size={16} />
                <span>FOR SALE</span>
              </button>

              <button
                type="button"
                onClick={() => setListingType("rent")}
                className={`flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-extrabold text-sm border transition-all ${
                  listingType === "rent"
                    ? "bg-orange-600 text-white border-orange-600 shadow-md"
                    : "bg-[var(--paper)] text-[var(--ink-soft)] border-[var(--stone-line)] hover:bg-[var(--paper)]"
                }`}
              >
                <HomeIcon size={16} />
                <span>FOR RENT</span>
              </button>
            </div>
          </div>

          {/* PROPERTY DETAILS */}
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ink)] text-white">
                <Building2 size={19} />
              </div>
              <div>
                <h2 className="font-semibold text-[var(--ink)]">Property Details</h2>
                <p className="text-sm text-[var(--ink-soft)]">Tell clients about your listing.</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* TITLE */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold">
                  Property Title *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    listingType === "rent"
                      ? "e.g. Spacious 2BHK Fully Furnished Flat for Rent in Gomti Nagar"
                      : "e.g. Premium residential plot in Gomti Nagar"
                  }
                  className="w-full rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] px-4 py-3.5 text-sm outline-none transition focus:border-[var(--ink)] focus:bg-white"
                />
              </div>

              {/* PROPERTY TYPE */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Property Type *
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] px-4 py-3.5 text-sm outline-none focus:border-[var(--ink)]"
                >
                  {propertyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* PRICE / MONTHLY RENT */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  {listingType === "rent" ? "Monthly Rent (₹/month) *" : "Asking Price (₹) *"}
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={listingType === "rent" ? "25000" : "4200000"}
                  min="1"
                  className="w-full rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] px-4 py-3.5 text-sm outline-none focus:border-[var(--ink)]"
                />
              </div>

              {/* RENTAL SPECIFIC FIELDS */}
              {listingType === "rent" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Security Deposit (₹)
                    </label>
                    <input
                      type="number"
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(e.target.value)}
                      placeholder="50000"
                      className="w-full rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] px-4 py-3.5 text-sm outline-none focus:border-[var(--ink)]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Furnishing Status
                    </label>
                    <select
                      value={furnishingStatus}
                      onChange={(e) => setFurnishingStatus(e.target.value)}
                      className="w-full rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] px-4 py-3.5 text-sm outline-none focus:border-[var(--ink)]"
                    >
                      {furnishingOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      BHK Configuration
                    </label>
                    <select
                      value={bhk}
                      onChange={(e) => setBhk(e.target.value)}
                      className="w-full rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] px-4 py-3.5 text-sm outline-none focus:border-[var(--ink)]"
                    >
                      {bhkOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Available From
                    </label>
                    <input
                      type="date"
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                      className="w-full rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] px-4 py-3.5 text-sm outline-none focus:border-[var(--ink)]"
                    />
                  </div>
                </>
              )}

              {/* AREA */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Area (sqft)
                </label>
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="1200"
                  min="1"
                  className="w-full rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] px-4 py-3.5 text-sm outline-none focus:border-[var(--ink)]"
                />
              </div>
            </div>
          </div>

          {/* LOCATION */}
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--paper)]">
                <span className="text-lg">📍</span>
              </div>
              <div>
                <h2 className="font-semibold text-[var(--ink)]">Property Location</h2>
                <p className="text-sm text-[var(--ink-soft)]">
                  Search or click the exact location pin on the map.
                </p>
              </div>
            </div>

            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onLocationSelect={handleLocationSelect}
            />

            {selectedLocation && (
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Location selected
                </p>
                <p className="mt-1 text-sm font-medium text-emerald-900">
                  {selectedLocation}
                </p>
              </div>
            )}

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">City *</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Lucknow"
                  className="w-full rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] px-4 py-3.5 text-sm outline-none focus:border-[var(--ink)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Locality</label>
                <input
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="Gomti Nagar"
                  className="w-full rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] px-4 py-3.5 text-sm outline-none focus:border-[var(--ink)]"
                />
              </div>
            </div>
          </div>

          {/* MEDIA */}
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--paper)]">
                <ImageIcon size={19} />
              </div>
              <div>
                <h2 className="font-semibold text-[var(--ink)]">Property Photos</h2>
                <p className="text-sm text-[var(--ink-soft)]">Add photos to attract clients.</p>
              </div>
            </div>

            <PropertyImageUploader onUploadComplete={handleUploadComplete} />

            {images.length > 0 && (
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
                <p className="text-sm font-semibold text-emerald-800">
                  ✓ {images.length} photo{images.length !== 1 ? "s" : ""} attached
                </p>
              </div>
            )}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe property features, furnishing, road access, deposit terms..."
                rows={5}
                className="w-full resize-none rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] px-4 py-3.5 text-sm outline-none focus:border-[var(--ink)]"
              />
            </div>
          </div>

          {/* MESSAGES */}
          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
              {success}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] py-4 font-bold text-white transition hover:bg-[var(--copper-700)] disabled:opacity-50 cursor-pointer shadow-lg"
          >
            <Send size={18} />
            {loading ? "Publishing listing..." : `Publish Property for ${listingType.toUpperCase()}`}
          </button>
        </form>
      </section>
    </main>
  );
}
