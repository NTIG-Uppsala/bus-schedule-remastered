@echo off
:: Downloads data to be used for testing
:: You need a .env file in the root of the repository with the following variables:
:: STATIC_API_KEY="{put your static api key kere}"
:: Example: STATIC_API_KEY="1234567890"

setlocal
FOR /F "tokens=*" %%i in ('type .env') DO SET "%%i"
curl -o ./data/testdata.zip https://opendata.samtrafiken.se/gtfs/ul/ul.zip?key=%STATIC_API_KEY% -H "Accept-Encoding: deflate"
endlocal
pause