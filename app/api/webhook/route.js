import Stripe from "stripe"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const config = {
  api: {
    bodyParser: false,
  },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    console.error("Nessuna firma Stripe")
    return NextResponse.json({ error: "Nessuna firma" }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    console.error("Webhook signature error:", error.message)
    return NextResponse.json({ error: "Firma non valida: " + error.message }, { status: 400 })
  }

  console.log("Webhook ricevuto:", event.type)

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object
        const userId = session.metadata?.user_id
        const tipo = session.metadata?.tipo

        console.log("Checkout completato:", { userId, tipo })

        if (!userId) {
          console.error("userId mancante nei metadata")
          break
        }

        if (tipo === "singola") {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              analisi_questo_mese: 0,
              piano: "singola"
            })
            .eq("id", userId)
          if (error) console.error("Errore update singola:", error)
          else console.log("Piano singola aggiornato per:", userId)
        }

        if (tipo === "pro") {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              piano: "pro",
              analisi_questo_mese: 0
            })
            .eq("id", userId)
          if (error) console.error("Errore update pro:", error)
          else console.log("Piano pro aggiornato per:", userId)
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object
        if (!invoice.customer_email) break

        const { data: profili, error } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", invoice.customer_email)

        if (error || !profili || profili.length === 0) {
          console.error("Profilo non trovato per:", invoice.customer_email)
          break
        }

        await supabaseAdmin
          .from("profiles")
          .update({ piano: "pro", analisi_questo_mese: 0 })
          .eq("id", profili[0].id)

        console.log("Rinnovo pro per:", invoice.customer_email)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object
        const customer = await stripe.customers.retrieve(subscription.customer)

        if (!customer.email) break

        const { data: profili } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", customer.email)

        if (profili && profili.length > 0) {
          await supabaseAdmin
            .from("profiles")
            .update({ piano: "free" })
            .eq("id", profili[0].id)
          console.log("Piano tornato free per:", customer.email)
        }
        break
      }

      default:
        console.log("Evento non gestito:", event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Errore webhook" }, { status: 500 })
  }
}