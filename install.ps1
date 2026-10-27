$ErrorActionPreference = 'Stop'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Instale o Node.js LTS e abra novamente o terminal: https://nodejs.org/'
}
& node (Join-Path $PSScriptRoot 'scripts/install.cjs') @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
