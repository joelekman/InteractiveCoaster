/*
  The main code for the smart coster arduino project
  made by: Liquid temp
  date: 2016-09-19
*/

/*
 * Comment out the different variables depending
 * on wheather you want to use them.
 */
#define USE_WIFI
#define USE_SCALE

// Library includes
// -----------------------------------

#include <HX711.h>
#include <Adafruit_NeoPixel.h>

#ifdef USE_WIFI
  #include <ESP8266WiFi.h>
  #include <WiFiUdp.h>
#endif

// -----------------------------------

// Public states
// -----------------------------------
int initialize = 0;
int noGlass = 1;
int content = 2;
int lowContent = 3;
int assistance = 4;
// -----------------------------------

// Weight definitions
// The Limits may need to configured according to what glass that is used
// -----------------------------------
int wNoGlass = 80;
int wLowContent = 300;
int wContent = 700;
// -----------------------------------

// Pins
// Change the pins to correspond to the pins used on the arduino
// -----------------------------------
int dataPinScale = 12;
int clockPinScale = 13;
int ledsPin = 14;
// -----------------------------------


// Counters and delay variables
int tareCounter = 0; // For sequential tear
int stateDelay = 0; // Counter for making smoother transitions between states
int delayLimit = 0; // How long to wait before switching state
int lastStateChange = 0; // Cycles since last state change. Used to set initial weight state
int initialWeightState = 0; // Save the initial weight after state change
int tareCycle = 24; // How often it should do the sequential tare

// initial state
unsigned int state = initialize;

// Scale variables
double weight = 0;
double prevWeight = 0;

// Led variables
unsigned int patternInterval = 20 ; // time between steps in the pattern
unsigned int lastUpdate = 0 ; // for millis() when last update occoured
int cR = 0;
int cG = 0;
int cB = 0;
int colorStep = 10;
int brightness = 200;

// Wifi/Udp variables
#ifdef USE_WIFI
  IPAddress ip(10,10,10,10); // IP adress of server. Change to your IP address
  unsigned int port = 41234;
  char* ssid = "Wifi network name"; // Change to the ssid of your wifi network
  char* password = "password"; // Change to the password of your wifi network
  String cId = "2"; // String for easy protocol message build Need to be uniqe for each coaster. This is hard coded now. Should not be in the future.
  int bufferSize = 255;
  WiFiUDP Udp; // UDP Client
  int needAssist  = 0;
#endif

HX711 scale(dataPinScale, clockPinScale, 64);
Adafruit_NeoPixel leds = Adafruit_NeoPixel(24, ledsPin, NEO_GRB + NEO_KHZ800);

/*
   Setup right now:
   1. Serial
   2. Leds
   3. Scale
   4. Wifi
*/
void setup() {
  Serial.begin(115200);
  Serial.println("\nSetting up!");

  // Leds
  leds.begin();
  leds.setBrightness(brightness);
  wipe();
  updateLeds();
  Serial.println("Leds done!");

  // Scale
  #ifdef USE_SCALE
  //calibrateScale();
  initScale();
  Serial.println("Scale done!");
  #endif

  //Wifi
  #ifdef USE_WIFI
  initWifi();
  Serial.println("Wifi done!");
  #endif
}

void loop() {
    
  // Read data from server
  #ifdef USE_WIFI
  handleData(readData());
  #endif

  // 
  if (tareCounter % 4 == 0) { 
  #ifdef USE_SCALE
  // Read the value of the scale and set state accordingly.
  handleScale();
  #endif
  } else {
    delay(50);
  }
  // Update leds each iteration
  updateLeds();
  tareCounter++; // Increase the tare counter used for calculate when the next tare should occure.
  lastStateChange++; // Increse the cycles since last state change

  // Code for keeping the loadcell generating consistent values
  if (lastStateChange == 14 && state != assistance) 
  {
    initialWeightState = weight;
  }   
  if (tareCounter > tareCycle && state != assistance)
  {
    if (state == noGlass) {
      scale.tareNonBlocking(); 
    } else {
      scale.tareWithCompensation(initialWeightState);  
    }
    Serial.println("sequential tare"); 
    tareCounter = 0;
  }
}

//-------------------------------------------------------------------//
//--------------- START OF CODE FOR HELPER FUNCTIONS ----------------//
//-------------------------------------------------------------------//

/*
   Handle for state changes
*/
void setState(int newState)
{
  if (state != newState && stateDelay >= delayLimit) {
    if (newState == noGlass) {
      scale.tareNonBlocking();
    }
    Serial.print("Setting state to: ");
    Serial.println(newState);
    state = newState;
    stateDelay = 0;
    tareCounter = 0;
    lastStateChange = 0;
    patternInterval = 10;//_intervals[state]; // set speed for this pattern
    sendData(weight, needAssist);
    //wipe();
  } else {
    stateDelay += 1;  
  }
}

