Set-Location c:\Dev\ZyncIT
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$output = & $adbPath -s 83bfc391 logcat -d 2>&1 | Select-String -Pattern "ReactNativeJS" | Select-Object -First 100
$output | Out-File -FilePath "c:\Dev\ZyncIT\logcat_output.txt" -Encoding UTF8
Write-Host "Done. Check logcat_output.txt"
