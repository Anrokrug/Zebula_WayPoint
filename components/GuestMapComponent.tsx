"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface Location {
  lat: number
  lng: number
}

interface Road {
  points: Location[]
}

interface House {
  number: string
  location: Location
}

interface MapData {
  reception: Location | null
  houses: House[]
  roads: Road[]
}

export default function GuestMapComponent({
  houses,
  roads,
  reception,
  selectedHouse,
}: {
  houses: House[]
  roads: Road[]
  reception: Location | null
  selectedHouse: House | null
}) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const currentLocationMarkerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    setTimeout(() => {
      if (!mapContainerRef.current) return

      console.log("[v0] Initializing guest map...")

      const map = L.map(mapContainerRef.current, {
        center: [-24.0, 29.0],
        zoom: 15,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map)

      mapRef.current = map

      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    }, 100)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCurrentLocation(newLocation)

        if (mapRef.current) {
          mapRef.current.setView([newLocation.lat, newLocation.lng], mapRef.current.getZoom(), {
            animate: true,
          })
        }
      },
      (error) => {
        console.error("[v0] Geolocation error:", error)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      },
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !currentLocation) return

    if (currentLocationMarkerRef.current) {
      mapRef.current.removeLayer(currentLocationMarkerRef.current)
    }

    const currentLocationIcon = L.divIcon({
      className: "custom-icon",
      html: `<div style="
        background-color: #4285F4; 
        width: 20px; 
        height: 20px; 
        border-radius: 50%; 
        border: 3px solid white; 
        box-shadow: 0 0 10px rgba(66, 133, 244, 0.6);
        position: relative;
      ">
        <div style="
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(66, 133, 244, 0.3);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      </style>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })

    const marker = L.marker([currentLocation.lat, currentLocation.lng], {
      icon: currentLocationIcon,
      zIndexOffset: 1000,
    })
      .bindPopup("<b>Your Location</b>")
      .addTo(mapRef.current)

    currentLocationMarkerRef.current = marker
  }, [currentLocation])

  useEffect(() => {
    if (!mapRef.current || !reception) return

    const map = mapRef.current
    map.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Polyline || layer instanceof L.Marker) {
        map.removeLayer(layer)
      }
    })

    roads.forEach((road) => {
      if (road.points.length > 1) {
        L.polyline(
          road.points.map((p) => [p.lat, p.lng]),
          {
            color: "gray",
            weight: 3,
          },
        ).addTo(map)
      }
    })

    const receptionIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div style="background-color: blue; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white;">R</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })

    L.marker([reception.lat, reception.lng], {
      icon: receptionIcon,
    }).addTo(map)

    houses.forEach((house) => {
      const houseIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: ${
          selectedHouse && house.number === selectedHouse.number ? "green" : "red"
        }; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white;">${
          house.number
        }</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      L.marker([house.location.lat, house.location.lng], {
        icon: houseIcon,
      }).addTo(map)
    })

    if (selectedHouse && reception) {
      const route = findRoute(reception, selectedHouse.location, roads)
      if (route.length > 0) {
        L.polyline(
          route.map((p) => [p.lat, p.lng]),
          {
            color: "green",
            weight: 5,
            opacity: 0.7,
          },
        ).addTo(map)

        const bounds = L.latLngBounds(route.map((p) => [p.lat, p.lng]))
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [houses, roads, reception, selectedHouse])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px] rounded-lg" />
    </div>
  )
}

function findRoute(start: Location, end: Location, roads: Road[]): Location[] {
  const allPoints: Location[] = [start]
  roads.forEach((road) => {
    allPoints.push(...road.points)
  })
  allPoints.push(end)

  const findNearest = (target: Location, points: Location[]): Location => {
    let nearest = points[0]
    let minDist = Number.POSITIVE_INFINITY

    points.forEach((point) => {
      const dist = Math.sqrt(Math.pow(point.lat - target.lat, 2) + Math.pow(point.lng - target.lng, 2))
      if (dist < minDist) {
        minDist = dist
        nearest = point
      }
    })

    return nearest
  }

  const startNearest = findNearest(start, allPoints)
  const endNearest = findNearest(end, allPoints)

  const route: Location[] = [start, startNearest]
  const visited = new Set<string>()
  visited.add(`${start.lat},${start.lng}`)
  visited.add(`${startNearest.lat},${startNearest.lng}`)

  let current = startNearest

  for (let i = 0; i < 100; i++) {
    if (Math.sqrt(Math.pow(current.lat - endNearest.lat, 2) + Math.pow(current.lng - endNearest.lng, 2)) < 0.001) {
      break
    }

    let nextPoint: Location | null = null
    let minScore = Number.POSITIVE_INFINITY

    roads.forEach((road) => {
      road.points.forEach((point) => {
        const key = `${point.lat},${point.lng}`
        if (visited.has(key)) return

        const distToCurrent = Math.sqrt(Math.pow(point.lat - current.lat, 2) + Math.pow(point.lng - current.lng, 2))
        const distToEnd = Math.sqrt(Math.pow(point.lat - endNearest.lat, 2) + Math.pow(point.lng - endNearest.lng, 2))

        if (distToCurrent < 0.001) {
          const score = distToEnd
          if (score < minScore) {
            minScore = score
            nextPoint = point
          }
        }
      })
    })

    if (nextPoint === null) {
      continue
    }

    const confirmedNextPoint: Location = nextPoint
    visited.add(`${confirmedNextPoint.lat},${confirmedNextPoint.lng}`)
    route.push(confirmedNextPoint)
    current = confirmedNextPoint
  }

  route.push(endNearest)
  route.push(end)

  return route
}
