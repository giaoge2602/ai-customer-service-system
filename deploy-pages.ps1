param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$PagesRepoUrl,

  [Parameter(Position = 1)]
  [string]$PagesDir = ''
)

$ErrorActionPreference = 'Stop'
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($PagesDir)) {
  $PagesDir = Join-Path $RootDir '..\ai-customer-service-pages'
}
$PagesDir = [System.IO.Path]::GetFullPath($PagesDir)

if ($PagesRepoUrl -match 'YOUR_GITEE_USERNAME') {
  throw 'Please provide a real Gitee Pages repository URL.'
}

Push-Location $RootDir
try {
  Write-Host '[1/4] Building frontend...'
  npm run build

  if (Test-Path (Join-Path $PagesDir '.git')) {
    Write-Host '[2/4] Updating Pages repository...'
    git -C $PagesDir pull --ff-only
  } else {
    Write-Host '[2/4] Cloning Pages repository...'
    git clone $PagesRepoUrl $PagesDir
  }

  Write-Host '[3/4] Syncing dist to Pages repository...'
  Get-ChildItem -Force $PagesDir |
    Where-Object { $_.Name -ne '.git' } |
    Remove-Item -Recurse -Force
  Copy-Item -Path (Join-Path $RootDir 'dist\*') -Destination $PagesDir -Recurse -Force

  git -C $PagesDir add -A
  git -C $PagesDir diff --cached --quiet
  if ($LASTEXITCODE -eq 0) {
    Write-Host 'No new build files to publish.'
    exit 0
  }

  git -C $PagesDir commit -m 'deploy: update frontend build'
  $Branch = git -C $PagesDir branch --show-current
  if ([string]::IsNullOrWhiteSpace($Branch)) { $Branch = 'master' }

  Write-Host "[4/4] Pushing to Gitee Pages (branch: $Branch)..."
  git -C $PagesDir push origin $Branch
  Write-Host 'Build files pushed. Return to Gitee Pages and click Update.'
}
finally {
  Pop-Location
}
