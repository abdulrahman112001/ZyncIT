@echo off
%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe -s 83bfc391 logcat -d > c:\Dev\ZyncIT\logcat_output.txt 2>&1
echo Done. Output saved to c:\Dev\ZyncIT\logcat_output.txt
