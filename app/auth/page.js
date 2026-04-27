"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Auth() {
  const [modalita, setModalita] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [caricamento, setCaricamento] = useState(false)
  const [messaggio, setMessaggio] = useState(null)
  const [errore, setErrore] = useState(null)

  async function handleSubmit() {
    setCaricamento(true)
    setErrore(null)
    setMessaggio(null)

    if (modalita === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setErrore("Email o password non corretti")
      } else {
        window.location.href = "/"
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setErrore("Errore durante la registrazione. Riprova.")
      } else {
        setMessaggio("Controlla la tua email per confermare la registrazione!")
      }
    }
    setCaricamento(false)
  }

  return (
    <main className="min-h-screen bg-white">
      <nav className="bg-green-700 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/Logo.png" alt="Spendix" className="h-30 w-auto" />
        </div>
        <span className="text-green-200 text-sm">Analisi estratti conto</span>
      </nav>

      <div className="max-w-md mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            {modalita === "login" ? "Bentornato" : "Crea il tuo account"}
          </h1>
          <p className="text-gray-400">
            {modalita === "login"
              ? "Accedi per analizzare i tuoi estratti conto"
              : "Inizia a capire dove vanno i tuoi soldi"}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tua@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          {errore && (
            <p className="text-sm text-red-500 text-center">{errore}</p>
          )}
          {messaggio && (
            <p className="text-sm text-green-600 text-center">{messaggio}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={caricamento || !email || !password}
            className={`w-full py-4 rounded-xl font-semibold text-base transition-all mt-2
              ${caricamento || !email || !password
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-green-700 hover:bg-green-800 text-white cursor-pointer"}`}
          >
            {caricamento
              ? "Attendere..."
              : modalita === "login" ? "Accedi" : "Registrati"}
          </button>

          <p className="text-center text-sm text-gray-400 mt-2">
            {modalita === "login" ? "Non hai un account?" : "Hai già un account?"}
            {" "}
            <button
              onClick={() => { setModalita(modalita === "login" ? "signup" : "login"); setErrore(null) }}
              className="text-green-700 font-semibold hover:underline"
            >
              {modalita === "login" ? "Registrati" : "Accedi"}
            </button>
          </p>
        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          Noi di Spendix ci teniamo alla tua privacy — nessun dato verrà conservato
        </p>
      </div>
    </main>
  )
}