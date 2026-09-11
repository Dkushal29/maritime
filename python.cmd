@echo off
set "PYTHONPATH=%~dp0backend;%PYTHONPATH%"
"%~dp0backend\venv\Scripts\python.exe" %*
