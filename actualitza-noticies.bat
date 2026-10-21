@echo off
cd /d "%~dp0"
node tools\update-news.js && npx firebase-tools deploy --only hosting
pause
