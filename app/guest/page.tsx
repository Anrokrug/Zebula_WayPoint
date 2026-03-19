"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { ArrowLeft, Navigation, Info } from "lucide-react"
import Link from "next/link"

const GuestMapComponent = dynamic(() => import("@/components/GuestMapComponent"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6" }}>
      <p style={{ color: "#6b7280" }}>Loading map...</p>
    </div>
  ),
})

interface Location {
  lat: number
  lng: number
}

interface House {
  id: string
  number: string
  location: Location
}

interface Road {
  id: string
  points: Location[]
}

export default function GuestPage() {
  const [houses, setHouses] = useState<House[]>([])
  const [roads, setRoads] = useState<Road[]>([])
  const [reception, setReception] = useState<Location | null>(null)
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null)

  const loadData = () => {
    const savedHouses = localStorage.getItem("farm_houses")
    const savedRoads = localStorage.getItem("farm_roads")
    const savedReception = localStorage.getItem("farm_reception")
    if (savedHouses) setHouses(JSON.parse(savedHouses))
    if (savedRoads) setRoads(JSON.parse(savedRoads))
    if (savedReception) setReception(JSON.parse(savedReception))
  }

  useEffect(() => {
    loadData()
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "farm_last_update") loadData()
    }
    window.addEventListener("storage", handleStorageChange)
    const interval = setInterval(loadData, 3000)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const sortedHouses = [...houses].sort((a, b) =>
    a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: "base" })
  )

  if (!reception || houses.length === 0) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif" }}>
        <header style={{ background: "linear-gradient(135deg, #059669, #0d9488)", color: "white", padding: "0.75rem 1rem", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link href="/" style={{ color: "white", background: "rgba(255,255,255,0.15)", borderRadius: "0.5rem", padding: "0.4rem", display: "flex" }}>
              <ArrowLeft style={{ width: "1.2rem", height: "1.2rem" }} />
            </Link>
            <div>
              <h1 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0 }}>Find Your House</h1>
              <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.8)", margin: 0 }}>Zebula Golf Estate And Spa</p>
            </div>
          </div>
        </header>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", background: "#f9fafb" }}>
          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "1rem",
            padding: "1.5rem", maxWidth: "420px", textAlign: "center",
          }}>
            <Info style={{ width: "2rem", height: "2rem", color: "#2563eb", margin: "0 auto 0.75rem" }} />
            <h3 style={{ fontWeight: "700", color: "#1e40af", margin: "0 0 0.5rem" }}>Setup Required</h3>
            <p style={{ color: "#1d4ed8", margin: 0, fontSize: "0.9rem" }}>
              The admin needs to set up the reception location and houses first. Please contact the estate administrator.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #059669, #0d9488)", color: "white", padding: "0.75rem 1rem", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", maxWidth: "1280px", margin: "0 auto" }}>
          <Link href="/" style={{ color: "white", background: "rgba(255,255,255,0.15)", borderRadius: "0.5rem", padding: "0.4rem", display: "flex" }}>
            <ArrowLeft style={{ width: "1.2rem", height: "1.2rem" }} />
          </Link>
          <div>
            <h1 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0 }}>Find Your House</h1>
            <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.8)", margin: 0 }}>Zebula Golf Estate And Spa</p>
          </div>
        </div>
      </header>

      {/* House selector */}
      <div style={{ background: "white", borderBottom: "2px solid #e5e7eb", padding: "0.75rem 1rem", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <p style={{ fontSize: "0.85rem", fontWeight: "700", color: "#374151", margin: "0 0 0.6rem" }}>Select Your House Number:</p>
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.4rem" }}>
          {sortedHouses.map((house) => (
            <button
              key={house.id}
              onClick={() => setSelectedHouse(house)}
              style={{
                minWidth: "3.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.6rem", fontWeight: "700",
                fontSize: "0.9rem", cursor: "pointer", flexShrink: 0,
                border: selectedHouse?.id === house.id ? "none" : "2px solid #d1fae5",
                background: selectedHouse?.id === house.id ? "#059669" : "white",
                color: selectedHouse?.id === house.id ? "white" : "#059669",
                boxShadow: selectedHouse?.id === house.id ? "0 4px 12px rgba(5,150,105,0.4)" : "none",
              }}
            >
              {house.number}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <GuestMapComponent houses={houses} roads={roads} reception={reception} selectedHouse={selectedHouse} />
      </div>

      {/* Navigation info */}
      {selectedHouse && (
        <div style={{ background: "white", borderTop: "2px solid #e5e7eb", padding: "0.75rem 1rem", flexShrink: 0 }}>
          <div style={{
            background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: "0.75rem",
            padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem",
          }}>
            <Navigation style={{ width: "1.2rem", height: "1.2rem", color: "#059669", flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: "700", color: "#065f46", margin: "0 0 0.15rem", fontSize: "0.9rem" }}>
                Navigating to House {selectedHouse.number}
              </p>
              <p style={{ color: "#047857", margin: 0, fontSize: "0.8rem" }}>
                Follow the green route on the map from the Clubhouse to your house.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
