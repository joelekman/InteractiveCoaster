# Interactive coaster
Interactive coaster is a collaborative effort by KTH Royal Institute of Technology students to explore the physical interaction design space. We up-cycled the traditional drink coaster concept and transformed it into a device that senses and expresses states. Smart coaster will help bar staff notice and respond to when people need a refill and when hey seek assistance. Smart coaster comes with a customisable companion application.

For this project you will need a load cell (you can get one from a regular household scale), a micro-controller, a Neopixel RGB led ring and some other more or less necessary components. You will require some tools, a bit of skill and determination. We give you our shopping list, step by step instructions, files and code to guarantee your success. Enjoy!

Max, Joel, Victor, Aroshine & Heidi


## Setup
- Download the latest Ardunio IDE. (https://www.arduino.cc/en/Main/Software)
- Change your Sketchbook location to the "main" folder inside the git folder. Arduino -> Preferences -> Sketchbook location
- When in the settings, add also the additional boards by pasting "http://arduino.esp8266.com/stable/package_esp8266com_index.json" into the "Additional Boards Manager URL".
- Select the Huzzah board in Tools -> Boards -> Adafruit HUZZAH ESP8266
- Done! Go nuts!


## Running the server

- Identify the local IP address of the computer running the server

### Change the IP Address in the following files:
- server/js/services/tables.js (line 11)
- main/main.ino

### From the command line:
- run "npm install" (installing frontend js dependencies)
- run "bower install" (installing development dependencies)
- run "grunt" (minifying js, less and concatenating files)
- run "node server.js"
