$ErrorActionPreference = "Stop"

$path = Join-Path $PSScriptRoot "app\admin\signalements\page.tsx"

if (-not (Test-Path -LiteralPath $path)) {
    throw "Fichier introuvable : $path"
}

$utf8 = New-Object System.Text.UTF8Encoding($false)

$original = [System.IO.File]::ReadAllText(
    $path,
    [System.Text.Encoding]::UTF8
)

$text = $original

$backup = Join-Path $env:TEMP (
    "taui-admin-signalements-" +
    (Get-Date -Format "yyyyMMdd-HHmmss") +
    ".tsx"
)

[System.IO.File]::WriteAllText(
    $backup,
    $original,
    $utf8
)

function Replace-RegexRequired {
    param(
        [string]$Source,
        [string]$Pattern,
        [string]$Replacement,
        [string]$Label
    )

    $regex = New-Object System.Text.RegularExpressions.Regex(
        $Pattern,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    $matches = $regex.Matches($Source)

    if ($matches.Count -eq 0) {
        throw "Bloc introuvable : $Label"
    }

    return $regex.Replace(
        $Source,
        $Replacement,
        1
    )
}

# ============================================================
# IMPORTS
# ============================================================

$text = Replace-RegexRequired `
    $text `
    '(\bArrowLeft,\s*)' `
    "Archive,`r`n  `$1" `
    "Import Archive"

$text = Replace-RegexRequired `
    $text `
    '(\bSearch,\s*)' `
    "`$1Trash2,`r`n  " `
    "Import Trash2"

# ============================================================
# TYPE STATUS
# ============================================================

$text = Replace-RegexRequired `
    $text `
    '\|\s*"cloture"\s*;' `
    '| "cloture"`r`n  | "archive";' `
    "Type archive"

# ============================================================
# OPTION ARCHIVE
# ============================================================

$text = Replace-RegexRequired `
    $text `
    '(\{\s*value:\s*"cloture",\s*label:\s*"Signalement clôturé",\s*\},)' `
    '$1
  {
    value: "archive",
    label: "Archivé",
  },' `
    "Option archive"

# ============================================================
# NORMALIZE STATUS
# ============================================================

$text = Replace-RegexRequired `
    $text `
    '(if\s*\(\s*value\s*===\s*"cloture")' `
    'if (
    value === "archive" ||
    value === "archivé" ||
    value === "archive"
  ) {
    return "archive";
  }

  $1' `
    "Normalize archive"

# ============================================================
# COULEURS ARCHIVE
# ============================================================

$text = Replace-RegexRequired `
    $text `
    '(\s*case\s*"cloture":)' `
    '
    case "archive":
      return {
        badge:
          "bg-gray-200 text-gray-700 border-gray-300",
        card:
          "border-gray-300",
        select:
          "border-gray-300 bg-gray-100 text-gray-700",
      };
$1' `
    "Style archive"

# ============================================================
# ACTION ID
# ============================================================

$text = Replace-RegexRequired `
    $text `
    '(\s*const\s*\[\s*selectedStatuses,)' `
    '
  const [
    actionId,
    setActionId,
  ] =
    useState<string | null>(
      null
    );
$1' `
    "Etat actionId"

# ============================================================
# MASQUER ARCHIVES DANS VUE PRINCIPALE
# ============================================================

$text = Replace-RegexRequired `
    $text `
    'if\s*\(\s*!statusFilter\s*\)\s*\{\s*return\s+signalements\s*;\s*\}' `
    'if (
        !statusFilter
      ) {
        return signalements.filter(
          (item) =>
            normalizeStatus(
              item.status
            ) !== "archive"
        );
      }' `
    "Filtre principal archives"

# ============================================================
# COMPTEUR ARCHIVE
# ============================================================

$text = Replace-RegexRequired `
    $text `
    '(cloture:\s*0,\s*)' `
    '$1        archive: 0,
' `
    "Compteur archive"

# ============================================================
# FONCTIONS ARCHIVER / SUPPRIMER
# ============================================================

$functions = @'
  async function archiveSignalement(
    item: Signalement
  ) {
    const confirmed =
      window.confirm(
        "Archiver ce signalement ? Il restera disponible dans le filtre « Archivé »."
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(item.id);

      const { error } =
        await supabase
          .from("signalements")
          .update({
            status: "archive",
          })
          .eq("id", item.id);

      if (error) {
        throw error;
      }

      setSignalements(
        (previous) =>
          previous.map(
            (signalement) =>
              signalement.id === item.id
                ? {
                    ...signalement,
                    status: "archive",
                  }
                : signalement
          )
      );

      setSelectedStatuses(
        (previous) => ({
          ...previous,
          [item.id]: "archive",
        })
      );
    } catch (error: unknown) {
      console.error(
        "Erreur archivage signalement :",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Impossible d'archiver le signalement."
      );
    } finally {
      setActionId(null);
    }
  }

  async function deleteSignalement(
    item: Signalement
  ) {
    const confirmed =
      window.confirm(
        "Supprimer définitivement ce signalement ? Cette action est irréversible."
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(item.id);

      const { error } =
        await supabase
          .from("signalements")
          .delete()
          .eq("id", item.id);

      if (error) {
        throw error;
      }

      setSignalements(
        (previous) =>
          previous.filter(
            (signalement) =>
              signalement.id !== item.id
          )
      );
    } catch (error: unknown) {
      console.error(
        "Erreur suppression signalement :",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer le signalement."
      );
    } finally {
      setActionId(null);
    }
  }

'@

$text = Replace-RegexRequired `
    $text `
    '(\s*return\s*\(\s*<main)' `
    ("`r`n" + $functions + '  return (' + "`r`n" + '    <main') `
    "Fonctions actions"

# ============================================================
# 6 COLONNES STATISTIQUES
# ============================================================

$text = $text.Replace(
    "lg:grid-cols-5",
    "lg:grid-cols-6"
)

# ============================================================
# STAT ARCHIVE
# ============================================================

$text = Replace-RegexRequired `
    $text `
    '(<Stat\s*label="Clôturé"[\s\S]*?counts\.cloture[\s\S]*?</Stat>|<Stat\s*label="Clôturé"[\s\S]*?/>)' `
    '$1

          <Stat
            label="Archivés"
            value={
              counts.archive
            }
            className="border-gray-300 bg-gray-100 text-gray-700"
          />' `
    "Stat archive"

# ============================================================
# IS TREATED
# ============================================================

$text = Replace-RegexRequired `
    $text `
    '(const\s+colors\s*=\s*statusClasses\(\s*currentStatus\s*\);)' `
    '$1

                  const isTreated =
                    currentStatus === "animal_retrouve" ||
                    currentStatus === "cloture" ||
                    currentStatus === "archive";' `
    "isTreated"

# ============================================================
# CARTE PLUS PETITE SI TRAITEE
# ============================================================

$text = Replace-RegexRequired `
    $text `
    'bg-white\s+p-6\s+shadow-lg\s+\$\{colors\.card\}' `
    'bg-white
                        ${isTreated ? "p-3 sm:p-4" : "p-6"}
                        ${isTreated ? "shadow-sm" : "shadow-lg"}
                        ${colors.card}' `
    "Taille carte"

# ============================================================
# MASQUER PANNEAU STATUT SUR TRAITES
# ============================================================

$text = Replace-RegexRequired `
    $text `
    '(<div\s*className="\s*w-full\s*lg:max-w-sm\s*")' `
    '<div
                          className={`
                            w-full
                            lg:max-w-sm
                            ${isTreated ? "hidden" : ""}
                          `}' `
    "Masquer panneau traite"

# ============================================================
# MASQUER GRILLE DETAIL SUR TRAITES
# ============================================================

$text = Replace-RegexRequired `
    $text `
    '<div\s*className="\s*mt-6\s*grid\s*gap-4\s*md:grid-cols-2\s*xl:grid-cols-3\s*"' `
    '<div
                        className={`
                          mt-6
                          grid
                          gap-4
                          md:grid-cols-2
                          xl:grid-cols-3
                          ${isTreated ? "hidden" : ""}
                        `}' `
    "Masquer détails traités"

# ============================================================
# AJOUT ACTIONS AVANT FIN ARTICLE
# ============================================================

$actions = @'

                      {isTreated && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {currentStatus !== "archive" && (
                            <button
                              type="button"
                              disabled={actionId === item.id}
                              onClick={() =>
                                archiveSignalement(item)
                              }
                              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                            >
                              <Archive size={16} />
                              Archiver
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={actionId === item.id}
                            onClick={() =>
                              deleteSignalement(item)
                            }
                            className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                            Supprimer
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/signalement/${item.id}`
                              )
                            }
                            className="rounded-full border border-[#d8ccc0] bg-white px-4 py-2 text-sm font-black text-[#064b42]"
                          >
                            Voir les détails
                          </button>
                        </div>
                      )}
'@

$mapPosition =
    $text.IndexOf(
        "filteredSignalements.map"
    )

if ($mapPosition -lt 0) {
    throw "Zone map introuvable."
}

$articleClose =
    $text.IndexOf(
        "</article>",
        $mapPosition
    )

if ($articleClose -lt 0) {
    throw "Fin article introuvable."
}

$text =
    $text.Insert(
        $articleClose,
        $actions
    )

# ============================================================
# ECRITURE UNIQUEMENT SI TOUT A REUSSI
# ============================================================

[System.IO.File]::WriteAllText(
    $path,
    $text,
    $utf8
)

Write-Host ""
Write-Host "ADMIN SIGNALEMENTS : MODIFICATION TERMINEE" -ForegroundColor Green
Write-Host ""
Write-Host "OK - Statut Archive"
Write-Host "OK - Filtre Archives"
Write-Host "OK - Compteur Archives"
Write-Host "OK - Cartes traitees compactes"
Write-Host "OK - Bouton Archiver"
Write-Host "OK - Bouton Supprimer"
Write-Host "OK - Confirmation suppression"
Write-Host ""
Write-Host "Backup :" -ForegroundColor Yellow
Write-Host $backup