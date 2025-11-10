@echo off
echo Downloading SQLite JDBC Driver...
echo ================================

set SQLITE_VERSION=3.44.1.0
set SQLITE_JAR=sqlite-jdbc-%SQLITE_VERSION%.jar
set DOWNLOAD_URL=https://repo1.maven.org/maven2/org/xerial/sqlite-jdbc/%SQLITE_VERSION%/%SQLITE_JAR%

echo Downloading from: %DOWNLOAD_URL%
echo Saving to: %CD%\%SQLITE_JAR%

powershell -Command "Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%SQLITE_JAR%'"

if exist "%SQLITE_JAR%" (
    echo ✅ Successfully downloaded SQLite JDBC driver!
    echo.
    echo To use with Server.java:
    echo java -cp ".;%SQLITE_JAR%" Server 2001
    echo.
) else (
    echo ❌ Failed to download SQLite JDBC driver
    echo.
    echo Alternative: Use ServerSimple.java instead:
    echo java ServerSimple 2001
)

pause