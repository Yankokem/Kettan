# PowerShell script to drop and recreate the database
# This will delete all existing data!

Write-Host "Dropping database..." -ForegroundColor Yellow
dotnet ef database drop --force

Write-Host "Creating database and applying migrations..." -ForegroundColor Yellow
dotnet ef database update

Write-Host "Database reset complete!" -ForegroundColor Green
