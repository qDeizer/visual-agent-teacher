<#
  Bir test görevini, ana Claude aboneliğini kullanmadan, 3P gateway üzerindeki bir Claude Code ajanına verir.

  Ayarlar repo kökündeki .env dosyasından okunur (git'e girmez):
    VAT_3P_BASE_URL, VAT_3P_KEY, VAT_3P_MODEL

  Ajan ayrı bir ayar klasöründe (CLAUDE_CONFIG_DIR) çalışır; kullanıcının Claude girişleri ve ayarları okunmaz/yazılmaz.

  Örnek:
    ./tools/run-3p-agent.ps1 -WorkDir C:\...\runs\t1 -PromptFile C:\...\brief.md -OutFile C:\...\runs\t1\result.json
#>
param(
  [Parameter(Mandatory)] [string] $WorkDir,
  [string] $Prompt,
  [string] $PromptFile,
  [string] $OutFile,
  [int] $MaxTurns = 80,
  # Önceki bir oturuma yeni mesajla devam et (session_id)
  [string] $Resume,
  # Canlı akış: her mesaj/araç çağrısı/çıktı satır satır OutFile'a yazılır (stream-json)
  [switch] $Stream
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root '.env'
if (-not (Test-Path $envFile)) { throw ".env bulunamadı: $envFile" }
$cfg = @{}
Get-Content $envFile | Where-Object { $_ -match '^\s*([A-Z0-9_]+)=(.*)$' } | ForEach-Object { $cfg[$Matches[1]] = $Matches[2].Trim() }

if ($PromptFile) { $Prompt = Get-Content $PromptFile -Raw }
if (-not $Prompt) { throw 'Prompt ya da PromptFile gerekli' }
New-Item -ItemType Directory -Force $WorkDir | Out-Null

# Yalnız bu sürece ait ortam değişkenleri
$env:CLAUDE_CONFIG_DIR = Join-Path $env:USERPROFILE '.claude-vat-3p'
$env:ANTHROPIC_BASE_URL = $cfg.VAT_3P_BASE_URL
$env:ANTHROPIC_AUTH_TOKEN = $cfg.VAT_3P_KEY
$env:ANTHROPIC_API_KEY = ''
$env:ANTHROPIC_MODEL = $cfg.VAT_3P_MODEL
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = $cfg.VAT_3P_MODEL
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = $cfg.VAT_3P_MODEL
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = $cfg.VAT_3P_MODEL
$env:ANTHROPIC_SMALL_FAST_MODEL = $cfg.VAT_3P_MODEL
$env:DISABLE_AUTOUPDATER = '1'
$env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = '1'
New-Item -ItemType Directory -Force $env:CLAUDE_CONFIG_DIR | Out-Null

Push-Location $WorkDir
try {
  # Uyarılar (örn. unrecognized_model) stderr'e gider; stdout temiz JSON kalsın
  $errFile = Join-Path $WorkDir 'agent-stderr.log'
  $cliArgs = @('-p', '--permission-mode', 'bypassPermissions', '--max-turns', $MaxTurns)
  if ($Resume) { $cliArgs += @('--resume', $Resume) }
  if ($Stream) {
    if (-not $OutFile) { throw '-Stream için OutFile gerekli' }
    # Satırlar geldikçe dosyaya yazılır; ajan çalışırken dosya okunabilir
    $Prompt | claude @cliArgs --output-format stream-json --verbose 2>$errFile | ForEach-Object { Add-Content -Path $OutFile -Value $_ -Encoding utf8NoBOM; $_ } | Select-Object -Last 1
    return
  }
  $out = $Prompt | claude @cliArgs --output-format json 2>$errFile
} finally { Pop-Location }
if ($OutFile) { $out | Set-Content $OutFile -Encoding utf8NoBOM }
$out
