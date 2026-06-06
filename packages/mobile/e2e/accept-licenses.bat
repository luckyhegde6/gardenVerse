@echo off
set "JAVA_HOME=C:\jdk17\jdk-17.0.12"
set "PATH=%JAVA_HOME%\bin;%PATH%"

:: Accept all 7 licenses by piping multiple y responses
(
echo y
echo y
echo y
echo y
echo y
echo y
echo y
echo y
) | C:\Users\lucky\AppData\Local\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat --licenses

echo Done accepting licenses.