//-------------------------------------------------------------------//
//--------------- END OF CODE FOR HELPER FUNCTIONS ------------------//
//-------------------------------------------------------------------//


//-------------------------------------------------------------------//
//--------------- START OF CODE FOR LOAD CELL CONTROL ---------------//
//-------------------------------------------------------------------//

void initScale()
{
  scale.set_scale(200);
  scale.tare();
  int i = 0;
  while (i < 10) {
    //Serial.println(i);
    updateLeds();
    Serial.println(scale.get_units());
    i++;
  }
  scale.tare();
}

void calibrateScale()
{
  scale.set_scale();
  scale.tare();
  Serial.println("place item on scale");
  #ifdef USE_WIFI
  sendData(0,1);
  #endif
  delay(3000);
  Serial.print("The value that should be devided by the weight of the object is: ");
  
  //Serial.println(scale.get_units(10));
  #ifdef USE_WIFI
  sendData(scale.get_units(10),1);
  #endif
  Serial.println("the above value should be set with set_scale");
  delay(10000);
}

/*
 * Handle the scale value and set appropriate state.
 */
void handleScale() {
  weight = scale.get_units();
  /*if (weight < 0) {
    weight = 0;
  }*/
  Serial.println(weight);

  if (state != assistance) {
    if (weight < wNoGlass) {
      setState(1);
    } else if (weight < wLowContent) {
      setState(3);
    } else if (weight < wContent) {
      setState(2);
    } else if (weight > wContent && prevWeight > wContent) {
      setState(4);
      #ifdef USE_WIFI
      needAssist = 1;
      #endif
    }
    prevWeight = weight;
  }
 
  #ifdef USE_WIFI
  if (tareCounter % 10 == 0){
    sendData(weight, needAssist);
  }
  #endif
}

//-------------------------------------------------------------------//
//---------------- END OF CODE FOR LOAD CELL CONTROL ----------------//
//-------------------------------------------------------------------//

//
//

//-------------------------------------------------------------------//
//------------------ START OF CODE FOR LED CONTROL ------------------//
//-------------------------------------------------------------------//

void  updateLeds() { // call the pattern currently being created
  if (millis() - lastUpdate > patternInterval) {
    switch (state) {
      case 0: // Initalize state
        loading(leds.Color(0, 0, 255)); // Blue
        break;
      case 1: // No glass state
        colorTransition(200, 150, 0); // Yellow
        break;
      case 2: // Glass with content
        colorTransition(0, 255, 0); // Green
        break;
      case 3: // Glass with low content
        colorTransition(255, 0, 0); // red
        break;
      case 4: // Need assistance
        loading(leds.Color(192, 10, 47)); // Magenta
        break;
    }
  }
}

void colorWipe(uint32_t c) { // modified from Adafruit example to make it a state machine
  static int i = 0;
  leds.setPixelColor(i, c);
  leds.show();
  i++;
  if (i >= leds.numPixels()) {
    i = 0;
    wipe(); // blank out leds
  }
  lastUpdate = millis(); // time for next change to the display
}

void loading(uint32_t c) { // modified from Adafruit example to make it a state machine
  static int i = 0;
  wipe();
  leds.setPixelColor(i, c);
  leds.setPixelColor((i+1)%leds.numPixels(), c);
  leds.setPixelColor((i+leds.numPixels()/2)%leds.numPixels(), c);
  leds.setPixelColor((i+1+leds.numPixels()/2)%leds.numPixels(), c);
  leds.show();
  i++;
  if (i >= leds.numPixels()) {
    i = 0;
    wipe(); // blank out leds
  }
  lastUpdate = millis(); // time for next change to the display
}
void colorTransition(int r, int g, int b) {

    if(cR != r || cG != g || cB != b){
      // Check and set R
      if(cR < r) {
        cR += colorStep;
        if(cR > 255){
          cR = 255;
          }
        } else {
          cR -= colorStep;
          if (cR < 0){
            cR = 0;
          }
       }
       // Check and set G
       if(cG < g) {
        cG += colorStep;
        if(cG > 255){
          cG = 255;
          }
        } else {
          cG -= colorStep;
          if (cG < 0){
            cG = 0;
          }
       }
       // Check and set B
       if(cB < b) {
        cB += colorStep;
        if(cB > 255){
          cB = 255;
          }
        } else {
          cB -= colorStep;
          if (cB < 0){
            cB = 0;
          }
        }

       int step = 3;
       //if (cR + cG + cB < 256){
       // step = 2;
       // }
       wipe(); // blank out leds
       // set the leds to the current transitioning color 
       for(int x = 0; x < leds.numPixels(); x+=step) {
        leds.setPixelColor(x, leds.Color(cR, cG, cB));
       }
       leds.show();
     }
     lastUpdate = millis(); // time for next change to the display
  }

