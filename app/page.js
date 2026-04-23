"use client"
import { useRef, useState } from "react"

export default function Home() {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)

  function handleFile(e) {
    const selected = e.target.files[0]
    if (selected) setFile(selected)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Scopri dove finiscono i tuoi soldi
        </h1>
        <p className="text-xl text-gray-500 mb-8">
          Carica il tuo estratto conto e in 30 secondi sai tutto.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleFile}
          className="hidden"
        />

        {!file ? (
          <button
            onClick={() => inputRef.current.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-colors"
          >
            Analizza il mio estratto conto →
          </button>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-green-600 font-semibold text-lg mb-1">✓ File caricato</p>
            <p className="text-gray-500 text-sm">{file.name}</p>
            <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
              Avvia analisi →
            </button>
          </div>
        )}

        <p className="text-sm text-gray-400 mt-4">
          Gratis · Nessuna registrazione · 100% privato
        </p>
      </div>
    </main>
  )
}