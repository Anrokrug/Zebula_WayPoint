"use client"

import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"

let L: any = null

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

interface MapComponentProps {
  onMapClick: (location: Location) => void
  houses: House[]
  roads: Road[]
  reception: Location | null
  currentRoad: Location[]
  mode: string
  isRecording?: boolean
  onLocationUpdate?: (location: Location) => void
}

export default function MapComponent({
  onMapClick,
  houses,
  roads,
  reception,
  currentRoad,
  mode,
  isRecording = false,
  onLocationUpdate,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const markersRef = useRef<any[]>([])
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [hasUserMoved, setHasUserMoved] = useState(false)
  const previousLocationRef = useRef<Location | null>(null)

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      L = leaflet.default || leaflet
      setLeafletLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapRef.current) return

    try {
      console.log("[v0] Initializing map")
      const map = L.map(mapContainerRef.current).setView([-24.7761, 30.6297], 15)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      console.log("[v0] Map initialized successfully")

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos: Location = { lat: position.coords.latitude, lng: position.coords.longitude }
            map.setView([pos.lat, pos.lng], 18)
            setCurrentLocation(pos)
          },
          () => console.log("[v0] Geolocation failed"),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
        )
      }
    } catch (error) {
      console.error("[v0] Map initialization error:", error)
    }

    return () => {
      if (mapRef.current) {
        console.log("[v0] Cleaning up map")
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [leafletLoaded])

  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return

    console.log("[v0] Updating click handler")
    mapRef.current.off("click")

    mapRef.current.on("click", (e: any) => {
      try {
        console.log("[v0] Map clicked:", e.latlng)
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
      } catch (error) {
        console.error("[v0] Click handler error:", error)
      }
    })
  }, [onMapClick, leafletLoaded])

  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return

    try {
      console.log("[v0] Updating markers")
      markersRef.current.forEach((marker) => {
        try {
          marker.remove()
        } catch (e) {
          console.error("[v0] Error removing marker:", e)
        }
      })
      markersRef.current = []

      if (reception && !hasUserMoved) {
        console.log("[v0] Adding reception marker at:", reception)
        const receptionMarker = L.circleMarker([reception.lat, reception.lng], {
          radius: 12,
          fillColor: "#FF0000",
          color: "#FFFFFF",
          weight: 2,
          opacity: 1,
          fillOpacity: 1,
        })
          .bindPopup("<strong>RECEPTION - CLUBHOUSE</strong><br>Starting Point")
          .addTo(mapRef.current)
          .openPopup()

        markersRef.current.push(receptionMarker)

        // Center on clubhouse only if user hasn't moved
        mapRef.current.setView([reception.lat, reception.lng], 18)
      } else if (reception) {
        // Just add marker without centering if user has moved
        const receptionMarker = L.circleMarker([reception.lat, reception.lng], {
          radius: 12,
          fillColor: "#FF0000",
          color: "#FFFFFF",
          weight: 2,
          opacity: 1,
          fillOpacity: 1,
        })
          .bindPopup("<strong>RECEPTION - CLUBHOUSE</strong><br>Starting Point")
          .addTo(mapRef.current)

        markersRef.current.push(receptionMarker)
      }

      if (currentLocation) {
        const currentMarker = L.circleMarker([currentLocation.lat, currentLocation.lng], {
          radius: 8,
          fillColor: "#4285F4",
          color: "#FFFFFF",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        })
          .bindPopup("Your Location")
          .addTo(mapRef.current)

        markersRef.current.push(currentMarker)
      }

      houses.forEach((house) => {
        const houseMarker = L.circleMarker([house.location.lat, house.location.lng], {
          radius: 10,
          fillColor: "#2E7D32",
          color: "#FFFFFF",
          weight: 2,
          opacity: 1,
          fillOpacity: 1,
        })
          .bindPopup(`House ${house.number}`)
          .addTo(mapRef.current)

        const icon = L.divIcon({
          html: `<div style="color: white; font-size: 10px; font-weight: bold; text-align: center;">${house.number}</div>`,
          className: "",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        const labelMarker = L.marker([house.location.lat, house.location.lng], { icon }).addTo(mapRef.current)

        markersRef.current.push(houseMarker, labelMarker)
      })

      roads.forEach((road) => {
        if (road.points.length > 1) {
          const polyline = L.polyline(
            road.points.map((p: Location) => [p.lat, p.lng]),
            { color: "#FF6B6B", weight: 3 },
          ).addTo(mapRef.current)
          markersRef.current.push(polyline)
        }
      })

      if (currentRoad.length > 0) {
        const currentPolyline = L.polyline(
          currentRoad.map((p) => [p.lat, p.lng]),
          { color: isRecording ? "#00FF00" : "#FFA500", weight: 4, opacity: 0.8 },
        ).addTo(mapRef.current)
        markersRef.current.push(currentPolyline)
      }
    } catch (error) {
      console.error("[v0] Marker rendering error:", error)
    }
  }, [houses, roads, reception, currentRoad, currentLocation, isRecording, leafletLoaded, hasUserMoved])

  useEffect(() => {
    if (!navigator.geolocation || !mapRef.current || !leafletLoaded) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCurrentLocation(newLocation)

        // Check if user has moved significantly (more than 5 meters)
        if (previousLocationRef.current) {
          const distance = Math.sqrt(
            Math.pow((newLocation.lat - previousLocationRef.current.lat) * 111000, 2) +
              Math.pow((newLocation.lng - previousLocationRef.current.lng) * 111000, 2),
          )

          if (distance > 5) {
            setHasUserMoved(true)
          }
        }

        previousLocationRef.current = newLocation

        // Auto-follow user location when they're moving
        if (hasUserMoved && mapRef.current) {
          mapRef.current.setView([newLocation.lat, newLocation.lng], mapRef.current.getZoom())
        }

        if (isRecording && onLocationUpdate) {
          onLocationUpdate(newLocation)
        }
      },
      (error) => {
        console.error("[v0] Geolocation error:", error)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [isRecording, onLocationUpdate, hasUserMoved, leafletLoaded])

  return <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "500px" }} />
}
