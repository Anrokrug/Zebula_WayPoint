"use client"

import { useEffect, useRef, useState } from "react"
import { GoogleMap, LoadScript, Marker, Polyline } from "@react-google-maps/api"

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
  const mapRef = useRef<any | null>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)

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
        console.error("Geolocation error:", error)
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

  const route = selectedHouse && reception ? findRoute(reception, selectedHouse.location, roads) : []

  useEffect(() => {
    if (route.length > 0 && mapRef.current) {
      const bounds = {
        north: Math.max(...route.map((p) => p.lat)),
        south: Math.min(...route.map((p) => p.lat)),
        east: Math.max(...route.map((p) => p.lng)),
        west: Math.min(...route.map((p) => p.lng)),
      }
      mapRef.current.fitBounds(bounds)
    }
  }, [route])

  const mapCenter = currentLocation || reception || { lat: -24.0, lng: 29.0 }

  return (
    <LoadScript googleMapsApiKey="AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%", minHeight: "400px" }}
        center={mapCenter}
        zoom={15}
        onLoad={(map) => {
          mapRef.current = map
        }}
        options={{
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            position={currentLocation}
            icon={{
              path: "M 0,0 m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0",
              scale: 1.5,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            }}
            title="Your Location"
            zIndex={1000}
          />
        )}

        {/* Roads */}
        {roads.map((road, index) =>
          road.points.length > 1 ? (
            <Polyline
              key={index}
              path={road.points}
              options={{
                strokeColor: "gray",
                strokeWeight: 3,
              }}
            />
          ) : null,
        )}

        {/* Reception Marker */}
        {reception && (
          <Marker
            position={reception}
            icon={{
              path: "M 0,0 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0",
              scale: 1,
              fillColor: "blue",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            }}
            label={{
              text: "R",
              color: "white",
              fontSize: "14px",
              fontWeight: "bold",
            }}
            title="RECEPTION"
          />
        )}

        {/* House Markers */}
        {houses.map((house, index) => {
          const isSelected = selectedHouse && house.number === selectedHouse.number
          return (
            <Marker
              key={index}
              position={house.location}
              icon={{
                path: "M 0,0 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0",
                scale: 1,
                fillColor: isSelected ? "green" : "red",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              }}
              label={{
                text: house.number,
                color: "white",
                fontSize: "12px",
                fontWeight: "bold",
              }}
              title={`House ${house.number}`}
            />
          )
        })}

        {/* Navigation Route */}
        {route.length > 0 && (
          <Polyline
            path={route}
            options={{
              strokeColor: "green",
              strokeWeight: 5,
              strokeOpacity: 0.7,
            }}
          />
        )}
      </GoogleMap>
    </LoadScript>
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
