"use client"
import { useEffect, useState } from "react"

export default function Success() {
  const [secondi, setSecondi] = useState(3)

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondi(s => {
        if (s <= 1) {
          clearInterval(timer)
          window.location.href = "/"
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center px-6">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento completato!</h1>
        <p className="text-gray-400 mb-2">Grazie per aver scelto Flowts.</p>
        <p className="text-gray-300 text-sm">Verrai reindirizzato in {secondi} secondi...</p>
      </div>
    </main>
  )
}