"use client"

import { useEffect, useRef } from "react"
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
}

export default function MapComponent({ onMapClick, houses, roads, reception, currentRoad, mode }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Layer[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return

    if (!mapRef.current) {
      const map = L.map("admin-map").setView([0, 0], 13)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map)

      map.on("click", (e: L.LeafletMouseEvent) => {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
      })

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            map.setView([position.coords.latitude, position.coords.longitude], 16)
          },
          () => {
            map.setView([0, 0], 2)
          },
        )
      }

      mapRef.current = map
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    markersRef.current.forEach((marker) => {
      mapRef.current?.removeLayer(marker)
    })
    markersRef.current = []

    if (reception) {
      const receptionIcon = L.divIcon({
        className: "custom-icon",
        html: '<div style="background-color: #1976D2; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white;"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      })

      const marker = L.marker([reception.lat, reception.lng], { icon: receptionIcon })
        .bindPopup("<b>Reception</b>")
        .addTo(mapRef.current)
      markersRef.current.push(marker)
    }

    houses.forEach((house) => {
      const houseIcon = L.divIcon({
        className: "custom-icon",
        html: '<div style="background-color: #2E7D32; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white;"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      })

      const marker = L.marker([house.location.lat, house.location.lng], { icon: houseIcon })
        .bindPopup(`<b>House ${house.number}</b>`)
        .addTo(mapRef.current!)
      markersRef.current.push(marker)
    })

    roads.forEach((road) => {
      const polyline = L.polyline(
        road.points.map((p) => [p.lat, p.lng]),
        { color: "#FF6B6B", weight: 4 },
      ).addTo(mapRef.current!)
      markersRef.current.push(polyline)
    })

    if (currentRoad.length > 0) {
      const polyline = L.polyline(
        currentRoad.map((p) => [p.lat, p.lng]),
        { color: "#FFA500", weight: 4, dashArray: "10, 5" },
      ).addTo(mapRef.current!)
      markersRef.current.push(polyline)

      currentRoad.forEach((point) => {
        const marker = L.circleMarker([point.lat, point.lng], {
          radius: 6,
          color: "#FFA500",
          fillColor: "#FFA500",
          fillOpacity: 1,
        }).addTo(mapRef.current!)
        markersRef.current.push(marker)
      })
    }
  }, [reception, houses, roads, currentRoad])

  return <div id="admin-map" className="w-full h-full" />
}
