"use client"
import { useRef, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [stato, setStato] = useState("idle")
  const [risultati, setRisultati] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [utente, setUtente] = useState(null)
  const [controlloAuth, setControlloAuth] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUtente(session?.user ?? null)
      setControlloAuth(false)
      if (!session) window.location.href = "/auth"
    })
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = "/auth"
  }

  function handleFile(e) {
    const selected = e.target.files[0]
    if (selected) setFile(selected)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type === "application/pdf") setFile(dropped)
  }

  async function avviaAnalisi() {
    if (!file) return
    setStato("caricamento")
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.access_token}` },
        body: formData,
      })
      const data = await res.json()
      if (data.error === "limite_raggiunto") {
        setStato("limite")
        return
      }
      if (data.error) { setStato("errore"); return }
      setRisultati(data)
      setStato("risultati")
    } catch {
      setStato("errore")
    }
  }

  function reset() {
    setStato("idle")
    setFile(null)
    setRisultati(null)
  }

  if (controlloAuth) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="bg-green-700 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/Logo.png" alt="Spendix" className="h-30 w-auto" />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-green-200 text-sm hidden sm:block">{utente?.email}</span>
          <button
            onClick={logout}
            className="text-green-200 text-sm hover:text-white transition-colors"
          >
            Esci
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">

        {stato === "idle" && (
          <div>
            <div className="text-center mb-14">
              <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-5 tracking-tight">
                Scopri dove finiscono<br />i tuoi soldi
              </h1>
              <p className="text-xl text-gray-400 max-w-md mx-auto">
                Carica l&apos;estratto conto e in 1 minuto avrai un&apos;analisi completa delle tue spese.
              </p>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !file && inputRef.current.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer mb-4
                ${dragOver ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-300 hover:bg-green-50"}
                ${file ? "cursor-default" : ""}`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                onChange={handleFile}
                className="hidden"
              />

              {!file ? (
                <div>
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium mb-1">Trascina il PDF qui</p>
                  <p className="text-gray-400 text-sm">oppure clicca per selezionare il file</p>
                  <p className="text-gray-400 text-sm mt-2">Per una miglior riuscita del calcolo non inserire file di grandi dimensioni o con archi temporali troppo lunghi (Esempio oltre 3 mesi o oltre 15 pagine di Estratto conto)</p>
                </div>
              ) : (
                <div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-medium mb-1">{file.name}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
                  >
                    Rimuovi
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={avviaAnalisi}
              disabled={!file}
              className={`w-full py-4 rounded-xl font-semibold text-base transition-all
                ${file
                  ? "bg-green-700 hover:bg-green-800 text-white cursor-pointer"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
            >
              Avvia analisi →
            </button>

            <div className="flex items-center justify-center gap-2 mt-8 mb-4">
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-sm text-gray-400">Noi di Spendix ci teniamo alla tua privacy — nessun dato verrà conservato</p>
            </div>

            <div className="flex items-center justify-center gap-6">
              {["Nessun Salvataggio", "Niente categorie manuali", "100% privato"].map((f) => (
                <div key={f} className="flex items-center gap-1.5 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {stato === "caricamento" && (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin mx-auto mb-8" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Sto analizzando...</h2>
            <p className="text-gray-400">Identifico le categorie di spesa e calcolo i tuoi insight</p>
            <p className="text-gray-300 text-sm mt-3">L&apos;analisi può richiedere fino a un minuto, attendi senza chiudere la pagina</p>
          </div>
        )}

        {stato === "errore" && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Qualcosa è andato storto</h2>
            <p className="text-gray-400 mb-6">Assicurati che il file sia un estratto conto in PDF valido.</p>
            <button onClick={reset} className="bg-green-700 text-white py-3 px-8 rounded-xl font-medium hover:bg-green-800 transition-colors">
              Riprova
            </button>
          </div>
        )}

        {stato === "limite" && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Hai esaurito le analisi gratuite</h2>
            <p className="text-gray-400 mb-8">Passa al piano Pro per continuare ad analizzare i tuoi estratti conto</p>
            <div className="flex flex-col gap-4 max-w-sm mx-auto">
              <div className="border border-green-200 bg-green-50 rounded-2xl p-6 text-left">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-2">Piano Pro</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">€5.99<span className="text-base font-normal text-gray-400">/mese</span></p>
                <p className="text-sm text-gray-500 mb-4">Fino a 10 analisi al mese · Disdici quando vuoi</p>
                <button className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors">
                  Abbonati ora →
                </button>
              </div>
              <div className="border border-gray-200 rounded-2xl p-6 text-left">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Analisi singola</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">€2.99</p>
                <p className="text-sm text-gray-500 mb-4">Una analisi · Nessun abbonamento</p>
                <button className="w-full border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-colors">
                  Acquista →
                </button>
              </div>
            </div>
            <button onClick={reset} className="text-gray-400 text-sm mt-6 hover:text-gray-600 transition-colors">
              Torna alla home
            </button>
          </div>
        )}

        {stato === "risultati" && risultati && (
          <div>
            <div className="mb-10">
              <p className="text-sm text-gray-400 mb-1">{risultati.periodo}</p>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Il tuo bilancio</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Entrate</p>
                <p className="text-xl font-bold text-gray-900">{risultati.entrate?.totale}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Uscite</p>
                <p className="text-xl font-bold text-gray-900">{risultati.uscite?.totale}</p>
              </div>
              <div className={`rounded-2xl p-5 ${risultati.bilancio?.stato === "positivo" ? "bg-green-50" : "bg-red-50"}`}>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Bilancio</p>
                <p className={`text-xl font-bold ${risultati.bilancio?.stato === "positivo" ? "text-green-700" : "text-red-600"}`}>
                  {risultati.bilancio?.importo}
                </p>
              </div>
            </div>

            <div className="mb-10">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Le 3 spese principali</h3>
              <div className="flex flex-col gap-3">
                {risultati.top3?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-green-600 bg-green-50 w-6 h-6 rounded-full flex items-center justify-center">{i + 1}</span>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{item.categoria}</p>
                        <p className="text-gray-800 font-medium text-sm">{item.messaggio}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900 ml-4 shrink-0">{item.importo}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-10">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Tutte le categorie</h3>
              <div className="bg-gray-50 rounded-2xl overflow-hidden">
                {risultati.uscite?.categorie?.map((cat, i) => (
                  <div key={i} className={`flex items-center gap-4 px-5 py-3.5 ${i !== 0 ? "border-t border-gray-100" : ""}`}>
                    <span className="text-sm text-gray-700 w-48 shrink-0">{cat.nome}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-1">
                      <div className="bg-green-600 h-1 rounded-full transition-all" style={{ width: cat.percentuale }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-20 text-right shrink-0">{cat.importo}</span>
                    <span className="text-xs text-gray-400 w-8 text-right shrink-0">{cat.percentuale}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-green-100 bg-green-50 rounded-2xl p-6 mb-6">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-2">In evidenza</p>
              <p className="text-gray-700 leading-relaxed">{risultati.evidenza}</p>
              <p className="text-sm text-gray-400 mt-3">{risultati.bilancio?.messaggio}</p>
            </div>

            <p className="text-xs text-gray-400 text-center mb-6">
              Spendix mostra i tuoi dati di spesa in modo chiaro. Non fornisce consulenza finanziaria, fiscale o di investimento.
            </p>

            <button
              onClick={reset}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Analizza un altro estratto conto
            </button>
          </div>
        )}

      </div>
    </main>
  )
}