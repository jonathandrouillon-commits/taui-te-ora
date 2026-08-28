$ErrorActionPreference = "Stop"

$path = Join-Path $PSScriptRoot "app\animal\[id]\page.tsx"

if (-not (Test-Path -LiteralPath $path)) {
    throw "Fichier introuvable : $path"
}

$utf8 = New-Object System.Text.UTF8Encoding($false)

$text = [System.IO.File]::ReadAllText(
    $path,
    [System.Text.Encoding]::UTF8
)

# ============================================================
# 1. AJOUT DE L'ETAT DU COMPTEUR
# ============================================================

$markerState = @'
  const [
    matchError,
    setMatchError,
  ] = useState("");
'@

$newState = @'
  const [
    matchError,
    setMatchError,
  ] = useState("");

  const [
    likesCount,
    setLikesCount,
  ] = useState(0);
'@

if (-not $text.Contains($markerState)) {
    throw "Impossible de trouver la zone des states."
}

$text = $text.Replace(
    $markerState,
    $newState
)

# ============================================================
# 2. FONCTION DE CHARGEMENT DU COMPTEUR
# ============================================================

$markerLoader = @'
  const loadAnimal = useCallback(async () => {
'@

$newLoader = @'
  const loadLikesCount = useCallback(async () => {
    const {
      count,
      error,
    } = await supabase
      .from("favorites")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("animal_id", id);

    if (error) {
      console.error(
        "Erreur compteur coups de coeur :",
        error
      );

      return;
    }

    setLikesCount(
      count || 0
    );
  }, [id]);

  const loadAnimal = useCallback(async () => {
'@

if (-not $text.Contains($markerLoader)) {
    throw "Impossible de trouver loadAnimal."
}

$text = $text.Replace(
    $markerLoader,
    $newLoader
)

# ============================================================
# 3. CHARGEMENT + TEMPS REEL
# ============================================================

$markerEffect = @'
  useEffect(() => {
    queueMicrotask(() => void loadAnimal());
  }, [id, loadAnimal]);
'@

$newEffect = @'
  useEffect(() => {
    queueMicrotask(() => {
      void loadAnimal();
      void loadLikesCount();
    });

    const channel = supabase
      .channel(`animal-page-favorites-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "favorites",
          filter: `animal_id=eq.${id}`,
        },
        () => {
          void loadLikesCount();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(
        channel
      );
    };
  }, [id, loadAnimal, loadLikesCount]);
'@

if (-not $text.Contains($markerEffect)) {
    throw "Impossible de trouver le useEffect de chargement."
}

$text = $text.Replace(
    $markerEffect,
    $newEffect
)

# ============================================================
# 4. TRANSMISSION A ANIMALHEADER
# ============================================================

$markerHeader = @'
              association={
                association
              }
            />
'@

$newHeader = @'
              association={
                association
              }
              likesCount={
                likesCount
              }
            />
'@

if (-not $text.Contains($markerHeader)) {
    throw "Impossible de trouver AnimalHeader."
}

$text = $text.Replace(
    $markerHeader,
    $newHeader
)

# ============================================================
# ECRITURE UTF-8 SANS BOM
# ============================================================

[System.IO.File]::WriteAllText(
    $path,
    $text,
    $utf8
)

Write-Host ""
Write-Host "COMPTEUR FAVORITES AJOUTE A LA FICHE ANIMAL" -ForegroundColor Green
Write-Host ""
Write-Host "Source : favorites" -ForegroundColor Cyan
Write-Host "Temps reel : active" -ForegroundColor Cyan
Write-Host "AnimalHeader : connecte" -ForegroundColor Cyan