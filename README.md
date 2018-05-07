# marantz-denon-telnet
npm package to control marantz and Denon AVR over good ol' telnet.



## What does this package do?
This package allows to control your marantz or Denon AVR over telnet. It was written to support the homebridge-marantz-denon-telnet package. You might like the use the marantz-denon-upnpdiscovery package as well, if you don't want to lookup your AVR's IP address by hand.



## How to Install this package?
npm install marantz-denon-telnet



## How to use this package?
[API documentation](docs/API.md)

... and for the impatient:

```javascript
var MarantzDenonTelnet = require('marantz-denon-telnet');
var mdt = new MarantzDenonTelnet(DEVICE_IP); // get an instance for a device at IP XXX.XXX.XXX.XXX
mdt.cmd('PW?', function(error, ret) {console.log(ret);}); // is the device turned on?
// true | false
```



### Tested on?

marantz SR7011



enjoy!
