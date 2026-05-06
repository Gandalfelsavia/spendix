import Stripe from "stripe"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    console.error("Webhook signature error:", error)
    return NextResponse.json({ error: "Webhook non valido" }, { status: 400 })
  }

  try {
    switch (event.type) {

      // Pagamento singolo completato
      case "checkout.session.completed": {
        const session = event.data.object
        const userId = session.metadata?.user_id
        const tipo = session.metadata?.tipo

        if (!userId) break

        if (tipo === "singola") {
          // Aggiunge 1 analisi disponibile
          const { data: profilo } = await supabaseAdmin
            .from("profiles")
            .select("analisi_questo_mese")
            .eq("id", userId)
            .single()

          await supabaseAdmin
            .from("profiles")
            .update({
              analisi_questo_mese: Math.max(0, (profilo?.analisi_questo_mese || 1) - 1)
            })
            .eq("id", userId)
        }

        if (tipo === "pro") {
          await supabaseAdmin
            .from("profiles")
            .update({ piano: "pro" })
            .eq("id", userId)
        }
        break
      }

      // Abbonamento pro rinnovato
      case "invoice.payment_succeeded": {
        const invoice = event.data.object
        const customerId = invoice.customer

        const customers = await stripe.customers.list({ email: invoice.customer_email })
        if (customers.data.length === 0) break

        const { data: profili } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", invoice.customer_email)

        if (profili && profili.length > 0) {
          await supabaseAdmin
            .from("profiles")
            .update({
              piano: "pro",
              analisi_questo_mese: 0
            })
            .eq("id", profili[0].id)
        }
        break
      }

      // Abbonamento cancellato
      case "customer.subscription.deleted": {
        const subscription = event.data.object
        const customer = await stripe.customers.retrieve(subscription.customer)

        const { data: profili } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", customer.email)

        if (profili && profili.length > 0) {
          await supabaseAdmin
            .from("profiles")
            .update({ piano: "free" })
            .eq("id", profili[0].id)
        }
        break
      }
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Errore webhook" }, { status: 500 })
  }
}