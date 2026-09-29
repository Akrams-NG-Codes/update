param(
  [string]$SiteDirectory = (Join-Path $PSScriptRoot '..\front end')
)

$ErrorActionPreference = 'Stop'
$siteRoot = (Resolve-Path $SiteDirectory).Path
$issues = [System.Collections.Generic.List[string]]::new()
$localReferenceCount = 0
$htmlFiles = @(Get-ChildItem $siteRoot -Filter '*.html' -Recurse -File)
$markupFiles = @($htmlFiles) + @(Get-ChildItem $siteRoot -Filter '*.css' -Recurse -File)

foreach ($file in $markupFiles) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  if ($file.Extension -eq '.css') {
    $targets = @([regex]::Matches($content, '(?i)url\(\s*["'']?([^"'')]+)["'']?\s*\)') | ForEach-Object { $_.Groups[1].Value.Trim() })
  } else {
    $targets = [System.Collections.Generic.List[string]]::new()
    [regex]::Matches($content, '(?i)\b(?:href|src)\s*=\s*["'']([^"'']+)["'']') | ForEach-Object { $targets.Add($_.Groups[1].Value) }
    foreach ($srcset in [regex]::Matches($content, '(?i)\bsrcset\s*=\s*["'']([^"'']+)["'']')) {
      foreach ($candidate in $srcset.Groups[1].Value.Split(',')) {
        $parts = $candidate.Trim() -split '\s+'
        if ($parts.Count -lt 2 -or $parts[1] -notmatch '^\d+w$') {
          $relativePage = $file.FullName.Substring($siteRoot.Length).TrimStart('\', '/')
          $issues.Add("Malformed srcset candidate in ${relativePage}: $candidate")
        } else {
          $targets.Add($parts[0])
        }
      }
    }
  }

  foreach ($target in $targets) {
    if ($target -match '^(#|//|[a-z][a-z0-9+.-]*:)') { continue }

    $localPath = [uri]::UnescapeDataString(($target -split '[?#]', 2)[0])
    if ([string]::IsNullOrWhiteSpace($localPath)) { continue }
    if ($localPath -eq '/') { $localPath = 'index.html' }
    if ($localPath.StartsWith('/')) {
      $candidate = Join-Path $siteRoot $localPath.TrimStart('/')
    } else {
      $candidate = Join-Path $file.DirectoryName $localPath
    }

    if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
      $relativePage = $file.FullName.Substring($siteRoot.Length).TrimStart('\', '/')
      $issues.Add("Missing local reference in ${relativePage}: $target")
    } else {
      $localReferenceCount++
    }
  }
}

$menuSignatures = [System.Collections.Generic.List[string]]::new()
foreach ($file in $htmlFiles) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $nav = [regex]::Match($content, '(?is)<nav aria-label="Main navigation">(.*?)</nav>')
  if (-not $nav.Success) { continue }
  $labels = [regex]::Matches($nav.Groups[1].Value, '<a\b[^>]*>(.*?)</a>') | ForEach-Object {
    ([regex]::Replace($_.Groups[1].Value, '<[^>]+>', '')).Trim()
  }
  $menuSignatures.Add(($labels -join '|'))
}

if (@($menuSignatures | Select-Object -Unique).Count -gt 1) {
  $issues.Add('Primary navigation differs between HTML pages.')
}

$galleryPath = Join-Path $siteRoot 'gallery.html'
$galleryContent = [System.IO.File]::ReadAllText($galleryPath)
$gallery = [regex]::Match($galleryContent, '(?is)<div class="story-gallery gallery-grid">(.*?)</div>')
if (-not $gallery.Success) {
  $issues.Add('Gallery grid container was not found.')
} else {
  $galleryContent = $gallery.Groups[1].Value
  $figureCount = [regex]::Matches($galleryContent, '<figure\b').Count
  $figureEndCount = [regex]::Matches($galleryContent, '</figure>').Count
  $galleryImageCount = [regex]::Matches($galleryContent, '<img\b').Count
  if ($figureCount -ne $figureEndCount -or $figureCount -ne $galleryImageCount) {
    $issues.Add("Gallery figures/images do not balance: figures=$figureCount, closing=$figureEndCount, images=$galleryImageCount.")
  }
}

if ($issues.Count) {
  $issues | ForEach-Object { Write-Error $_ }
  exit 1
}

Write-Output "Site checks passed: $localReferenceCount local references, $($menuSignatures.Count) consistent menus, balanced gallery figures."