# ShowDBs.ps1
# Quick demonstration of primary.db and backup.db contents

# Path to sqlite3 executable
$sqliteExe = ".\sqlite3.exe"

# Function to display DB contents
function Show-DB($dbFile) {
    if (Test-Path $dbFile) {
        Write-Host "`n=== Contents of $dbFile ===`n" -ForegroundColor Cyan
        & $sqliteExe $dbFile "SELECT * FROM documents;"
    } else {
        Write-Host "`n❌ $dbFile not found!" -ForegroundColor Red
    }
}

# Show both databases
Show-DB "primary.db"
Show-DB "backup.db"

Write-Host "`n✅ Done showing both databases.`n" -ForegroundColor Green
