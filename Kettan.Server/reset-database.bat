@echo off
echo ========================================
echo  Database Reset Script
echo ========================================
echo.
echo WARNING: This will DELETE ALL DATA!
echo.
pause

echo.
echo Dropping database...
dotnet ef database drop --force

echo.
echo Applying migrations...
dotnet ef database update

echo.
echo ========================================
echo  Database reset complete!
echo ========================================
echo.
echo You can now start your application.
echo It will automatically seed fresh data.
echo.
pause
