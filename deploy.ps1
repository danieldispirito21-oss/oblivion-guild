# ══════════════════════════════════════════════════
# Oblivion Web — Script de publicación en GitHub
# Uso: .\deploy.ps1 -username TU_USUARIO_GITHUB
# ══════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$false)]
    [string]$username = "",

    [string]$repo = "oblivion-guild",
    [string]$message = "Update site"
)

Set-Location "C:\Apps\OblivionWeb"

if ($username -eq "") {
    $username = Read-Host "Tu usuario de GitHub"
}

$repoUrl = "https://github.com/$username/$repo.git"
$pagesUrl = "https://$username.github.io/$repo"

Write-Host "`n🌌 OBLIVION WEB — Deploy a GitHub Pages" -ForegroundColor Cyan
Write-Host "   Repositorio: $repoUrl"
Write-Host "   URL final:   $pagesUrl`n"

# Init git si no existe
if (-not (Test-Path ".git")) {
    Write-Host "→ Inicializando repositorio git..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# Agregar remote si no existe
$remotes = git remote 2>&1
if ($remotes -notmatch "origin") {
    Write-Host "→ Agregando remote origin..." -ForegroundColor Yellow
    git remote add origin $repoUrl
} else {
    git remote set-url origin $repoUrl
}

# Commit y push
Write-Host "→ Agregando archivos..." -ForegroundColor Yellow
git add -A
git status --short

Write-Host "→ Creando commit..." -ForegroundColor Yellow
git commit -m $message --allow-empty

Write-Host "→ Subiendo a GitHub..." -ForegroundColor Yellow
git push -u origin main --force

Write-Host "`n✅ Deploy completado!" -ForegroundColor Green
Write-Host "   1. Ve a https://github.com/$username/$repo/settings/pages"
Write-Host "   2. Source: GitHub Actions"
Write-Host "   3. Espera ~2 minutos y visita: $pagesUrl"
Write-Host "`n⚠️  IMPORTANTE después del deploy:"
Write-Host "   Agrega en Supabase → Auth → URL Configuration:"
Write-Host "   Redirect URL: $pagesUrl/**"
Write-Host "   Y en Discord → OAuth2 → Redirects:"
Write-Host "   https://qlyezahoudioxplkenhe.supabase.co/auth/v1/callback (ya está)"