void staticLight(uint32_t c) {  //12 of 24 leds light up at once, added loop
  wipe();
  for (int i = 0; i < leds.numPixels(); i+=2) {
    leds.setPixelColor(i, c);
  }
  leds.show();
}

void staticLowLight(uint32_t c) {
  wipe();
  leds.setPixelColor(0, c);
  leds.setPixelColor(4, c);
  leds.setPixelColor(8, c);
  leds.setPixelColor(12, c);
  leds.setPixelColor(16, c);
  leds.setPixelColor(20, c);
  leds.show();
}
void wipe() { // clear all LEDs
  for (int i = 0; i < leds.numPixels(); i++) {
    leds.setPixelColor(i, leds.Color(0, 0, 0));
  }
}

uint32_t Wheel(byte WheelPos) {
  WheelPos = 255 - WheelPos;
  if (WheelPos < 85) {
    return leds.Color(255 - WheelPos * 3, 0, WheelPos * 3);
  }
  if (WheelPos < 170) {
    WheelPos -= 85;
    return leds.Color(0, WheelPos * 3, 255 - WheelPos * 3);
  }
  WheelPos -= 170;
  return leds.Color(WheelPos * 3, 255 - WheelPos * 3, 0);
}


// splitColor() - Receive a uint32_t value, and spread into bits.
uint8_t splitColor ( uint32_t c, char value )
{
  switch ( value ) {
    case 'r': return (uint8_t)(c >> 16);
    case 'g': return (uint8_t)(c >>  8);
    case 'b': return (uint8_t)(c >>  0);
    default:  return 0;
  }
}

//-------------------------------------------------------------------//
//------------------- END OF CODE FOR LED CONTROL -------------------//
//-------------------------------------------------------------------//

//
//

//-------------------------------------------------------------------//
//--------------------- START OF CODE FOR WIFI ----------------------//
//-------------------------------------------------------------------//

#ifdef USE_WIFI
/*
   Init wifi
*/
void initWifi() {
  // We start by connecting to a WiFi network
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  // Wait until connection is established
  while (WiFi.status() != WL_CONNECTED) {
    delay(50);
    Serial.print(".");
    updateLeds();
  }
  // We are good to go!
  setState(1);
  Serial.println("\nWiFi connected! Beginning UDP server!");
  Udp.begin(port);
}

/*
   Read data from the server if there are any
*/
char* readData() {
  // if there's data available, read a packet
  int packetSize = Udp.parsePacket();
  if (packetSize) {
    char buffer[bufferSize];
    // Remove scrap!
    for (int i = 0; i <= bufferSize; i++) {
      buffer[i] = 0;
    }
    int len = Udp.read(buffer, bufferSize);
    if (len > 0) {
      buffer[len] = 0;
    }
    return buffer;
  }
}
/*
   Send weight and attention to server
*/
void sendData(int weight, int attention) {
  String temp = "c" + cId + "w" + weight + "a" + attention;
  int size = sizeof(temp) + 1;
  char send[size];
  temp.toCharArray(send, size);
  Serial.println("Sendning message:");
  Serial.println(send);
  Udp.beginPacket(ip, port); //start udp packet
  Udp.write(send);
  Udp.endPacket(); // end packet
}

/*
  Handle data from interface
*/
void handleData(char* data) {
  String command = data;

  // Attention Reset
  if (command == "arst") {
    Serial.println("Handle reset!");
    needAssist = 0;
    stateDelay = delayLimit; // to force state change
    // To remove errors for the revert back out of assistance state
    int temp = scale.read();
    weight = temp;
    initialWeightState = temp;
    setState(2);
    // Set color to off to get a fade in when the new state is selected.
    cR = 0;
    cG = 0;
    cB = 0;
  } else if (command == "tare") {
    scale.tare();
    Serial.println("got tare instruction");
  } else if (command != "") {
    scale.set_scale(command.toInt()); 
    Serial.print("Set scale to: ");   
    Serial.println(command);
  }
}

#endif // USE_WIFI

//-------------------------------------------------------------------//
//---------------------- END OF CODE FOR WIFI -----------------------//
//-------------------------------------------------------------------//
