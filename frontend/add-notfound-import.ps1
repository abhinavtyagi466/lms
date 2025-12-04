# Add NotFound import after line 55
$file = 'App.tsx'
$content = Get-Content $file
$lineNumber = 55
$newLine = "const NotFound = lazy(() => import('./pages/NotFound').then(module => ({ default: module.NotFound })));"

# Insert the new line after line 55
$newContent = @()
for ($i = 0; $i < $content.Length; $i++) {
    $newContent += $content[$i]
    if ($i -eq $lineNumber) {
        $newContent += $newLine
    }
}

Set-Content $file $newContent
Write-Host "NotFound import added successfully"
