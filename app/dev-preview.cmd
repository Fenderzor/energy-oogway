@echo off
REM Launches the Vite dev server with Node on PATH (Node lives in a user-local folder).
set "PATH=C:\Users\oskar\tools\node;%PATH%"
cd /d "%~dp0"
node "node_modules\vite\bin\vite.js" --host --port 5173
