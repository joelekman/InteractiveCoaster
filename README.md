# SmartCoasterArduino
The arduino code for the smart coaster

## Setup
- Download the latest Ardunio IDE. (https://www.arduino.cc/en/Main/Software)
- Change your Sketchbook location to the "main" folder inside the git folder. Arduino -> Preferences -> Sketchbook location
- When in the settings, add also the additional boards by pasting "http://arduino.esp8266.com/stable/package_esp8266com_index.json" into the "Additional Boards Manager URL".
- Select the Huzzah board in Tools -> Boards -> Adafruit HUZZAH ESP8266
- Done! Go nuts!


## Running the server

- Identify the local IP address of the computer running the server
## Change the IP Address in the following files:
- server/js/services/tables.js (line 11)
- main/main.ino
## From the command line:
- run "npm install" (installing frontend js dependencies)
- run "bower install" (installing development dependencies)
- run "grunt" (minifying js, less and concatenating files)
- run "node server.js"
