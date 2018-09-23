## Classes

<dl>
<dt><a href="#MarantzDenonTelnet">MarantzDenonTelnet</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#defaultCallback">defaultCallback</a> : <code>function</code></dt>
<dd><p>Function called when a command is run and data is returned.</p>
</dd>
</dl>

<a name="MarantzDenonTelnet"></a>

## MarantzDenonTelnet
**Kind**: global class  

* [MarantzDenonTelnet](#MarantzDenonTelnet)
    * [new MarantzDenonTelnet(ip)](#new_MarantzDenonTelnet_new)
    * [.parseZoneInfo(zoneInfo)](#MarantzDenonTelnet+parseZoneInfo) ⇒ <code>Object</code>
    * [.sendNextTelnetCueItem()](#MarantzDenonTelnet+sendNextTelnetCueItem)
    * [.telnet(cmd, callback)](#MarantzDenonTelnet+telnet)
    * [.cmd(cmd, callback)](#MarantzDenonTelnet+cmd)
    * [.getInput(callback, zone)](#MarantzDenonTelnet+getInput)
    * [.setInput(input, callback, zone)](#MarantzDenonTelnet+setInput)
    * [.getMuteState(callback, zone)](#MarantzDenonTelnet+getMuteState)
    * [.setMuteState(muteState, callback, zone)](#MarantzDenonTelnet+setMuteState)
    * [.getPowerState(callback)](#MarantzDenonTelnet+getPowerState)
    * [.setPowerState(powerState, callback)](#MarantzDenonTelnet+setPowerState)
    * [.getVolume(callback, zone)](#MarantzDenonTelnet+getVolume)
    * [.setVolume(volume, callback, zone)](#MarantzDenonTelnet+setVolume)
    * [.getZones(callback)](#MarantzDenonTelnet+getZones)
    * [.getZonePowerState(callback, zone)](#MarantzDenonTelnet+getZonePowerState)
    * [.setZonePowerState(powerState, callback, zone)](#MarantzDenonTelnet+setZonePowerState)


* * *

<a name="new_MarantzDenonTelnet_new"></a>

### new MarantzDenonTelnet(ip)
Returns an instance of MarantzDenonTelnet that can handle telnet commands to the given IP.


| Param | Type | Description |
| --- | --- | --- |
| ip | <code>string</code> | Address of the AVR. |


* * *

<a name="MarantzDenonTelnet+parseZoneInfo"></a>

### marantzDenonTelnet.parseZoneInfo(zoneInfo) ⇒ <code>Object</code>
Extract information from returned data arrays.

**Kind**: instance method of [<code>MarantzDenonTelnet</code>](#MarantzDenonTelnet)  
**Returns**: <code>Object</code> - {PW: string, SI: string, SV: string, VL: string}  

| Param | Type | Description |
| --- | --- | --- |
| zoneInfo | <code>Array</code> | for Example ['Z240', 'SVOFF', 'Z2ON', 'Z2NET', 'Z240'] |


* * *

<a name="MarantzDenonTelnet+sendNextTelnetCueItem"></a>

### marantzDenonTelnet.sendNextTelnetCueItem()
Works thru Telnet cue.

**Kind**: instance method of [<code>MarantzDenonTelnet</code>](#MarantzDenonTelnet)  

* * *

<a name="MarantzDenonTelnet+telnet"></a>

### marantzDenonTelnet.telnet(cmd, callback, waitfor)
Low level method to add a command to the Telnet cue.

**Kind**: instance method of [<code>MarantzDenonTelnet</code>](#MarantzDenonTelnet)  

| Param | Type | Description |
| --- | --- | --- |
| cmd | <code>string</code> | Telnet command |
| callback | [<code>defaultCallback</code>](#defaultCallback) | Function to be called when the command is run and data is returned |
| waitfor | <code>RegExp<code> | waitfor Wait for this regexp to fulfill instead of a timeout. |


* * *

<a name="MarantzDenonTelnet+cmd"></a>

### marantzDenonTelnet.cmd(cmd, callback)
Send raw Telnet codes to the AVR.

**Kind**: instance method of [<code>MarantzDenonTelnet</code>](#MarantzDenonTelnet)  
**See**: marantz Telnet Reference [http://www.us.marantz.com/DocumentMaster/US/Marantz_FY16_AV_SR_NR_PROTOCOL_V01(2).xls](http://www.us.marantz.com/DocumentMaster/US/Marantz_FY16_AV_SR_NR_PROTOCOL_V01(2).xls)  

| Param | Type | Description |
| --- | --- | --- |
| cmd | <code>string</code> | Telnet command |
| callback | [<code>defaultCallback</code>](#defaultCallback) | Function to be called when the command is run and data is returned |

**Example**  
```js
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.cmd('PW?', function(error, data) {console.log('Power is: ' + data);});
// Power is: [PWON,Z2ON,Z3ON|PWSTANDBY]
```

* * *

<a name="MarantzDenonTelnet+getInput"></a>

### marantzDenonTelnet.getInput(callback, zone)
Get the currently selected input of a zone.
    Telnet Command examples: SI?, Z2SOURCE

**Kind**: instance method of [<code>MarantzDenonTelnet</code>](#MarantzDenonTelnet)  

| Param | Type | Description |
| --- | --- | --- |
| callback | [<code>defaultCallback</code>](#defaultCallback) | Function to be called when the command is run and data is returned. Will return one or more of: 'CD', 'SPOTIFY', 'CBL/SAT', 'DVD', 'BD', 'GAME', 'GAME2', 'AUX1',     'MPLAY', 'USB/IPOD', 'TUNER', 'NETWORK', 'TV', 'IRADIO', 'SAT/CBL', 'DOCK',     'IPOD', 'NET/USB', 'RHAPSODY', 'PANDORA', 'LASTFM', 'IRP', 'FAVORITES', 'SERVER' |
| zone | <code>string</code> | NULL or ZM for MAIN ZONE, Z2 ... Zn for all others |

**Example**  
```js
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getInput(function(error, data) {console.log('INPUT of MAIN ZONE is: ' + JSON.stringify(data));}, 'ZM');
// INPUT of MAIN ZONE is: {"SI":"MPLAY","SV":"OFF"}
```

* * *

<a name="MarantzDenonTelnet+setInput"></a>

### marantzDenonTelnet.setInput(input, callback, zone)
Select the input of a zone.
    Telnet Command examples: SIMPLAY, Z2MPLAY, Z3CD

**Kind**: instance method of [<code>MarantzDenonTelnet</code>](#MarantzDenonTelnet)  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>string</code> | Supported values: 'CD', 'SPOTIFY', 'CBL/SAT', 'DVD', 'BD', 'GAME', 'GAME2', 'AUX1',     'MPLAY', 'USB/IPOD', 'TUNER', 'NETWORK', 'TV', 'IRADIO', 'SAT/CBL', 'DOCK',     'IPOD', 'NET/USB', 'RHAPSODY', 'PANDORA', 'LASTFM', 'IRP', 'FAVORITES', 'SERVER' |
| callback | [<code>defaultCallback</code>](#defaultCallback) | Function to be called when the command is run and data is returned |
| zone | <code>string</code> | NULL or ZM for MAIN ZONE, Z2 ... Zn for all others |

**Example**  
```js
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setInput('MPLAY', function(error, data) {console.log('Set INPUT of MAIN ZONE to MPLAY.');});
// Set INPUT of MAIN ZONE to MPLAY.
```

* * *

<a name="MarantzDenonTelnet+getMuteState"></a>

### marantzDenonTelnet.getMuteState(callback, zone)
Get the current mute state of a zone.
    Defaults MAIN ZONE, if no zone set.
    Telnet Command examples: SIMPLAY, Z2MPLAY, Z3CD

**Kind**: instance method of [<code>MarantzDenonTelnet</code>](#MarantzDenonTelnet)  

| Param | Type | Description |
| --- | --- | --- |
| callback | [<code>defaultCallback</code>](#defaultCallback) | Function to be called when the command is run and data is returned |
| zone | <code>string</code> | NULL or ZM for MAIN ZONE, Z2 ... Zn for all others |

**Example**  
```js
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getMuteState(function(error, data) {console.log('MUTE state of ZONE2 is: ' + (data ? 'ON' : 'OFF'));}, 'Z2');
// MUTE state of ZONE2 is: [ON|OFF]
```

* * *

<a name="MarantzDenonTelnet+setMuteState"></a>

### marantzDenonTelnet.setMuteState(muteState, callback, zone)
Set the mute state of a zone.
    Defaults MAIN ZONE, if no zone set.
    Telnet Command examples: MUON, MUOFF, Z2MUON, Z3MUOFF

**Kind**: instance method of [<code>MarantzDenonTelnet</code>](#MarantzDenonTelnet)  

| Param | Type | Description |
| --- | --- | --- |
| muteState | <code>boolean</code> | TRUE for muted |
| callback | [<code>defaultCallback</code>](#defaultCallback) | Function to be called when the command is run and data is returned |
| zone | <code>string</code> | NULL or ZM for MAIN ZONE, Z2 ... Zn for all others |

**Example**  
```js
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setMuteState(true, function(error, data) {console.log('Set MUTE state of ZONE2 to ON.');}, 'Z2');
// Set MUTE state of ZONE2 to ON.
```

* * *

<a name="MarantzDenonTelnet+getPowerState"></a>

### marantzDenonTelnet.getPowerState(callback)
Get the current power state of the AVR.
    Telnet Command examples: PW?

**Kind**: instance method of [<code>MarantzDenonTelnet</code>](#MarantzDenonTelnet)  

| Param | Type | Description |
| --- | --- | --- |
| callback | [<code>defaultCallback</code>](#defaultCallback) | Function to be called when the command is run and data is returned |

**Example**  
```js
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getPowerState(function(error, data) {console.log('POWER state of AVR is: ' + (data ? 'ON' : 'OFF'))});
// POWER state of AVR is: [ON|OFF]
```

* * *

<a name="MarantzDenonTelnet+setPowerState"></a>

### marantzDenonTelnet.setPowerState(powerState, callback)
Sets the power state of the AVR.
    Telnet Command examples: PWON, PWSTANDBY (threr is no PWOFF!)

**Kind**: instance method of [<code>MarantzDenonTelnet</code>](#MarantzDenonTelnet)  

| Param | Type | Description |
| --- | --- | --- |
| powerState | <code>boolean</code> | TRUE to power the AVR on |
| callback | [<code>defaultCallback</code>](#defaultCallback) | Function to be called when the command is run and data is returned |

**Example**  
```js
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setPowerState(false, function(error, data) {console.log('Sent power off command to AVR.');});
// Set POWER state of AVR to ON.
```

* * *

<a name="MarantzDenonTelnet+getVolume"></a>

### marantzDenonTelnet.getVolume(callback, zone)
Get the current volume of a zone.
    There is no MAIN ZONE Volue, its handled by the Mastervolume (MV)
    Telnet Command examples: MV10, Z215

**Kind**: instance method of [<code>MarantzDenonTelnet</code>](#MarantzDenonTelnet)  

| Param | Type | Description |
| --- | --- | --- |
| callback | [<code>defaultCallback</code>](#defaultCallback) | Function to be called when the command is run and data is returned |
| zone | <code>string</code> | NULL or ZM for MAIN ZONE, Z2 ... Zn for all others |

**Example**  
```js
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getVolume(function(error, data) {console.log('VOLUME of MAIN ZONE is: ' + data);}, 'ZM');
// VOLUME of MAIN ZONE is: [0-100]
```

* * *

<a name="MarantzDenonTelnet+setVolume"></a>

### marantzDenonTelnet.setVolume(volume, callback, zone)
Set the playback volume of a zone.
    There is no MAIN ZONE Volue, its handled by the Mastervolume (MV)
    Telnet Command examples: MV20, Z230, Z340

**Kind**: instance method of [<code>MarantzDenonTelnet</code>](#MarantzDenonTelnet)  

| Param | Type | Description |
| --- | --- | --- |
| volume | <code>number</code> | 0-100 |
| callback | [<code>defaultCallback</code>](#defaultCallback) | Function to be called when the command is run and data is returned |
| zone | <code>string</code> | NULL or ZM for MAIN ZONE, Z2 ... Zn for all others |

**Example**  
```js
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setVolume(30, function(error, data) {console.log('Set VOLUME of MAIN ZONE to 30.');}, 'ZM');
// Set VOLUME of MAIN ZONE to 30.
```

* * *

<a name="MarantzDenonTelnet+getZones"></a>

### marantzDenonTelnet.getZones(callback)
Get all supported zones of the AVR.

**Kind**: instance method of [<code>MarantzDenonTelnet</code>](#MarantzDenonTelnet)  

| Param | Type | Description |
| --- | --- | --- |
| callback | [<code>defaultCallback</code>](#defaultCallback) | Function to be called when the command is run and data is returned |

**Example**  
```js
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getZones(function(error, data) {console.log('Available Zones: ' + JSON.stringify(data));});
// Available Zones: {"ZM":"MAIN ZONE","Z2":"ZONE2","Z3":"ZONE3"}
```

* * *

<a name="MarantzDenonTelnet+getZonePowerState"></a>

### marantzDenonTelnet.getZonePowerState(callback, zone)
Returns the current power state of a zone.
    Telnet Command examples: PW?, Z2?, Z3?

**Kind**: instance method of [<code>MarantzDenonTelnet</code>](#MarantzDenonTelnet)  

| Param | Type | Description |
| --- | --- | --- |
| callback | [<code>defaultCallback</code>](#defaultCallback) | Function to be called when the command is run and data is returned |
| zone | <code>string</code> | NULL or ZM for MAIN ZONE, Z2 ... Zn for all others |

**Example**  
```js
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getZonePowerState(function(error, data) {console.log('POWER state of ZONE3 is: ' + (data ? 'ON' : 'OFF'));}, 'Z3');
// POWER state of ZONE3 is: [ON|OFF]
```

* * *

<a name="MarantzDenonTelnet+setZonePowerState"></a>

### marantzDenonTelnet.setZonePowerState(powerState, callback, zone)
Sets the power state of a zone.
    Telnet Command examples: PWON, PWSTANDBY, Z2ON, Z3OFF

**Kind**: instance method of [<code>MarantzDenonTelnet</code>](#MarantzDenonTelnet)  

| Param | Type | Description |
| --- | --- | --- |
| powerState | <code>boolean</code> | TRUE to power on |
| callback | [<code>defaultCallback</code>](#defaultCallback) | Function to be called when the command is run and data is returned |
| zone | <code>string</code> | NULL or ZM for MAIN ZONE, Z2 ... Zn for all others |

**Example**  
```js
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setZonePowerState(false, function(error, data) {console.log('Set POWER state of ZONE3 to OFF.');}, 'Z3');
// Set POWER state of ZONE3 to OFF.
```

* * *

<a name="defaultCallback"></a>

## defaultCallback : <code>function</code>
Function called when a command is run and data is returned.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| error | <code>Error</code> | NULL or Error object, if command failed |
| data | <code>null</code> \| <code>Object</code> \| <code>Array</code> \| <code>boolean</code> | Array with returned data or NULL if command failed |


* * *
