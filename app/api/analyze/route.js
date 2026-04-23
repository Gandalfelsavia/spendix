import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"

const client = new Anthropic()

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
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
              text: `Analizza questo estratto conto bancario e restituisci esattamente un JSON con questa struttura, senza nessun testo aggiuntivo:
{
  "insights": [
    {
      "titolo": "categoria con spesa più alta",
      "importo": "importo in euro",
      "variazione": "variazione percentuale rispetto al mese precedente se disponibile",
      "risparmio": "quanto potrebbe risparmiare all'anno"
    },
    {
      "titolo": "seconda categoria rilevante",
      "importo": "importo in euro",
      "variazione": "variazione percentuale",
      "risparmio": "risparmio annuo stimato"
    },
    {
      "titolo": "terza categoria rilevante",
      "importo": "importo in euro",
      "variazione": "variazione percentuale",
      "risparmio": "risparmio annuo stimato"
    }
  ],
  "totale_speso": "totale spese del periodo",
  "consiglio": "un consiglio pratico e specifico in una frase"
}`,
            },
          ],
        },
      ],
    })

    const testo = message.content[0].text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim()
  const json = JSON.parse(testo)   
    return NextResponse.json(json)

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Errore durante l'analisi" }, { status: 500 })
  }
}