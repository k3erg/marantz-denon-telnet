[![NPM](https://nodei.co/npm/marantz-denon-telnet.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/marantz-denon-telnet/)



# marantz-denon-telnet
npm package to control marantz and Denon AVR over good ol' telnet.



## What does this package do?
This package allows to control your marantz or Denon AVR over telnet. It was written to support the [homebridge-marantz-denon-telnet](https://www.npmjs.com/package/homebridge-marantz-denon-telnet) package. You might want to install the [marantz-denon-upnpdiscovery](https://www.npmjs.com/package/marantz-denon-upnpdiscovery) package as well, if you don't like to lookup your AVR's IP address by hand.



## What parts of the protocol are covered by this package?
This packages only supports *COMMAND* and *RESPONSE* for now. *EVENTS* that get triggered by *COMMANDS* are omitted.
I.e. a connection to the AVR is opened to issue one or several *COMMANDS* and as soon as the last *RESPONSE* is in, it will be closed.
Further, this package will create a fifo-buffer that cues all commands, sent to the AVR. This is to respect the timeouts and intervals defined in the marantz and DENON AVR protocol and somewhat syncronise the *request COMMAND* and *RESPONSE* play. Consider, that you can only have one connection open to an AVR at the same time.

### marantz and DENON AVR control protocol
According to the [Denon AVR control protocol](http://www.us.marantz.com/DocumentMaster/US/Marantz_FY16_AV_SR_NR_PROTOCOL_V01%282%29.xls) the following three data forms are defined:

Form | Purpose
--- | ---
COMMAND | The message sent to a system(AVR) from a controller(Touch Panel etc.)<br>A command to a system is given from a controller.<br>Send the COMMAND in **50ms or more intervals**.
EVENT | The message sent to a controller (Touch Panel etc.) from a system (AVR)<br>The result is sent, when a system is operated directly and a state changes<br>The EVENT should be sent within **5 seconds after the state of the system (AVR) is changed**.<br /> * The form of EVENT presupposes that it is the same as that of COMMAND.<br> * Refer to the following table for the contents of COMMAND and EVENT.
RESPONSE | The message sent to a controller (Touch Panel etc.) from a system (AVR)<br>if the ‘request command’ (COMMAND+? +CR (0x0D)) has came from a controller.<br>The RESPONSE should be sent within **200ms of receiving the request COMMAND**<br> * The form of RESPONSE presupposes that it is the same as that of EVENT.




## How to Install this package?
npm install marantz-denon-telnet



## How to use this package?

### Issue a plain *COMMAND*
Simple *COMMANDS* just tell the AVR to do something. No data is returned by the callback , if the command was transfered succesfully. If not, the error-object for the callback is populated.

```javascript
var MarantzDenonTelnet = require('marantz-denon-telnet');
var mdt = new MarantzDenonTelnet(DEVICE_IP); // get an instance for a device at IP XXX.XXX.XXX.XXX
mdt.cmd('PWON', function(error, ret) {console.log((error ? error : 'Sent command to turn AVR on.');}); // turns the device on
// ['Sent command to turn AVR on.']
```

### Issue a plain *request COMMAND*
If issuing a *request COMMAND* (*COMMAND* that ends with a ```?``` and expect a *RESPONSE*), the callback will return an array with  string for every line of the *RESPONSE*.

```javascript
var MarantzDenonTelnet = require('marantz-denon-telnet');
var mdt = new MarantzDenonTelnet(DEVICE_IP); // get an instance for a device at IP XXX.XXX.XXX.XXX
mdt.cmd('PW?', function(error, ret) {console.log(ret);}); // is the device turned on?
// ['PWON']
```

### Using the higher level API
A growing number of getter and setter methods like ```getPowerState()```, ```setVolume()```, ```setInput()``` are available, just checkout the [API documentation](docs/API.md).



## Tested on?

 * marantz SR7011
 * Denon AVR-4310
 * Denon AVR-X1400H



 ## Contributors
  * [@k3erg](https://github.com/k3erg)
  * [@ascl00](https://github.com/ascl00)



enjoy!
