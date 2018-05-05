# marantz-denon-telnet
npm package to control marantz and Denon AVR over good ol' telnet.

## What does this package do?
This package allows to control your marantz or Denon AVR over telnet.

## How to Install this package?
npm install marantz-denon-telnet
a

## How to use this package?

```javascript



var MarantzDenonTelnet = require('marantz-denon-telnet');
/**
    Returns an instance of MarantzDenonTelnet that can handle telnet commands to the given IP.
    @constructor
    @param {string} ip .
 */
var mdt = new MarantzDenonTelnet(device.ip); // get an instance for a device at IP XXX.XXX.XXX.XXX



/**
    Directly send codes to the AVR.
    For Code reference see: http://us.marantz.com/DocumentMaster/US/Marantz_AV_SR_NR_PROTOCOL_V02.xls
    @param {string} cmd
    @param {Function} callback
 */
mdt.cmd('PW?', function(error, ret) {console.log(ret);}); // is the device turned on?
// true | false



/**
    Get the currently selected input of the AVR. Possible values are: 'SI' +
    'CD', 'SPOTIFY', 'CBL/SAT', 'DVD', 'BD', 'GAME', 'GAME2', 'AUX1',
    'MPLAY', 'USB/IPOD', 'TUNER', 'NETWORK', 'TV', 'IRADIO', 'SAT/CBL', 'DOCK',
    'IPOD', 'NET/USB', 'RHAPSODY', 'PANDORA', 'LASTFM', 'IRP', 'FAVORITES', 'SERVER'
    @param {Function} callback
 */
mdt.getInput(function(error, ret) {console.log(ret);});
// [ 'SIMPLAY', 'SVOFF' ]



/**
    Select the input of the AVR. Possible values are:
    'CD', 'SPOTIFY', 'CBL/SAT', 'DVD', 'BD', 'GAME', 'GAME2', 'AUX1',
    'MPLAY', 'USB/IPOD', 'TUNER', 'NETWORK', 'TV', 'IRADIO', 'SAT/CBL', 'DOCK',
    'IPOD', 'NET/USB', 'RHAPSODY', 'PANDORA', 'LASTFM', 'IRP', 'FAVORITES', 'SERVER'
    @param {string} input
    @param {Function} callback
 */
mdt.setInput('MPLAY', function(error, ret) {console.log(ret);}); // set the current imput to Mediaplayer
// true | false



/**
    Returns the current mute state of the AVR
    @param {Function} callback
 */
mdt.setMuteState(function(error, ret) {console.log(ret);});
// true | false



/**
    set the mute state of the AVR
    @param {boolean} muteState
    @param {Function} callback
 */
mdt.setMuteState(true, function(error, ret) {console.log(ret);});
// true | false



/**
    Returns the current power state of the avr
    @param {string} cmd
    @param {Function} callback
 */
mdt.getPowerState(function(error, ret) {console.log(ret);}); // is the device turned on?
// true | false



/**
    Sets the power state of the AVR.
    @param {boolean} powerState - true or false
    @param {Function} callback
 */
mdt.setPowerState(false, function(error, ret) {console.log(ret);}); // turn device off
// true | false



/**
    Returns the current mute state of the AVR.
    @param {Function} callback
 */
mdt.getMuteState(function(error, ret) {console.log(ret);}); // is the device turned on?
// true | false



/**
    set the mute state of the AVR
    @param {boolean} muteState
    @param {Function} callback
 */
mdt.setMuteState(true, function(error, ret) {console.log(ret);}); // mute device
// true | false



/**
    Returns the current volume of the AVR (with volume fix)
    @param {Function} callback
 */
mdt.getVolume(function(error, ret) {console.log(ret);});
// 50.5



/**
    Set the playback volume.
    The volume fix sets the volume to the volume the display shows
    @param {number} volume
    @param {Function} callback
 */
mdt.setVolume(51, function(error, ret) {console.log(ret);});



/**
    Get all supported zones of the AVR.
    @param {Function} callback .
*/
mdt.getZones(function(error, ret) {console.log(ret);});
// ["R1MAIN ZONE","R2ZONE2","R3ZONE3"]



```

### Tested on?

marantz SR7011



enjoy!
