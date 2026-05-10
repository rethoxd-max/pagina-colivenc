# =============================================================
#  SCRIPT DE DESPLIEGUE - cecolivenc.es
#  Uso: .\deploy.ps1
#       .\deploy.ps1 -Solo backend
#       .\deploy.ps1 -Solo frontend
# =============================================================

param(
    [ValidateSet("todo", "backend", "frontend")]
    [string]$Solo = "todo"
)

$SSH_KEY    = "C:\Users\Pablo\.ssh\cecolivenc"
$SERVER     = "root@178.104.136.39"
$REPO_LOCAL = "C:\Users\Pablo\OneDrive\Documentos\paginacolivenc2\pagina-colivenc"
$BACK_LOCAL = "$REPO_LOCAL\backend"
$FRONT_DIST = "$REPO_LOCAL\frontend\dist\pagina-colivenc"
$BACK_REMOTE = "/var/www/cecolivenc/repo/backend"
$FRONT_REMOTE = "/var/www/cecolivenc/frontend"

# ── Git ───────────────────────────────────────────────────────
Write-Host "`n[1/4] Subiendo cambios a Git..." -ForegroundColor Cyan
Set-Location $REPO_LOCAL
git add .
git commit -m "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git push origin main
git checkout develop
git merge main
git push origin develop
git checkout main
Write-Host "      Git OK" -ForegroundColor Green

# ── Backend ───────────────────────────────────────────────────
if ($Solo -eq "todo" -or $Solo -eq "backend") {
    Write-Host "`n[2/4] Subiendo backend al servidor..." -ForegroundColor Cyan
    scp -i $SSH_KEY -r `
        "$BACK_LOCAL\models" `
        "$BACK_LOCAL\routes" `
        "$BACK_LOCAL\services" `
        "$BACK_LOCAL\middleware" `
        "$BACK_LOCAL\config" `
        "$BACK_LOCAL\utils" `
        "$BACK_LOCAL\index.js" `
        "${SERVER}:${BACK_REMOTE}/"
    ssh -i $SSH_KEY $SERVER "pm2 restart cecolivenc-backend"
    Write-Host "      Backend OK" -ForegroundColor Green
}

# ── Frontend ──────────────────────────────────────────────────
if ($Solo -eq "todo" -or $Solo -eq "frontend") {
    Write-Host "`n[3/4] Compilando frontend..." -ForegroundColor Cyan
    Set-Location "$REPO_LOCAL\frontend"
    npx ng build --configuration production
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 1) {
        Write-Host "ERROR: el build ha fallado con errores." -ForegroundColor Red
        exit 1
    }

    Write-Host "`n[4/4] Subiendo frontend y corrigiendo permisos..." -ForegroundColor Cyan
    scp -i $SSH_KEY -r "$FRONT_DIST\." "${SERVER}:${FRONT_REMOTE}/"
    ssh -i $SSH_KEY $SERVER @"
find $FRONT_REMOTE -type d -exec chmod 755 {} \;
find $FRONT_REMOTE -type f -exec chmod 644 {} \;
find $FRONT_REMOTE -type d -exec chmod 755 {} +
find $FRONT_REMOTE -type f -exec chmod 644 {} +
systemctl reload nginx
"@
    Write-Host "      Frontend OK" -ForegroundColor Green
}

Write-Host "`n Despliegue completado." -ForegroundColor Green
Set-Location $REPO_LOCAL
