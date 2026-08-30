"use client";

import { useEffect, useState } from "react";

import { getProperties } from "@/services/properties";

export default function ApiTestPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getProperties()
      .then(setProperties)
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  }, []);

  return (
    <main className="min-h-screen bg-white p-10 text-black">
      <h1 className="mb-6 text-3xl font-bold">
        GEB API Test
      </h1>

      {error && (
        <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      <p className="mb-6">
        Properties received: {properties.length}
      </p>

      <div className="space-y-4">
        {properties.map((property) => (
          <div
            key={property.id}
            className="rounded-xl border p-5"
          >
            <h2 className="text-xl font-semibold">
              {property.title}
            </h2>

            <p>
              {property.city} · {property.locality}
            </p>

            <p>
              ₹{property.price.toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
