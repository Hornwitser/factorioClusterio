cd "Factorio 0.13.9"
@RD /S /Q "temp"
cd "bin/x64/"
start factorio.exe --start-server testmap.zip --rcon-port 12345 --rcon-password 123 --server-settings server-settings.json
cd ..
cd ..
cd ..

start cmd /C node client.js
start cmd /C node master.js

::cd "Factorio 0.13.9 - Copy/bin/x64"
::@start factorio.exe

pause