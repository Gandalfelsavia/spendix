"use client"
import { useRef, useState } from "react"

export default function Home() {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [stato, setStato] = useState("idle") // idle | caricamento | risultati | errore
  const [risultati, setRisultati] = useState(null)

  function handleFile(e) {
    const selected = e.target.files[0]
    if (selected) setFile(selected)
  }

  async function avviaAnalisi() {
    if (!file) return
    setStato("caricamento")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (data.error) {
        setStato("errore")
        return
      }

      setRisultati(data)
      setStato("risultati")

    } catch (err) {
      setStato("errore")
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full text-center">

        {stato === "idle" && (
          <>
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
                <button
                  onClick={avviaAnalisi}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Avvia analisi →
                </button>
              </div>
            )}
            <p className="text-sm text-gray-400 mt-4">
              Gratis · Nessuna registrazione · 100% privato
            </p>
          </>
        )}

        {stato === "caricamento" && (
          <div className="text-center">
            <div className="text-5xl mb-6">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sto analizzando...</h2>
            <p className="text-gray-500">Cerco dove stanno andando i tuoi soldi</p>
          </div>
        )}

        {stato === "errore" && (
          <div className="text-center">
            <p className="text-red-500 font-semibold mb-4">Qualcosa è andato storto. Riprova.</p>
            <button
              onClick={() => { setStato("idle"); setFile(null) }}
              className="bg-blue-600 text-white py-3 px-6 rounded-xl"
            >
              Riprova
            </button>
          </div>
        )}

        {stato === "risultati" && risultati && (
          <div className="text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Ecco dove vanno i tuoi soldi
            </h2>
            <p className="text-gray-500 text-center mb-6">
              Totale speso: <span className="font-semibold text-gray-900">{risultati.totale_speso}</span>
            </p>

            <div className="flex flex-col gap-4 mb-6">
              {risultati.insights.map((insight, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="text-gray-500 text-sm mb-1">{insight.titolo}</p>
                  <p className="text-2xl font-bold text-gray-900">{insight.importo}</p>
                  {insight.variazione && (
                    <p className="text-sm text-orange-500 mt-1">{insight.variazione}</p>
                  )}
                  {insight.risparmio && (
                    <p className="text-sm text-green-600 mt-1">💡 Potresti risparmiare {insight.risparmio}/anno</p>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
              <p className="text-sm text-blue-600 font-semibold mb-1">Consiglio</p>
              <p className="text-gray-700">{risultati.consiglio}</p>
            </div>

            <button
              onClick={() => { setStato("idle"); setFile(null); setRisultati(null) }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Analizza un altro estratto conto
            </button>
          </div>
        )}

      </div>
    </main>
  )
}