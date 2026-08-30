"use client";

import dynamic from "next/dynamic";

import {
  ArrowLeft,
  Building2,
  Image as ImageIcon,
  Send,
  Sparkles,
} from "lucide-react";

import Link from "next/link";

import {
  FormEvent,
  useState,
} from "react";

import {
  createProperty,
} from "@/services/properties";

import PropertyImageUploader from "@/components/upload/PropertyImageUploader";


const LocationPicker = dynamic(
  () =>
    import(
      "@/components/location/LocationPicker"
    ),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-[380px] items-center justify-center rounded-[1.5rem] bg-zinc-100">
        <div className="text-sm font-medium text-zinc-400">
          Loading location picker...
        </div>
      </div>
    ),
  }
);


const propertyTypes = [
  {
    label: "Plot",
    value: "plot",
  },
  {
    label: "House",
    value: "house",
  },
  {
    label: "Apartment",
    value: "apartment",
  },
  {
    label: "Villa",
    value: "villa",
  },
  {
    label: "Commercial",
    value: "commercial",
  },
];


interface SelectedLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  city: string;
  locality: string;
}


export default function ListPropertyPage() {

  const [title, setTitle] =
    useState("");

  const [propertyType, setPropertyType] =
    useState("plot");

  const [price, setPrice] =
    useState("");

  const [area, setArea] =
    useState("");

  const [city, setCity] =
    useState("");

  const [locality, setLocality] =
    useState("");

  const [latitude, setLatitude] =
    useState<number | undefined>();

  const [longitude, setLongitude] =
    useState<number | undefined>();

  const [selectedLocation, setSelectedLocation] =
    useState("");

  const [image, setImage] =
    useState("");

  const [images, setImages] =
    useState<string[]>([]);

  const [description, setDescription] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  /*
   * ==========================================================
   * LOCATION SELECTED FROM MAP
   * ==========================================================
   */

  function handleLocationSelect(
    location: SelectedLocation
  ) {

    setLatitude(
      location.latitude
    );

    setLongitude(
      location.longitude
    );

    setSelectedLocation(
      location.displayName
    );


    if (location.city) {

      setCity(
        location.city
      );

    }


    if (location.locality) {

      setLocality(
        location.locality
      );

    }

  }


  /*
   * ==========================================================
   * PHOTOS UPLOADED
   * ==========================================================
   */

  function handleUploadComplete(
    urls: string[]
  ) {

    setImages(
      urls
    );

    /*
     * First uploaded image becomes
     * the cover image.
     */

    setImage(
      urls[0] || ""
    );

    if (urls.length > 0) {

      setError("");

    }

  }


  /*
   * ==========================================================
   * SUBMIT PROPERTY
   * ==========================================================
   */

  async function handleSubmit(
    event: FormEvent
  ) {

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

      setError(
        "Please upload at least one property photo before publishing."
      );

      return;

    }


    try {

      setLoading(true);


      await createProperty({

        title:
          title.trim(),

        property_type:
          propertyType,

        price:
          Number(price),

        area:
          area
            ? Number(area)
            : undefined,

        area_unit:
          "sqft",

        city:
          city.trim(),

        locality:
          locality.trim() ||
          undefined,

        latitude,

        longitude,

        image:
          images[0],

        images,

        description:
          description.trim() ||
          undefined,

      });


      setSuccess(
        "Your property has been listed successfully on GEB."
      );


      /*
       * Reset form
       */

      setTitle("");

      setPrice("");

      setArea("");

      setCity("");

      setLocality("");

      setLatitude(
        undefined
      );

      setLongitude(
        undefined
      );

      setSelectedLocation("");

      setImage("");

      setImages([]);

      setDescription("");


    } catch (err) {

      console.error(
        err
      );


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

    <main className="min-h-screen bg-[#f7f7f5] text-zinc-950">


      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">

        <Link
          href="/"
          className="flex items-center gap-2"
        >

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-sm font-bold text-white">
            G
          </div>

          <span className="text-xl font-bold tracking-tight">
            GEB
          </span>

        </Link>


        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-zinc-100"
        >

          <ArrowLeft size={15} />

          Back to GEB

        </Link>

      </nav>


      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="mx-auto max-w-5xl px-6 pb-8 pt-12 lg:px-8">

        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium shadow-sm">

          <Sparkles size={15} />

          Sell smarter with GEB

        </div>


        <h1 className="font-serif text-5xl font-medium tracking-tight md:text-7xl">

          List your property.

          <br />

          <span className="text-zinc-400">
            Reach the right buyer.
          </span>

        </h1>


        <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-500">

          Add your property to GEB and make it discoverable
          through our marketplace, map and AI-powered property discovery.

        </p>

      </section>


      {/* =====================================================
          FORM
      ===================================================== */}

      <section className="mx-auto max-w-5xl px-6 pb-20 lg:px-8">

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5 md:p-10"
        >


          {/* =================================================
              PROPERTY DETAILS
          ================================================= */}

          <div className="mb-10">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white">

                <Building2 size={19} />

              </div>

              <div>

                <h2 className="font-semibold">
                  Property details
                </h2>

                <p className="text-sm text-zinc-400">
                  Tell buyers what you're selling.
                </p>

              </div>

            </div>


            <div className="grid gap-5 md:grid-cols-2">


              {/* TITLE */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-semibold">
                  Property title *
                </label>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Premium residential plot in Gomti Nagar"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm outline-none transition focus:border-zinc-950 focus:bg-white"
                />

              </div>


              {/* TYPE */}

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Property type *
                </label>

                <select
                  value={propertyType}
                  onChange={(event) =>
                    setPropertyType(
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm outline-none focus:border-zinc-950"
                >

                  {propertyTypes.map(
                    (type) => (

                      <option
                        key={type.value}
                        value={type.value}
                      >

                        {type.label}

                      </option>

                    )
                  )}

                </select>

              </div>


              {/* PRICE */}

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Asking price (₹) *
                </label>

                <input
                  type="number"
                  value={price}
                  onChange={(event) =>
                    setPrice(
                      event.target.value
                    )
                  }
                  placeholder="4200000"
                  min="1"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm outline-none focus:border-zinc-950"
                />

              </div>


              {/* AREA */}

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Area (sqft)
                </label>

                <input
                  type="number"
                  value={area}
                  onChange={(event) =>
                    setArea(
                      event.target.value
                    )
                  }
                  placeholder="1800"
                  min="1"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm outline-none focus:border-zinc-950"
                />

              </div>

            </div>

          </div>


          {/* =================================================
              LOCATION
          ================================================= */}

          <div className="mb-10">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">

                <span className="text-lg">
                  📍
                </span>

              </div>

              <div>

                <h2 className="font-semibold">
                  Property location
                </h2>

                <p className="text-sm text-zinc-400">
                  Search for your property or click the exact location on the map.
                </p>

              </div>

            </div>


            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onLocationSelect={
                handleLocationSelect
              }
            />


            {/* LOCATION CONFIRMATION */}

            {selectedLocation && (

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">

                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Location selected
                </p>

                <p className="mt-1 text-sm font-medium text-emerald-900">
                  {selectedLocation}
                </p>

                {latitude !== undefined &&
                  longitude !== undefined && (

                    <p className="mt-1 text-xs text-emerald-600">

                      {latitude.toFixed(6)},{" "}
                      {longitude.toFixed(6)}

                    </p>

                  )}

              </div>

            )}


            {/* CITY / LOCALITY */}

            <div className="mt-5 grid gap-5 md:grid-cols-2">

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  City *
                </label>

                <input
                  value={city}
                  onChange={(event) =>
                    setCity(
                      event.target.value
                    )
                  }
                  placeholder="Lucknow"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm outline-none focus:border-zinc-950"
                />

              </div>


              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Locality
                </label>

                <input
                  value={locality}
                  onChange={(event) =>
                    setLocality(
                      event.target.value
                    )
                  }
                  placeholder="Gomti Nagar"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm outline-none focus:border-zinc-950"
                />

              </div>

            </div>

          </div>


          {/* =================================================
              MEDIA
          ================================================= */}

          <div className="mb-10">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">

                <ImageIcon size={19} />

              </div>

              <div>

                <h2 className="font-semibold">
                  Property photos
                </h2>

                <p className="text-sm text-zinc-400">
                  Add high-quality photos to attract serious buyers.
                </p>

              </div>

            </div>


            <PropertyImageUploader
              onUploadComplete={
                handleUploadComplete
              }
            />


            {images.length > 0 && (

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">

                <p className="text-sm font-semibold text-emerald-800">

                  ✓ {images.length} photo
                  {images.length !== 1
                    ? "s"
                    : ""} attached to this listing

                </p>

                <p className="mt-1 text-xs text-emerald-600">

                  The first photo will be used as the property cover image.

                </p>

              </div>

            )}


            {/* DESCRIPTION */}

            <div className="mt-5">

              <label className="mb-2 block text-sm font-semibold">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Describe the property, surroundings, road access, amenities, etc."
                rows={5}
                className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm outline-none focus:border-zinc-950"
              />

            </div>

          </div>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">

              {error}

            </div>

          )}


          {/* =================================================
              SUCCESS
          ================================================= */}

          {success && (

            <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">

              {success}

            </div>

          )}


          {/* =================================================
              SUBMIT
          ================================================= */}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-6 py-4 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {loading ? (

              <>

                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                Publishing property...

              </>

            ) : (

              <>

                <Send size={18} />

                List Property on GEB

              </>

            )}

          </button>


          <p className="mt-4 text-center text-xs text-zinc-400">

            By listing, you confirm that the property information
            provided is accurate.

          </p>

        </form>

      </section>


    </main>

  );

}
