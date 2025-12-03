"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { ArrowLeft, Navigation, Info } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

const GuestMapComponent = dynamic(() => import("@/components/GuestMapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-600">Loading map...</p>
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
      if (e.key === "farm_last_update") {
        loadData()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    const interval = setInterval(() => {
      loadData()
    }, 3000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  if (!reception || houses.length === 0) {
    return (
      <div className="h-screen flex flex-col">
        <header className="bg-green-600 text-white p-4 shadow-lg">
          <div className="flex items-center gap-3 max-w-7xl mx-auto">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-green-700">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Find Your House</h1>
              <p className="text-xs text-green-100">Zebula Golf Estate And Spa</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
          <Alert className="max-w-md">
            <Info className="h-4 w-4" />
            <AlertTitle>Setup Required</AlertTitle>
            <AlertDescription>
              The admin needs to set up the reception location and houses first. Please contact the farm administrator.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const sortedHouses = [...houses].sort((a, b) =>
    a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: "base" }),
  )

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-green-600 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-green-700">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Find Your House</h1>
            <p className="text-xs text-green-100">Zebula Golf Estate And Spa</p>
          </div>
        </div>
      </header>

      <div className="bg-white border-b shadow-sm p-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-semibold text-gray-700 mb-3">Select Your House:</p>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {sortedHouses.map((house) => (
                <Button
                  key={house.id}
                  onClick={() => setSelectedHouse(house)}
                  variant={selectedHouse?.id === house.id ? "default" : "outline"}
                  className="min-w-[80px]"
                >
                  {house.number}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      <div className="flex-1 relative">
        <GuestMapComponent houses={houses} roads={roads} reception={reception} selectedHouse={selectedHouse} />
      </div>

      {selectedHouse && (
        <div className="bg-white border-t shadow-lg p-4">
          <div className="max-w-7xl mx-auto">
            <Alert>
              <Navigation className="h-4 w-4" />
              <AlertTitle>Navigating to House {selectedHouse.number}</AlertTitle>
              <AlertDescription>
                Follow the green line on the map from the reception (blue marker) to your house (red marker).
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
    </div>
  )
}
