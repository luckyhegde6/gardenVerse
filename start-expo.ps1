$env:EXPO_OFFLINE='true'
$env:EXPO_NO_TELEMETRY='true'
Set-Location 'F:\Local_git\gardenVerse\packages\mobile'
cmd /c "npm.cmd run web -- --port 8081"
