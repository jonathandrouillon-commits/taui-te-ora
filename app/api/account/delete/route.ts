import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type DeleteAccountBody = {
  confirmation?: string;
};

const PROTECTED_ROLES = [
  "admin",
  "administrateur",
  "association",
  "refuge",
  "fourriere",
];

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      console.error(
        "[DELETE ACCOUNT] Configuration Supabase serveur incomplete."
      );

      return NextResponse.json(
        {
          error:
            "La suppression du compte est temporairement indisponible.",
        },
        { status: 500 }
      );
    }

    /*
    ============================================================
    1. CONFIRMATION
    ============================================================
    */

    let body: DeleteAccountBody;

    try {
      body = (await request.json()) as DeleteAccountBody;
    } catch {
      return NextResponse.json(
        {
          error: "Requete invalide.",
        },
        { status: 400 }
      );
    }

    if (body.confirmation !== "SUPPRIMER") {
      return NextResponse.json(
        {
          error:
            "La confirmation de suppression est incorrecte.",
        },
        { status: 400 }
      );
    }

    /*
    ============================================================
    2. TOKEN UTILISATEUR
    ============================================================
    */

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error:
            "Vous devez etre connecte pour supprimer votre compte.",
        },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice("Bearer ".length).trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Session utilisateur invalide.",
        },
        { status: 401 }
      );
    }

    /*
    ============================================================
    3. CLIENT UTILISATEUR
    ============================================================
    */

    const userSupabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    /*
    ============================================================
    4. VERIFICATION DU COMPTE CONNECTE
    ============================================================
    */

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(accessToken);

    if (userError || !user) {
      console.error(
        "[DELETE ACCOUNT] Verification utilisateur impossible.",
        userError
      );

      return NextResponse.json(
        {
          error:
            "Votre session a expire. Reconnectez-vous avant de supprimer votre compte.",
        },
        { status: 401 }
      );
    }

    const userId = user.id;

    /*
    ============================================================
    5. SERVICE ROLE
    ============================================================
    */

    const adminSupabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    /*
    ============================================================
    6. LECTURE SECURISEE DU ROLE

    On utilise le client serveur Service Role.

    Cela evite qu'une politique RLS ou une modification cote
    navigateur puisse contourner la protection.
    ============================================================
    */

    const { data: profile, error: profileError } =
      await adminSupabase
        .from("profiles")
        .select("id, role")
        .eq("id", userId)
        .maybeSingle();

    if (profileError) {
      console.error(
        "[DELETE ACCOUNT] Lecture profil impossible.",
        profileError
      );

      return NextResponse.json(
        {
          error:
            "Impossible de verifier votre profil avant la suppression.",
        },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "Le profil associe a ce compte est introuvable.",
        },
        { status: 404 }
      );
    }

    const normalizedRole = String(profile.role || "")
      .trim()
      .toLowerCase();

    /*
    ============================================================
    7. PROTECTION DES COMPTES SENSIBLES
    ============================================================

    ADMIN
    -----
    Pas de suppression automatique.

    ASSOCIATION / REFUGE / FOURRIERE
    --------------------------------
    Ces comptes peuvent etre proprietaires d'une structure,
    d'animaux, de demandes, de conditions d'adoption, etc.

    Ils devront disposer plus tard d'une procedure specifique :
    - transfert de la structure ;
    - nomination d'un nouveau responsable ;
    - ou fermeture volontaire de la structure.

    On ne supprime donc JAMAIS automatiquement leur structure.
    ============================================================
    */

    if (PROTECTED_ROLES.includes(normalizedRole)) {
      const isStructure = [
        "association",
        "refuge",
        "fourriere",
      ].includes(normalizedRole);

      return NextResponse.json(
        {
          error: isStructure
            ? "Ce compte est lie a une structure. La suppression automatique est bloquee afin de proteger les animaux et les donnees de la structure."
            : "Un compte administrateur ne peut pas etre supprime depuis cette interface.",
          protectedAccount: true,
          role: normalizedRole,
        },
        { status: 403 }
      );
    }

    /*
    ============================================================
    8. NETTOYAGE DES DONNEES
    ============================================================
    */

    const { error: cleanupError } = await adminSupabase.rpc(
      "delete_account_public_data",
      {
        p_user_id: userId,
      }
    );

    if (cleanupError) {
      console.error(
        "[DELETE ACCOUNT] Echec nettoyage donnees.",
        cleanupError
      );

      return NextResponse.json(
        {
          error:
            "La suppression n'a pas pu etre terminee. Votre compte de connexion n'a pas ete supprime.",
        },
        { status: 500 }
      );
    }

    /*
    ============================================================
    9. SUPPRESSION SUPABASE AUTH
    ============================================================
    */

    const { error: deleteAuthError } =
      await adminSupabase.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error(
        "[DELETE ACCOUNT] Suppression Auth impossible.",
        deleteAuthError
      );

      return NextResponse.json(
        {
          error:
            "Vos donnees ont ete nettoyees, mais la suppression du compte de connexion n'a pas pu etre finalisee. Contactez l'administrateur.",
          partial: true,
        },
        { status: 500 }
      );
    }

    /*
    ============================================================
    10. SUCCES
    ============================================================
    */

    return NextResponse.json(
      {
        success: true,
        message: "Votre compte a ete supprime.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[DELETE ACCOUNT] Erreur serveur inattendue.",
      error
    );

    return NextResponse.json(
      {
        error:
          "Une erreur inattendue est survenue pendant la suppression du compte.",
      },
      { status: 500 }
    );
  }
}