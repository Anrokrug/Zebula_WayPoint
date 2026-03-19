"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { ArrowLeft, MapPin, HomeIcon, Route, Trash2, Save, Info, LogOut, PlayCircle, StopCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-600">Loading map...</p>
    </div>
  ),
})

type Mode = "reception" | "house" | "road" | "view"

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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")

  const [mode, setMode] = useState<Mode>("view")
  const [houses, setHouses] = useState<House[]>([])
  const [roads, setRoads] = useState<Road[]>([])
  const [reception, setReception] = useState<Location | null>(null)
  const [currentRoad, setCurrentRoad] = useState<Location[]>([])
  const [showHouseDialog, setShowHouseDialog] = useState(false)
  const [houseNumber, setHouseNumber] = useState("")
  const [tempLocation, setTempLocation] = useState<Location | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingForHouse, setRecordingForHouse] = useState("")

  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_authenticated")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    const savedHouses = localStorage.getItem("farm_houses")
    const savedRoads = localStorage.getItem("farm_roads")
    const savedReception = localStorage.getItem("farm_reception")

    if (savedHouses) setHouses(JSON.parse(savedHouses))
    if (savedRoads) setRoads(JSON.parse(savedRoads))
    if (savedReception) setReception(JSON.parse(savedReception))
  }, [])

  const saveData = useCallback(() => {
    localStorage.setItem("farm_houses", JSON.stringify(houses))
    localStorage.setItem("farm_roads", JSON.stringify(roads))
    if (reception) {
      localStorage.setItem("farm_reception", JSON.stringify(reception))
    }
    localStorage.setItem("farm_last_update", Date.now().toString())
  }, [houses, roads, reception])

  useEffect(() => {
    saveData()
  }, [houses, roads, reception, saveData])

  const handleMapClick = (location: Location) => {
    if (mode === "reception") {
      setReception(location)
      setMode("view")
    } else if (mode === "house") {
      setTempLocation(location)
      setShowHouseDialog(true)
    } else if (mode === "road") {
      setCurrentRoad([...currentRoad, location])
    }
  }

  const handleLocationUpdate = (location: Location) => {
    if (isRecording) {
      setCurrentRoad((prev) => {
        const lastPoint = prev[prev.length - 1]
        if (
          !lastPoint ||
          Math.abs(lastPoint.lat - location.lat) > 0.00001 ||
          Math.abs(lastPoint.lng - location.lng) > 0.00001
        ) {
          return [...prev, location]
        }
        return prev
      })
    }
  }

  const saveHouse = () => {
    if (!houseNumber.trim() || !tempLocation) return

    const newHouse: House = {
      id: Date.now().toString(),
      number: houseNumber,
      location: tempLocation,
    }

    setHouses([...houses, newHouse])
    setHouseNumber("")
    setTempLocation(null)
    setShowHouseDialog(false)
    setMode("view")
  }

  const startRecording = () => {
    if (!reception) {
      alert("Please set reception location first!")
      return
    }

    const house = prompt("Enter house number for this path:")
    if (!house) return

    setRecordingForHouse(house)
    setIsRecording(true)
    setCurrentRoad([reception])
    setMode("road")
  }

  const stopRecording = () => {
    if (currentRoad.length < 10) {
      alert("Path is too short. Please drive/walk a longer distance.")
      return
    }

    const lastPoint = currentRoad[currentRoad.length - 1]

    const newHouse: House = {
      id: Date.now().toString(),
      number: recordingForHouse,
      location: lastPoint,
    }

    const newRoad: Road = {
      id: Date.now().toString(),
      points: currentRoad,
    }

    setHouses([...houses, newHouse])
    setRoads([...roads, newRoad])
    setCurrentRoad([])
    setIsRecording(false)
    setRecordingForHouse("")
    setMode("view")
  }

  const finishRoad = () => {
    if (currentRoad.length < 2) {
      alert("A road needs at least 2 points")
      return
    }

    const newRoad: Road = {
      id: Date.now().toString(),
      points: currentRoad,
    }

    setRoads([...roads, newRoad])
    setCurrentRoad([])
    setMode("view")
  }

  const clearAll = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      setHouses([])
      setRoads([])
      setReception(null)
      setCurrentRoad([])
      localStorage.removeItem("farm_houses")
      localStorage.removeItem("farm_roads")
      localStorage.removeItem("farm_reception")
      localStorage.removeItem("farm_last_update")
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    if (username === "Anro" && password === "401@Mr.tecky@0690") {
      setIsAuthenticated(true)
      sessionStorage.setItem("admin_authenticated", "true")
      setLoginError("")
    } else {
      setLoginError("Invalid username or password")
      setPassword("")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem("admin_authenticated")
    setUsername("")
    setPassword("")
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem", fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div style={{
          background: "white", borderRadius: "1.5rem", padding: "2.5rem",
          width: "100%", maxWidth: "420px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
        }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{
              width: "4rem", height: "4rem", background: "linear-gradient(135deg, #3b82f6, #4f46e5)",
              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1rem", boxShadow: "0 4px 15px rgba(79,70,229,0.4)",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#111827", margin: "0 0 0.3rem" }}>Admin Login</h1>
            <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: 0 }}>Zebula Golf Estate And Spa</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: "600", color: "#374151", marginBottom: "0.4rem", fontSize: "0.9rem" }}>
                Username
              </label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem",
                  border: "2px solid #e5e7eb", fontSize: "1rem", outline: "none",
                  boxSizing: "border-box", transition: "border-color 0.2s",
                }}
                onFocus={e => (e.target.style.borderColor = "#3b82f6")}
                onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontWeight: "600", color: "#374151", marginBottom: "0.4rem", fontSize: "0.9rem" }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem",
                  border: "2px solid #e5e7eb", fontSize: "1rem", outline: "none",
                  boxSizing: "border-box", transition: "border-color 0.2s",
                }}
                onFocus={e => (e.target.style.borderColor = "#3b82f6")}
                onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>
            {loginError && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "0.75rem",
                padding: "0.75rem 1rem", color: "#dc2626", fontSize: "0.9rem", marginBottom: "1rem",
              }}>
                {loginError}
              </div>
            )}
            <button
              type="submit"
              style={{
                width: "100%", padding: "0.85rem", borderRadius: "0.75rem", border: "none",
                background: "linear-gradient(135deg, #3b82f6, #4f46e5)", color: "white",
                fontSize: "1rem", fontWeight: "700", cursor: "pointer",
                boxShadow: "0 4px 15px rgba(79,70,229,0.4)",
              }}
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)", color: "white", padding: "0.75rem 1rem", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link href="/" style={{ color: "white", background: "rgba(255,255,255,0.15)", borderRadius: "0.5rem", padding: "0.4rem", display: "flex", alignItems: "center" }}>
              <ArrowLeft style={{ width: "1.2rem", height: "1.2rem" }} />
            </Link>
            <div>
              <h1 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0 }}>Admin - Map Setup</h1>
              <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.8)", margin: 0 }}>Zebula Golf Estate And Spa</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.9)" }}>
              Reception: {reception ? "✓" : "✗"} | Houses: {houses.length} | Roads: {roads.length}
            </div>
            <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "0.5rem", padding: "0.4rem", cursor: "pointer", color: "white", display: "flex", alignItems: "center" }} title="Logout">
              <LogOut style={{ width: "1.2rem", height: "1.2rem" }} />
            </button>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <MapComponent
          onMapClick={handleMapClick}
          houses={houses}
          roads={roads}
          reception={reception}
          currentRoad={currentRoad}
          mode={mode}
          isRecording={isRecording}
          onLocationUpdate={handleLocationUpdate}
        />
      </div>

      {isRecording && (
        <div style={{
          position: "absolute", top: "5rem", left: "50%", transform: "translateX(-50%)",
          background: "#ef4444", color: "white", padding: "0.75rem 1.5rem",
          borderRadius: "9999px", boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          zIndex: 50, display: "flex", alignItems: "center", gap: "0.75rem",
          fontFamily: "system-ui, sans-serif",
        }}>
          <div style={{ width: "0.75rem", height: "0.75rem", background: "white", borderRadius: "50%", animation: "ping 1s infinite" }} />
          <span style={{ fontWeight: "700" }}>Recording Path to House {recordingForHouse}</span>
          <span style={{ fontSize: "0.85rem", opacity: 0.85 }}>({currentRoad.length} pts)</span>
        </div>
      )}

      <div style={{ background: "white", borderTop: "2px solid #e5e7eb", boxShadow: "0 -4px 12px rgba(0,0,0,0.08)", padding: "0.75rem 1rem", flexShrink: 0 }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "0.75rem",
            padding: "0.6rem 1rem", marginBottom: "0.75rem", fontSize: "0.85rem", color: "#1d4ed8",
            display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <Info style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
            <span>
              {mode === "reception" && "Tap on the map to set the Clubhouse / Reception location"}
              {mode === "house" && "Tap on the map to place a house marker"}
              {mode === "road" && !isRecording && "Tap multiple points to draw a road, then click Finish"}
              {isRecording && "Drive or walk from reception to the house. Path is being recorded automatically."}
              {mode === "view" && "Select a mode below to start editing the map"}
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {!isRecording ? (
              <>
                {(["reception", "house", "road"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      if (m === "road" && mode === "road") { setCurrentRoad([]); setMode("view") }
                      else setMode(m)
                    }}
                    style={{
                      padding: "0.5rem 1rem", borderRadius: "0.6rem", fontWeight: "600", fontSize: "0.85rem",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem",
                      border: mode === m ? "none" : "2px solid #e5e7eb",
                      background: mode === m ? "#2563eb" : "white",
                      color: mode === m ? "white" : "#374151",
                      boxShadow: mode === m ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
                    }}
                  >
                    {m === "reception" && <><MapPin style={{ width: "1rem", height: "1rem" }} /> Reception</>}
                    {m === "house" && <><HomeIcon style={{ width: "1rem", height: "1rem" }} /> Add House</>}
                    {m === "road" && <><Route style={{ width: "1rem", height: "1rem" }} /> {mode === "road" ? "Cancel Road" : "Draw Road"}</>}
                  </button>
                ))}

                <button
                  onClick={startRecording}
                  disabled={!reception}
                  style={{
                    padding: "0.5rem 1rem", borderRadius: "0.6rem", fontWeight: "600", fontSize: "0.85rem",
                    cursor: reception ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "0.4rem",
                    border: "none", background: reception ? "#059669" : "#d1fae5", color: reception ? "white" : "#6b7280",
                    boxShadow: reception ? "0 4px 12px rgba(5,150,105,0.3)" : "none",
                  }}
                >
                  <PlayCircle style={{ width: "1rem", height: "1rem" }} /> Record Path
                </button>

                {mode === "road" && currentRoad.length >= 2 && (
                  <button onClick={finishRoad} style={{
                    padding: "0.5rem 1rem", borderRadius: "0.6rem", fontWeight: "600", fontSize: "0.85rem",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem",
                    border: "none", background: "#059669", color: "white",
                    boxShadow: "0 4px 12px rgba(5,150,105,0.3)",
                  }}>
                    <Save style={{ width: "1rem", height: "1rem" }} /> Finish Road
                  </button>
                )}

                <button onClick={clearAll} style={{
                  padding: "0.5rem 1rem", borderRadius: "0.6rem", fontWeight: "600", fontSize: "0.85rem",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem",
                  border: "none", background: "#ef4444", color: "white",
                  boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
                }}>
                  <Trash2 style={{ width: "1rem", height: "1rem" }} /> Clear All
                </button>
              </>
            ) : (
              <button onClick={stopRecording} style={{
                width: "100%", padding: "1rem", borderRadius: "0.75rem", fontWeight: "700", fontSize: "1.1rem",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                border: "none", background: "#ef4444", color: "white",
                boxShadow: "0 6px 20px rgba(239,68,68,0.4)",
              }}>
                <StopCircle style={{ width: "1.5rem", height: "1.5rem" }} /> Stop Recording &amp; Save Path
              </button>
            )}
          </div>
        </div>
      </div>

      {showHouseDialog && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
          <div style={{
            background: "white", borderRadius: "1.25rem", padding: "2rem",
            width: "100%", maxWidth: "380px", boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#111827", margin: "0 0 1.25rem" }}>Add House</h2>
            <input
              placeholder="Enter house number (e.g. 12)"
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveHouse()}
              autoFocus
              style={{
                width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem",
                border: "2px solid #e5e7eb", fontSize: "1rem", outline: "none",
                boxSizing: "border-box", marginBottom: "1.25rem",
              }}
            />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setShowHouseDialog(false)} style={{
                flex: 1, padding: "0.75rem", borderRadius: "0.75rem", fontWeight: "600",
                border: "2px solid #e5e7eb", background: "white", cursor: "pointer", color: "#374151",
              }}>Cancel</button>
              <button onClick={saveHouse} style={{
                flex: 1, padding: "0.75rem", borderRadius: "0.75rem", fontWeight: "700",
                border: "none", background: "#2563eb", color: "white", cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
              }}>Save House</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
