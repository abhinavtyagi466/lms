# Quick Fix Script for Warning Documents

Write-Host "🔧 Applying fixes to UserDetailsPage.tsx..." -ForegroundColor Cyan

$filePath = "frontend/pages/admin/UserDetailsPage.tsx"
$content = Get-Content $filePath -Raw

# Fix 1: Add warning event listener
$content = $content -replace `
  '(window\.addEventListener\(''focus'', handleFocus\);)',`
  '$1

    const handleWarningCreated = (e: any) => {
      if (e.detail?.userId === userId) {
        console.log(''Warning created for this user, refreshing data...'');
        fetchUserDetails();
      }
    };
    window.addEventListener(''warningCreated'', handleWarningCreated);'

# Fix 2: Add cleanup for warning listener
$content = $content -replace `
  '(window\.removeEventListener\(''focus'', handleFocus\);)',`
  '$1
      window.removeEventListener(''warningCreated'', handleWarningCreated);'

# Fix 3: Add attachment display (find the warnings section)
$content = $content -replace `
  '(<Badge className=\{getStatusColor\(warning\.status\)\}>[\s\S]*?</Badge>[\s\S]*?</div>)([\s\S]*?</Card>)',`
  '$1

                        {warning.metadata?.attachmentUrl && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <a
                              href={warning.metadata.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-sm"
                            >
                              <FileText className="w-4 h-4" />
                              View Attachment
                            </a>
                          </div>
                        )}$2'

Set-Content $filePath -Value $content

Write-Host "✅ Fixes applied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Changes made:" -ForegroundColor Yellow
Write-Host "1. Added warningCreated event listener" -ForegroundColor White
Write-Host "2. Added event cleanup" -ForegroundColor White
Write-Host "3. Added attachment display UI" -ForegroundColor White
