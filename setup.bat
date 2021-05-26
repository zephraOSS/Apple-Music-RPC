powershell -Command "(New-Object Net.WebClient).DownloadFile('https://github.com/N0chteil/Apple-Music-RPC/releases/download/latest/amrpc-win.zip', 'amrpc-win.zip')"
powershell -Command "Expand-Archive amrpc-win.zip ."
del "amrpc-win.zip"
>AMRPC.bat (
  echo npm start
)
npm install
npm start setup
exit 0