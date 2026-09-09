import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type DeleteAccountBody = {
  confirmation?: string;
};

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
    1. VERIFICATION DE LA CONFIRMATION
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
    2. RECUPERATION DU TOKEN DE L'UTILISATEUR
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
    3. CLIENT SUPABASE UTILISATEUR
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
    4. VERIFICATION REELLE DE L'UTILISATEUR CONNECTE
    ============================================================
    */

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(accessToken);

    if (userError || !user) {
      console.error(
        "[DELETE ACCOUNT] Impossible de verifier l'utilisateur.",
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
    5. PROTECTION DES COMPTES ADMINISTRATEURS
    ============================================================

    Pour la premiere version, un administrateur ne peut pas
    supprimer son propre compte depuis l'interface publique.

    Cela evite une suppression accidentelle du compte principal
    d'administration de Taui Te Ora.
    ============================================================
    */

    const { data: profile, error: profileError } =
      await userSupabase
        .from("profiles")
        .select("id, role")
        .eq("id", userId)
        .maybeSingle();

    if (profileError) {
      console.error(
        "[DELETE ACCOUNT] Impossible de lire le profil.",
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

    if (
      profile?.role === "admin" ||
      profile?.role === "administrateur"
    ) {
      return NextResponse.json(
        {
          error:
            "Un compte administrateur ne peut pas etre supprime depuis cette interface.",
        },
        { status: 403 }
      );
    }

    /*
    ============================================================
    6. CLIENT SUPABASE SERVICE ROLE

    IMPORTANT :
    Ce client existe UNIQUEMENT sur le serveur.

    SUPABASE_SERVICE_ROLE_KEY ne doit jamais etre exposee
    dans un composant client ou avec NEXT_PUBLIC_.
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
    7. NETTOYAGE / ANONYMISATION DES DONNEES PUBLIQUES

    Cette fonction SQL a ete installee dans Supabase :
    public.delete_account_public_data(uuid)

    Elle n'est executable que par service_role.
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
        "[DELETE ACCOUNT] Echec du nettoyage des donnees.",
        cleanupError
      );

      return NextResponse.json(
        {
          error:
            "La suppression n'a pas pu etre terminee. Votre compte d'authentification n'a pas ete supprime.",
        },
        { status: 500 }
      );
    }

    /*
    ============================================================
    8. SUPPRESSION DU COMPTE SUPABASE AUTH

    Cette etape est volontairement executee APRES le nettoyage
    des donnees publiques.

    Si le nettoyage echoue, le compte Auth reste intact.
    ============================================================
    */

    const { error: deleteAuthError } =
      await adminSupabase.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error(
        "[DELETE ACCOUNT] Donnees nettoyees mais suppression Auth impossible.",
        deleteAuthError
      );

      /*
      IMPORTANT :
      A ce stade, les donnees publiques ont deja ete nettoyees.

      On renvoie donc une erreur specifique afin de ne jamais
      annoncer a tort que tout a ete supprime.
      */

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
    9. SUCCES
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