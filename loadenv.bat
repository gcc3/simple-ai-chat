@echo off
for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    set "%%A=%%B"
    echo Set %%A=%%B
)