"use client"

import { useEffect, useRef, useState } from "react"
import { google } from "google-maps"

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
  const mapRef = useRef<google.maps.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const currentLocationMarkerRef = useRef<google.maps.Marker | null>(null)
  const markersRef = useRef<(google.maps.Marker | google.maps.Polyline)[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load Google Maps
  useEffect(() => {
    if (typeof window === "undefined") return

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true)
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`
      script.async = true
      script.defer = true
      script.onload = () => setIsLoaded(true)
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapRef.current) return

    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: -24.0, lng: 29.0 },
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    })

    mapRef.current = map
  }, [isLoaded])

  // Watch position
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
          mapRef.current.panTo(newLocation)
        }
      },
      (error) => {
        console.error("[v0] Geolocation error:", error)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // Update current location marker
  useEffect(() => {
    if (!mapRef.current || !currentLocation) return

    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null)
    }

    const marker = new google.maps.Marker({
      position: currentLocation,
      map: mapRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
      title: "Your Location",
      zIndex: 1000,
    })

    currentLocationMarkerRef.current = marker
  }, [currentLocation])

  // Update markers and route
  useEffect(() => {
    if (!mapRef.current || !reception) return

    // Clear existing
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    // Add roads
    roads.forEach((road) => {
      if (road.points.length > 1) {
        const polyline = new google.maps.Polyline({
          path: road.points,
          strokeColor: "gray",
          strokeWeight: 3,
          map: mapRef.current!,
        })
        markersRef.current.push(polyline)
      }
    })

    // Add reception
    const receptionMarker = new google.maps.Marker({
      position: reception,
      map: mapRef.current,
      title: "RECEPTION",
      label: { text: "R", color: "white", fontSize: "14px", fontWeight: "bold" },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 15,
        fillColor: "blue",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    })
    markersRef.current.push(receptionMarker)

    // Add houses
    houses.forEach((house) => {
      const isSelected = selectedHouse && house.number === selectedHouse.number
      const marker = new google.maps.Marker({
        position: house.location,
        map: mapRef.current!,
        title: `House ${house.number}`,
        label: { text: house.number, color: "white", fontSize: "12px", fontWeight: "bold" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: isSelected ? "green" : "red",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      })
      markersRef.current.push(marker)
    })

    // Draw route if house selected
    if (selectedHouse && reception) {
      const route = findRoute(reception, selectedHouse.location, roads)
      if (route.length > 0) {
        const routeLine = new google.maps.Polyline({
          path: route,
          strokeColor: "green",
          strokeWeight: 5,
          strokeOpacity: 0.7,
          map: mapRef.current!,
        })
        markersRef.current.push(routeLine)

        // Fit bounds to show entire route
        const bounds = new google.maps.LatLngBounds()
        route.forEach((point) => bounds.extend(point))
        mapRef.current!.fitBounds(bounds)
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
