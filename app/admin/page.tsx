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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">Zebula Golf Estate And Spa</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {loginError && (
                <Alert variant="destructive">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Admin - Map Setup</h1>
              <p className="text-xs text-blue-100">Zebula Golf Estate And Spa</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm hidden sm:block">
              <span className="hidden sm:inline">Reception: {reception ? "✓" : "✗"} | </span>
              Houses: {houses.length} | Roads: {roads.length}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-blue-700"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
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
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-3 animate-pulse">
          <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
          <span className="font-bold">Recording Path to House {recordingForHouse}</span>
          <span className="text-sm">({currentRoad.length} points)</span>
        </div>
      )}

      <div className="bg-white border-t shadow-lg p-4">
        <div className="max-w-7xl mx-auto">
          <Alert className="mb-3">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">
              {mode === "reception" && "Tap on the map to set reception location"}
              {mode === "house" && "Tap on the map to place a house"}
              {mode === "road" && !isRecording && "Tap multiple points to draw a road, then click Finish"}
              {isRecording && "Drive or walk from reception to the house. Your path is being recorded automatically."}
              {mode === "view" && "Select a mode below to start editing the map"}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {!isRecording ? (
              <>
                <Button
                  onClick={() => setMode("reception")}
                  variant={mode === "reception" ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Set </span>Reception
                </Button>

                <Button
                  onClick={() => setMode("house")}
                  variant={mode === "house" ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <HomeIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Add </span>House
                </Button>

                <Button
                  onClick={() => {
                    if (mode === "road") {
                      setCurrentRoad([])
                      setMode("view")
                    } else {
                      setMode("road")
                    }
                  }}
                  variant={mode === "road" ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <Route className="h-4 w-4" />
                  {mode === "road" ? (
                    "Cancel Road"
                  ) : (
                    <>
                      <span className="hidden sm:inline">Draw </span>Road
                    </>
                  )}
                </Button>

                <Button
                  onClick={startRecording}
                  variant="default"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  disabled={!reception}
                >
                  <PlayCircle className="h-4 w-4" />
                  Record Path
                </Button>

                {mode === "road" && currentRoad.length >= 2 && (
                  <Button
                    onClick={finishRoad}
                    variant="default"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4" />
                    Finish Road
                  </Button>
                )}

                <Button onClick={clearAll} variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              </>
            ) : (
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="flex items-center gap-2 col-span-2 w-full text-lg py-6"
              >
                <StopCircle className="h-6 w-6" />
                Stop Recording & Save Path
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showHouseDialog} onOpenChange={setShowHouseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add House</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter house number"
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveHouse()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHouseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveHouse}>Save House</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
