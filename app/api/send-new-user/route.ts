import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      first_name,
      last_name,
      role,
      organization_name,
      phone,
      island,
      city,
    } = body;

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY manquant dans Vercel" },
        { status: 500 }
      );
    }

    const fullName = `${first_name || ""} ${last_name || ""}`.trim();

    const html = `
      <div style="font-family:Arial,sans-serif;padding:24px;color:#222;">
        <h1 style="color:#064b42;">Nouvelle inscription TAUI TE ORA</h1>

        <p><strong>Rôle :</strong> ${role || "Non renseigné"}</p>
        <p><strong>Nom :</strong> ${fullName || "Non renseigné"}</p>
        <p><strong>Email :</strong> ${email || "Non renseigné"}</p>
        <p><strong>Téléphone :</strong> ${phone || "Non renseigné"}</p>
        <p><strong>Île :</strong> ${island || "Non renseignée"}</p>
        <p><strong>Ville :</strong> ${city || "Non renseignée"}</p>
        <p><strong>Organisation :</strong> ${
          organization_name || "Non renseignée"
        }</p>

        <hr style="margin:24px 0;" />

        <p>Un nouvel utilisateur vient de créer un compte sur TAUI TE ORA.</p>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TAUI TE ORA <onboarding@resend.dev>",
        to: ["jonathan.drouillon@gmail.com"],
        subject: `Nouvelle inscription TAUI TE ORA - ${role || "Utilisateur"}`,
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erreur Resend", details: result },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email envoyé",
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}