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
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current).setView([-24.0, 29.0], 15)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
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
          mapRef.current.panTo([newLocation.lat, newLocation.lng])
        }
      },
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  const route = selectedHouse && reception ? findRoute(reception, selectedHouse.location, roads) : []

  useEffect(() => {
    if (route.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(route.map((p) => [p.lat, p.lng]))
      mapRef.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [route])

  useEffect(() => {
    if (!mapRef.current) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

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

    roads.forEach((road) => {
      if (road.points.length > 1) {
        const polyline = L.polyline(
          road.points.map((p) => [p.lat, p.lng]),
          { color: "gray", weight: 3 },
        ).addTo(mapRef.current!)
        markersRef.current.push(polyline as any)
      }
    })

    if (reception) {
      const receptionMarker = L.circleMarker([reception.lat, reception.lng], {
        radius: 10,
        fillColor: "#FF0000",
        color: "#FFFFFF",
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      })
        .bindPopup("RECEPTION - CLUBHOUSE")
        .addTo(mapRef.current)

      markersRef.current.push(receptionMarker)
    }

    houses.forEach((house) => {
      const isSelected = selectedHouse && house.number === selectedHouse.number
      const houseMarker = L.circleMarker([house.location.lat, house.location.lng], {
        radius: 10,
        fillColor: isSelected ? "#2E7D32" : "#FF0000",
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

    if (route.length > 0) {
      const routePolyline = L.polyline(
        route.map((p) => [p.lat, p.lng]),
        { color: "green", weight: 5, opacity: 0.7 },
      ).addTo(mapRef.current!)
      markersRef.current.push(routePolyline as any)
    }
  }, [houses, roads, reception, selectedHouse, currentLocation, route])

  return <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "500px" }} />
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
