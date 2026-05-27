@echo off
REM Wrapper for Task Scheduler: load .env then run auto-shift.js <action>
REM Usage: run-shift.cmd checkin | checkout | status
cd /d "%~dp0"
echo [%date% %time%] action=%1 >> "%~dp0shift.log"
"C:\Program Files\nodejs\node.exe" -e "require('fs').readFileSync('.env','utf8').split('\n').forEach(l=>{const m=l.match(/^(\w+)=(.*)$/);if(m&&!l.trim().startsWith('#'))process.env[m[1]]=m[2];});require('child_process').execSync('node auto-shift.js '+process.argv[1],{stdio:'inherit',env:process.env})" %1 >> "%~dp0shift.log" 2>&1
