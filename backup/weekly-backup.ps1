# PEAK FORCE - weekly backup (read-only on Supabase).
# 1) runs backup/export.mjs  2) zips the new folder  3) copies the zip to Google Drive if installed.
# Never deletes anything. Log: backup/weekly-backup.log
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$log = Join-Path $PSScriptRoot 'weekly-backup.log'
function Log($msg) { "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $msg" | Out-File -FilePath $log -Append -Encoding utf8 }

try {
  Set-Location $root
  Log 'start'
  $before = Get-ChildItem -Path $PSScriptRoot -Directory | Select-Object -ExpandProperty Name
  $out = & node "backup/export.mjs" 2>&1
  $out | ForEach-Object { Log "  $_" }
  if ($LASTEXITCODE -ne 0) { throw "export.mjs exited with $LASTEXITCODE" }

  $newDir = Get-ChildItem -Path $PSScriptRoot -Directory | Where-Object { $before -notcontains $_.Name } | Sort-Object Name -Descending | Select-Object -First 1
  if (-not $newDir) { throw 'no new backup folder was created' }

  $zipDir = Join-Path $PSScriptRoot 'zips'
  New-Item -ItemType Directory -Force -Path $zipDir | Out-Null
  $zip = Join-Path $zipDir ("peak-force-backup-" + $newDir.Name + ".zip")
  Compress-Archive -Path (Join-Path $newDir.FullName '*') -DestinationPath $zip -Force
  Log "zip: $zip"

  # Google Drive for desktop: look for a "My Drive" folder on any drive letter or in the profile.
  $candidates = @()
  Get-PSDrive -PSProvider FileSystem | ForEach-Object { $candidates += (Join-Path $_.Root 'My Drive') }
  $candidates += (Join-Path $env:USERPROFILE 'Google Drive\My Drive'), (Join-Path $env:USERPROFILE 'My Drive')
  $drive = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($drive) {
    $dest = Join-Path $drive 'PEAK FORCE Backups'
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Copy-Item -Path $zip -Destination $dest -Force
    Log "copied to Google Drive: $dest"
  } else {
    Log 'Google Drive for desktop not found - kept local copy only'
  }
  Log 'done'
} catch {
  Log "ERROR: $($_.Exception.Message)"
  exit 1
}
