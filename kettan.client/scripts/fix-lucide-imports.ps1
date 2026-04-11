$files = Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx
$pattern = 'import\s+([A-Za-z0-9_]+)\s+from\s+[''\"]@/components/icons/lucide-mui/[''\"];'

foreach ($file in $files) {
  $content = Get-Content -Path $file.FullName -Raw
  if ($null -eq $content) {
    continue
  }

  $updated = [regex]::Replace($content, $pattern, {
    param($match)
    $iconName = $match.Groups[1].Value
    return "import $iconName from '@/components/icons/lucide-mui/$iconName';"
  })

  if ($updated -ne $content) {
    Set-Content -Path $file.FullName -Value $updated
  }
}

Write-Output 'FIX_DONE'
