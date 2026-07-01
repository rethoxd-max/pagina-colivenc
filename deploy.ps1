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

$SSH_KEY      = "C:\Users\Pablo\.ssh\cecolivenc"
$SERVER       = "root@178.104.136.39"
$SSH_ARGS     = @("-i", $SSH_KEY, "-o", "ConnectTimeout=15", "-o", "BatchMode=yes")
$REPO_LOCAL   = "C:\Users\Pablo\OneDrive\Documentos\paginacolivenc2\pagina-colivenc"
$FRONT_DIST   = "$REPO_LOCAL\frontend\dist\pagina-colivenc"
$REPO_REMOTE  = "/var/www/cecolivenc/repo"
$FRONT_REMOTE = "/var/www/cecolivenc/frontend"

# Ejecuta un comando en el servidor por SSH y para el script si falla
# (antes el script seguía e imprimía "OK" aunque ssh fallara por timeout)
function Invoke-RemoteCommand {
    param([string]$Command, [string]$FailHint = "")
    & ssh @SSH_ARGS $SERVER $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nERROR: el comando remoto ha fallado (código $LASTEXITCODE)." -ForegroundColor Red
        Write-Host "Comando: $Command" -ForegroundColor Red
        if ($FailHint) { Write-Host $FailHint -ForegroundColor Yellow }
        exit 1
    }
}

# Copia archivos al servidor por SCP y para el script si falla
function Invoke-RemoteCopy {
    param([string[]]$LocalPaths, [string]$RemotePath)
    & scp -i $SSH_KEY -o ConnectTimeout=15 -o BatchMode=yes -r @LocalPaths "${SERVER}:${RemotePath}"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nERROR: scp ha fallado (código $LASTEXITCODE) subiendo a $RemotePath." -ForegroundColor Red
        exit 1
    }
}

# ── Git ───────────────────────────────────────────────────────
Write-Host "`n[1/4] Subiendo cambios a Git..." -ForegroundColor Cyan
Set-Location $REPO_LOCAL
git add .
git commit -m "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    $CURRENT_BRANCH = git branch --show-current
    
    if ($CURRENT_BRANCH -eq "develop") {
        git push origin develop
        git checkout main
        git merge develop
        git push origin main
    } else {
        git push origin main
        git checkout develop
        git merge main
        git push origin develop
        git checkout main
    }
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: git push ha fallado. Revisa tu conexión o si hay conflictos." -ForegroundColor Red
    exit 1
}
Write-Host "      Git OK" -ForegroundColor Green

# ── Backend ───────────────────────────────────────────────────
if ($Solo -eq "todo" -or $Solo -eq "backend") {
    Write-Host "`n[2/4] Sincronizando backend en el servidor (deploy/2-deploy.sh)..." -ForegroundColor Cyan
    # Antes se subía el backend por scp, lo que dejaba el git del servidor desincronizado
    # de lo que realmente corría en producción. Ahora se invoca el mismo script que se usa
    # para actualizar manualmente en el servidor (deploy/2-deploy.sh), que hace
    # "git pull --ff-only" + npm install + pm2 restart. Así hay una única fuente de verdad
    # para la lógica de actualización del backend, en vez de duplicarla aquí.
    $backendHint = "deploy/2-deploy.sh ha fallado, probablemente porque git pull --ff-only " + `
        "no ha podido hacer fast-forward (cambios locales o archivos sin trackear en el " + `
        "servidor). Entra por SSH o por la consola de Hetzner y revisa con " + `
        "'git diff --ignore-space-at-eol --stat -- backend/' antes de resolverlo a mano. " + `
        "No se sobrescribe nada automaticamente."
    Invoke-RemoteCommand -Command "bash $REPO_REMOTE/deploy/2-deploy.sh" -FailHint $backendHint
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
    Invoke-RemoteCopy -LocalPaths @("$FRONT_DIST\.") -RemotePath "$FRONT_REMOTE/"
    Invoke-RemoteCommand -Command "chmod 755 /var/www/cecolivenc && find $FRONT_REMOTE -type d -exec chmod 755 {} + && find $FRONT_REMOTE -type f -exec chmod 644 {} + && systemctl reload nginx"
    Write-Host "      Frontend OK" -ForegroundColor Green
}

Write-Host "`n Despliegue completado." -ForegroundColor Green
Set-Location $REPO_LOCAL
