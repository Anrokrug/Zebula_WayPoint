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

interface GuestMapComponentProps {
  houses: House[]
  roads: Road[]
  reception: Location
  selectedHouse: House | null
}

function findRoute(start: Location, end: Location, roads: Road[]): Location[] {
  if (roads.length === 0) {
    return [start, end]
  }

  const allPoints: Location[] = []
  roads.forEach((road) => allPoints.push(...road.points))

  const findNearest = (loc: Location, points: Location[]) => {
    let minDist = Number.POSITIVE_INFINITY
    let nearest = points[0]
    points.forEach((p) => {
      const dist = Math.sqrt(Math.pow(p.lat - loc.lat, 2) + Math.pow(p.lng - loc.lng, 2))
      if (dist < minDist) {
        minDist = dist
        nearest = p
      }
    })
    return nearest
  }

  const startNearest = findNearest(start, allPoints)
  const endNearest = findNearest(end, allPoints)

  const route: Location[] = [start, startNearest]

  let current = startNearest
  const visited = new Set<string>()
  visited.add(`${current.lat},${current.lng}`)

  for (let i = 0; i < 50; i++) {
    const distance = Math.sqrt(Math.pow(current.lat - endNearest.lat, 2) + Math.pow(current.lng - endNearest.lng, 2))

    if (distance < 0.0001) break

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

    if (!nextPoint) break

    visited.add(`${nextPoint.lat},${nextPoint.lng}`)
    route.push(nextPoint)
    current = nextPoint
  }

  route.push(endNearest)
  route.push(end)

  return route
}

export default function GuestMapComponent({ houses, roads, reception, selectedHouse }: GuestMapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Layer[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return

    if (!mapRef.current) {
      const map = L.map("guest-map").setView([reception.lat, reception.lng], 15)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [reception])

  useEffect(() => {
    if (!mapRef.current) return

    markersRef.current.forEach((marker) => {
      mapRef.current?.removeLayer(marker)
    })
    markersRef.current = []

    const receptionIcon = L.divIcon({
      className: "custom-icon",
      html: '<div style="background-color: #1976D2; width: 35px; height: 35px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
      iconSize: [35, 35],
      iconAnchor: [17, 35],
    })

    const receptionMarker = L.marker([reception.lat, reception.lng], { icon: receptionIcon })
      .bindPopup("<b>Reception - Start Here</b>")
      .addTo(mapRef.current)
    markersRef.current.push(receptionMarker)

    houses.forEach((house) => {
      const isSelected = selectedHouse?.id === house.id
      const color = isSelected ? "#DC2626" : "#2E7D32"

      const houseIcon = L.divIcon({
        className: "custom-icon",
        html: `<div style="background-color: ${color}; width: ${isSelected ? 40 : 30}px; height: ${isSelected ? 40 : 30}px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [isSelected ? 40 : 30, isSelected ? 40 : 30],
        iconAnchor: [isSelected ? 20 : 15, isSelected ? 40 : 30],
      })

      const marker = L.marker([house.location.lat, house.location.lng], { icon: houseIcon })
        .bindPopup(`<b>House ${house.number}</b>`)
        .addTo(mapRef.current!)
      markersRef.current.push(marker)
    })

    roads.forEach((road) => {
      const polyline = L.polyline(
        road.points.map((p) => [p.lat, p.lng]),
        { color: "#CCCCCC", weight: 3 },
      ).addTo(mapRef.current!)
      markersRef.current.push(polyline)
    })

    if (selectedHouse) {
      const route = findRoute(reception, selectedHouse.location, roads)
      const routeLine = L.polyline(
        route.map((p) => [p.lat, p.lng]),
        { color: "#2E7D32", weight: 6, opacity: 0.8 },
      ).addTo(mapRef.current!)
      markersRef.current.push(routeLine)

      const bounds = L.latLngBounds([
        [reception.lat, reception.lng],
        [selectedHouse.location.lat, selectedHouse.location.lng],
      ])
      mapRef.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [reception, houses, roads, selectedHouse])

  return <div id="guest-map" className="w-full h-full" />
}
