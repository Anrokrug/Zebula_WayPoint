"use client"

import Link from "next/link"
import { Home, UserCog, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Home className="mx-auto h-16 w-16 text-green-700" />
          <h1 className="mt-6 text-4xl font-bold text-green-900">Zebula Golf Estate And Spa</h1>
          <p className="mt-2 text-lg text-green-700">Property Navigation</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/admin"
            className="flex flex-col items-center gap-3 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 shadow-lg transition-all transform hover:scale-105"
          >
            <UserCog className="h-12 w-12" />
            <div className="text-center">
              <h2 className="text-2xl font-bold">ADMIN MODE</h2>
              <p className="text-sm text-blue-100 mt-1">Set up roads, houses, and reception</p>
            </div>
          </Link>

          <Link
            href="/guest"
            className="flex flex-col items-center gap-3 w-full bg-green-600 hover:bg-green-700 text-white rounded-xl p-6 shadow-lg transition-all transform hover:scale-105"
          >
            <Users className="h-12 w-12" />
            <div className="text-center">
              <h2 className="text-2xl font-bold">GUEST MODE</h2>
              <p className="text-sm text-green-100 mt-1">Find your way to your house</p>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            Welcome to our estate! Select Guest Mode to navigate to your accommodation.
          </p>
        </div>

        <div className="text-center pt-4">
          <p className="text-xs text-gray-500">
            Developed by <span className="font-semibold text-gray-700">Anro Kruger</span>
          </p>
        </div>
      </div>
    </div>
  )
}
