<#
  3P test ajanının akış dosyasını canlı ve okunur biçimde izler (ajan çalışırken).
  Örnek:  ./tools/watch-3p.ps1 C:\Users\deizer\Desktop\visual-agent-teacher-runs\run-03.stream.jsonl
  Çıkmak için Ctrl+C.
#>
param([Parameter(Mandatory)] [string] $StreamFile, [switch] $FromStart)
$short = { param($s, $n = 220) $s = ($s -replace '\s+', ' ').Trim(); if ($s.Length -gt $n) { $s.Substring(0, $n) + '…' } else { $s } }
$tail = if ($FromStart) { @{} } else { @{ Tail = 30 } }
Get-Content -Path $StreamFile -Wait -Encoding utf8 @tail | ForEach-Object {
  try { $o = $_ | ConvertFrom-Json } catch { return }
  switch ($o.type) {
    'assistant' {
      foreach ($c in $o.message.content) {
        if ($c.type -eq 'text' -and $c.text.Trim()) { Write-Host ("🤖 " + (& $short $c.text 400)) -ForegroundColor Cyan }
        elseif ($c.type -eq 'tool_use') {
          $i = $c.input; $d = if ($i.command) { $i.command } elseif ($i.file_path) { $i.file_path } elseif ($i.pattern) { $i.pattern } else { ($i | ConvertTo-Json -Compress) }
          Write-Host ("🔧 $($c.name): " + (& $short $d)) -ForegroundColor Yellow
        }
      }
    }
    'user' {
      foreach ($c in $o.message.content) {
        if ($c.type -eq 'tool_result') {
          $t = if ($c.content -is [string]) { $c.content } else { ($c.content | ForEach-Object { if ($_.type -eq 'text') { $_.text } else { "<$($_.type)>" } }) -join ' ' }
          Write-Host ("   ↳ " + (& $short $t 260)) -ForegroundColor DarkGray
        }
      }
    }
    'result' { Write-Host ("✅ BİTTİ: $($o.subtype) · $($o.num_turns) tur · " + (& $short $o.result 300)) -ForegroundColor Green }
  }
}
