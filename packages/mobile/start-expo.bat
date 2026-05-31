@echo off
set EXPO_OFFLINE=true
set EXPO_NO_TELEMETRY=true
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8081 "') do (
  if not "%%a"=="" taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
npx expo start --web --port 8081
