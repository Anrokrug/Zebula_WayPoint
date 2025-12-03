"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

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
  const mapRef = useRef<L.Map | null>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    try {
      const map = L.map(mapContainerRef.current).setView([-24.7761, 30.6297], 15)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map)

      map.on("click", (e: L.LeafletMouseEvent) => {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
      })

      mapRef.current = map

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos: Location = { lat: position.coords.latitude, lng: position.coords.longitude }
            map.setView([pos.lat, pos.lng], 18)
            setCurrentLocation(pos)
          },
          () => console.log("Geolocation failed"),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
        )
      }

      return () => {
        map.remove()
        mapRef.current = null
      }
    } catch (error) {
      console.error("[v0] Map initialization error:", error)
    }
  }, []) // Empty dependency array - initialize once

  useEffect(() => {
    if (!mapRef.current) return

    // Remove old click handler
    mapRef.current.off("click")

    // Add new click handler with updated reference
    mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
      try {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
      } catch (error) {
        console.error("[v0] Click handler error:", error)
      }
    })
  }, [onMapClick])

  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCurrentLocation(newLocation)

        if (isRecording && onLocationUpdate) {
          onLocationUpdate(newLocation)
        }

        if (isRecording && mapRef.current) {
          mapRef.current.panTo([newLocation.lat, newLocation.lng])
        }
      },
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    )

    watchIdRef.current = watchId

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [isRecording, onLocationUpdate])

  useEffect(() => {
    if (!mapRef.current) return

    try {
      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      if (reception) {
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
        mapRef.current.setView([reception.lat, reception.lng], 18)
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
          .addTo(mapRef.current!)

        const icon = L.divIcon({
          html: `<div style="color: white; font-size: 10px; font-weight: bold; text-align: center;">${house.number}</div>`,
          className: "",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        const labelMarker = L.marker([house.location.lat, house.location.lng], { icon }).addTo(mapRef.current!)

        markersRef.current.push(houseMarker, labelMarker)
      })

      roads.forEach((road) => {
        if (road.points.length > 1) {
          const polyline = L.polyline(
            road.points.map((p) => [p.lat, p.lng]),
            { color: "#FF6B6B", weight: 3 },
          ).addTo(mapRef.current!)
          markersRef.current.push(polyline as any)
        }
      })

      if (currentRoad.length > 0) {
        const currentPolyline = L.polyline(
          currentRoad.map((p) => [p.lat, p.lng]),
          { color: isRecording ? "#00FF00" : "#FFA500", weight: 4, opacity: 0.8 },
        ).addTo(mapRef.current!)
        markersRef.current.push(currentPolyline as any)
      }
    } catch (error) {
      console.error("[v0] Marker rendering error:", error)
    }
  }, [houses, roads, reception, currentRoad, currentLocation, isRecording])

  return <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "500px" }} />
}
