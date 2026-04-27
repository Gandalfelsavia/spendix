import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const maxDuration = 120

const client = new Anthropic()

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    // Verifica sessione utente
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    // Controlla profilo e limite analisi
    const meseCorrente = new Date().toISOString().slice(0, 7) // es. "2025-01"

    let { data: profilo } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    // Reset contatore se è un nuovo mese
    if (profilo.mese_corrente !== meseCorrente) {
      await supabaseAdmin
        .from("profiles")
        .update({ analisi_questo_mese: 0, mese_corrente: meseCorrente })
        .eq("id", user.id)
      profilo.analisi_questo_mese = 0
    }

    // Controlla limite
    const limiteAnalisi = profilo.piano === "pro" ? 10 : 1
    if (profilo.analisi_questo_mese >= limiteAnalisi) {
      return NextResponse.json({
        error: "limite_raggiunto",
        piano: profilo.piano,
        analisi_fatte: profilo.analisi_questo_mese,
        limite: limiteAnalisi
      }, { status: 403 })
    }

    // Procedi con l'analisi
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: `Analizza questo estratto conto bancario italiano.
Restituisci SOLO un JSON valido, senza backtick, senza testo aggiuntivo.
Somma tu stesso i totali per categoria leggendo ogni singola transazione.

{
  "periodo": "mese e anno es. Gennaio 2025",
  "totale_entrate": 0.00,
  "totale_uscite": 0.00,
  "voci_entrate": [
    { "descrizione": "es. Stipendio", "importo": 0.00 }
  ],
  "categorie_uscite": [
    { "nome": "Spesa alimentare", "importo": 0.00 },
    { "nome": "Ristoranti e bar", "importo": 0.00 },
    { "nome": "Benzina e trasporti", "importo": 0.00 },
    { "nome": "Mutuo affitto e finanziamenti", "importo": 0.00 },
    { "nome": "Costi bancari", "importo": 0.00 },
    { "nome": "Utenze e abbonamenti", "importo": 0.00 },
    { "nome": "Salute e farmacia", "importo": 0.00 },
    { "nome": "Shopping", "importo": 0.00 },
    { "nome": "Altro", "importo": 0.00 }
  ]
}

Regole:
- tutti gli importi sono numeri decimali positivi senza simbolo euro
- includi TUTTE le categorie anche se con importo 0
- somma accuratamente ogni transazione nella categoria corretta`,
            },
          ],
        },
      ],
    })

    const testoGrezzo = message.content[0].text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    const inizio = testoGrezzo.indexOf("{")
    const fine = testoGrezzo.lastIndexOf("}")
    const testo = testoGrezzo.substring(inizio, fine + 1)

    const dati = JSON.parse(testo)

    const totaleUscite = Math.round(
      dati.categorie_uscite.reduce((sum, c) => sum + c.importo, 0) * 100
    ) / 100

    const totaleEntrate = Math.round(dati.totale_entrate * 100) / 100
    const bilancio = Math.round((totaleEntrate - totaleUscite) * 100) / 100

    const categorieOrdinate = [...dati.categorie_uscite]
      .sort((a, b) => b.importo - a.importo)

    const top3 = categorieOrdinate
      .filter(c => c.importo > 0)
      .slice(0, 3)
      .map(cat => ({
        categoria: cat.nome,
        importo: formatEuro(cat.importo),
        messaggio: `Hai speso ${formatEuro(cat.importo)} in ${cat.nome.toLowerCase()}`
      }))

    const risultato = {
      periodo: dati.periodo,
      entrate: {
        totale: formatEuro(totaleEntrate),
        voci: dati.voci_entrate.map(v => ({
          descrizione: v.descrizione,
          importo: formatEuro(v.importo)
        }))
      },
      uscite: {
        totale: formatEuro(totaleUscite),
        categorie: categorieOrdinate.map(cat => ({
          nome: cat.nome,
          importo: formatEuro(cat.importo),
          percentuale: totaleUscite > 0
            ? Math.round((cat.importo / totaleUscite) * 100) + "%"
            : "0%"
        }))
      },
      top3,
      bilancio: {
        importo: formatEuro(Math.abs(bilancio)),
        stato: bilancio >= 0 ? "positivo" : "negativo",
        messaggio: bilancio >= 0
          ? `Hai risparmiato ${formatEuro(bilancio)} questo mese`
          : `Hai speso ${formatEuro(Math.abs(bilancio))} più di quanto hai guadagnato`
      },
      evidenza: categorieOrdinate[0]?.importo > 0
        ? `La spesa principale è ${categorieOrdinate[0].nome.toLowerCase()} con ${formatEuro(categorieOrdinate[0].importo)}`
        : ""
    }

    // Aggiorna contatore analisi
    await supabaseAdmin
      .from("profiles")
      .update({
        analisi_questo_mese: profilo.analisi_questo_mese + 1,
        mese_corrente: meseCorrente
      })
      .eq("id", user.id)

    // Salva record analisi
    await supabaseAdmin
      .from("analisi")
      .insert({ user_id: user.id, periodo: dati.periodo })

    return NextResponse.json(risultato)

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Errore durante l'analisi" }, { status: 500 })
  }
}

function formatEuro(importo) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(importo)
}