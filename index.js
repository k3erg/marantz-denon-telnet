/**
    @fileoverview Control marantz and Denon AVR's by telnet.

    @author Mike Kronenberg <mike.kronenberg@kronenberg.org> (http://www.kronenberg.org)
    @license MIT
*/


/**
    Function called when a command is run, and data returned.
    @callback defaultCallback
    @param {Error} error NULL or Error object, if command failed
    @param {null|Object|Array|boolean} data Array with returned data or NULL if command failed
 */



var telnet = require('telnet-client');



/**
    Returns an instance of MarantzDenonTelnet that can handle telnet commands to the given IP.
    @constructor
    @param {string} ip Address of the AVR.
 */
var MarantzDenonTelnet = function(ip) {
    this.connectionparams = {
        host: ip,
        port: 23,
        timeout: 1000, //  The RESPONSE should be sent within 200ms of receiving the request COMMAND. (plus network delay)
        sendTimeout: 1200,
        negotiationMandatory: false
    };
    this.cmdCue = [];
    this.connection = null;
};



/**
    Extract information from returned data arrays.
    @param {Array} zoneInfo for Example ['Z240', 'SVOFF', 'Z2ON', 'Z2NET', 'Z240']
    @return {Object} {PW: string, SI: string, SV: string, VL: string}
 */
MarantzDenonTelnet.prototype.parseZoneInfo = function(zoneInfo) {
    var i;
    var ret = {};

    for (i = 0; i < zoneInfo.length; i++) {
        var item = zoneInfo[i];
        var id = item.substr(0, 2);
        var payLoad = item.substr(2);
        if (item.substr(0, 1) === 'Z') {
            if (payLoad.match(/^[0-9]*$/)) {
                ret['VL'] = payLoad;
            } else if (item.substr(2).match(/(ON|OFF)/)) {
                ret['PW'] = payLoad;
            } else {
                ret['SI'] = payLoad;
            }
        } else if (id === 'MV' && payLoad.substr(0, 3) != 'MAX') {
            ret['VL'] = payLoad;
        } else if (id === 'SI') {
            ret['SI'] = payLoad;
        } else if (id === 'SV') {
            ret['SV'] = payLoad;
        }
    }
    return ret;
};



/**
    Works thru Telnet cue.
 */
MarantzDenonTelnet.prototype.sendNextTelnetCueItem = function() {
    var mdt = this;

    if (this.cmdCue.length) {
        if (!this.connection) {
            this.connection = new telnet();
            this.connection.on('connect', function() {
                mdt.sendNextTelnetCueItem();
            });
            this.connection.connect(this.connectionparams);
        } else {
            var item = this.cmdCue.shift();
            var isRequestCommand = (item.cmd.substr(-1) === '?');
            this.connection.send(item.cmd, {timeout: (isRequestCommand ? this.connectionparams.timeout : 10)}, function(error, data) {
                if (typeof data === 'string') {
                    data = data.trim().split('\r');
                    for (var i = 0; i < data.lengt; i++) {                      // sanitize data
                        data[i] = data[i].trim();
                    }
                } else if (error && !isRequestCommand && error.message === 'response not received') { // if it is no 'request COMMAND' the AVR will not respond
                    data = [];
                    error = null;
                }
                item.callback(error, data);
                setTimeout(function() {                                         // Send the COMMAND in 50ms or more intervals.
                    mdt.sendNextTelnetCueItem();
                }, 50);
            });
        }
    } else {
        this.connection.end();
        this.connection = null;
    }
};

/**
    Low level method to add a command to the Telnet cue.
    @param {string} cmd Telnet command
    @param {defaultCallback} callback Function to be called when the command is run, and data returned
 */
MarantzDenonTelnet.prototype.telnet = function(cmd, callback) {
    this.cmdCue.push({'cmd': cmd, 'callback': callback});
    if (!this.connection) {
        this.sendNextTelnetCueItem();
    }
};





/**
    Send raw Telnet codes to the AVR.
    @see marantz Telnet Reference {@link http://www.us.marantz.com/DocumentMaster/US/Marantz_FY16_AV_SR_NR_PROTOCOL_V01(2).xls}
    @param {string} cmd Telnet command
    @param {defaultCallback} callback Function to be called when the command is run, and data returned
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.cmd('PW?' function(error, data) {console.log('Power is: ' + data);});
 */
MarantzDenonTelnet.prototype.cmd = function(cmd, callback) {
    this.telnet(cmd, function(error, data) {
        if (!error) {
            callback(null, data);
        } else {
            callback(error);
        }
    });
};



/**
    Get the currently selected input of a zone.
    Telnet Command examples: SI?, Z2SOURCE
    @param {defaultCallback} callback Function to be called when the command is run, and data returned. Will return one or more of: 'CD', 'SPOTIFY', 'CBL/SAT', 'DVD', 'BD', 'GAME', 'GAME2', 'AUX1',
    'MPLAY', 'USB/IPOD', 'TUNER', 'NETWORK', 'TV', 'IRADIO', 'SAT/CBL', 'DOCK',
    'IPOD', 'NET/USB', 'RHAPSODY', 'PANDORA', 'LASTFM', 'IRP', 'FAVORITES', 'SERVER'
    @param {?string} zone NULL or ZM for MAIN ZONE, Z1 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getInput(function(error, data) {console.log('Input is: ' + data);}, 'ZM');
 */
MarantzDenonTelnet.prototype.getInput = function(callback, zone) {
    var mdt = this;
    var commandPrefix = (!zone || (zone == 'ZM')) ? 'SI' : zone;

    this.telnet(commandPrefix + '?', function(error, data) {
        if (!error) {
            var parsedData = mdt.parseZoneInfo(data);
            callback(null, {SI: parsedData['SI'], SV: parsedData['SV']});
        } else {
            callback(error);
        }
    });
};



/**
    Select the input of a zone.
    Telnet Command examples: SIMPLAY, Z2MPLAY, Z3CD
    @param {string} input Supported values: 'CD', 'SPOTIFY', 'CBL/SAT', 'DVD', 'BD', 'GAME', 'GAME2', 'AUX1',
    'MPLAY', 'USB/IPOD', 'TUNER', 'NETWORK', 'TV', 'IRADIO', 'SAT/CBL', 'DOCK',
    'IPOD', 'NET/USB', 'RHAPSODY', 'PANDORA', 'LASTFM', 'IRP', 'FAVORITES', 'SERVER'
    @param {defaultCallback} callback Function to be called when the command is run, and data returned
    @param {?string} zone NULL or ZM for MAIN ZONE, Z1 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setInput('MPLAY', function(error, data) {console.log('Input of MAIN ZONE is set to: ' + data);});
 */
MarantzDenonTelnet.prototype.setInput = function(input, callback, zone) {
    var commandPrefix = (!zone || (zone == 'ZM')) ? 'SI' : zone;

    this.telnet(commandPrefix + input, function(error, data) {
        if (!error) {
            callback(null);
        } else {
            callback(error);
        }
    });
};



/**
    Get the current mute state of a zone.
    Defaults MAIN ZONE, if no zone set.
    Telnet Command examples: SIMPLAY, Z2MPLAY, Z3CD
    @param {defaultCallback} callback Function to be called when the command is run, and data returned
    @param {?string} zone NULL or ZM for MAIN ZONE, Z1 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getMuteState(function(error, data) {console.log('Zone Zone 1 is ' + (data ? 'muted' : 'unmuted') + '.';}, 'Z1');
// Zone Zone 1 is (un)muted.
 */
MarantzDenonTelnet.prototype.getMuteState = function(callback, zone) {
    var commandPrefix = (!zone || (zone == 'ZM')) ? '' : zone;

    this.telnet(commandPrefix + 'MU?', function(error, data) {
        if (!error) {
            callback(null, (data[0] == commandPrefix + 'MUON'));
        } else {
            callback(error);
        }
    });
};



/**
    Set the mute state of a zone.
    Defaults MAIN ZONE, if no zone set.
    Telnet Command examples: MUON, MUOFF, Z2MUON, Z3MUOFF
    @param {boolean} muteState TRUE for muted
    @param {defaultCallback} callback Function to be called when the command is run, and data returned
    @param {?string} zone NULL or ZM for MAIN ZONE, Z1 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setMuteState(true, function(error, data) {console.log('Sent mute command to Zone 2.');}, 'Z2');
// Sent mute command to Zone 2.
 */
MarantzDenonTelnet.prototype.setMuteState = function(muteState, callback, zone) {
    var commandPrefix = (!zone || (zone == 'ZM')) ? '' : zone;

    this.telnet(commandPrefix + 'MU' + (muteState ? 'ON' : 'OFF'), function(error, data) {
        if (!error) {
            callback(null, muteState);
        } else {
            callback(error);
        }
    });
};



/**
    Get the current power state of the AVR.
    Telnet Command examples: PW?
    @param {defaultCallback} callback Function to be called when the command is run, and data returned
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getPowerState(function(error, data) {console.log('AVR is powered' + (data ? 'on' : 'off') + '.';});
// AVR is powered on|off.
 */
MarantzDenonTelnet.prototype.getPowerState = function(callback) {
    this.telnet('PW?', function(error, data) {
        if (!error) {
            callback(null, (data[0] == 'PWON'));
        } else {
            callback("Can't connect to device: " + error, false);
        }
    });
};



/**
    Sets the power state of the AVR.
    Telnet Command examples: PWON, PWSTANDBY (threr is no PWOFF!)
    @param {boolean} powerState - TRUE to power the AVR on
    @param {defaultCallback} callback Function to be called when the command is run, and data returned
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setPowerState(false, function(error, data) {console.log('Sent power off command to AVR.');});
// Sent power off command to AVR.
 */
MarantzDenonTelnet.prototype.setPowerState = function(powerState, callback) {
    this.telnet('PW' + (powerState ? 'ON' : 'STANDBY'), function(error, data) {
        if (!error) {
            callback(null, powerState);
        } else {
            callback(error);
        }
    });
};



/**
    Get the current volume of a zone.
    There is no MAIN ZONE Volue, its handled by the Mastervolume (MV)
    Telnet Command examples: MV10, Z215
    @param {defaultCallback} callback Function to be called when the command is run, and data returned
    @param {?string} zone NULL or ZM for MAIN ZONE, Z1 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getVolume(function(error, data) {console.log('Volume of MAIN ZONE is ' + data + '.';});
// Volume of MAIN ZONE is 20.
 */
MarantzDenonTelnet.prototype.getVolume = function(callback, zone) {
    var mdt = this;
    var commandPrefix = (!zone || (zone == 'ZM')) ? 'MV' : zone;

    this.telnet(commandPrefix + '?', function(error, data) {
        if (!error) {
            callback(null, parseInt((mdt.parseZoneInfo(data)['VL'] + '0').substring(0, 3), 10) * 0.1);
        } else {
            callback(error);
        }
    });
};



/**
    Set the playback volume of a zone.
    There is no MAIN ZONE Volue, its handled by the Mastervolume (MV)
    Telnet Command examples: MV20, Z230, Z340
    @param {number} volume 0-100
    @param {defaultCallback} callback Function to be called when the command is run, and data returned
    @param {?string} zone NULL or ZM for MAIN ZONE, Z1 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setVolume(30, function(error, data) {console.log('Sent command to set Zone 2 volume to 30.');}, 'Z1');
// ent command to set Zone 2 volume to 30.
 */
MarantzDenonTelnet.prototype.setVolume = function(volume, callback, zone) {
    var commandPrefix = (!zone || (zone == 'ZM')) ? 'MV' : zone;
    var vol = (volume * 10).toFixed(0);  //volume fix

    if (vol < 100) {
        vol = '0' + vol;
    } else {
        vol = '' + vol;
    }
    this.telnet(commandPrefix + vol, function(error, data) {
        if (!error) {
            callback(null, volume);
        } else {
            callback(error);
        }
    });
};



/**
    Get all supported zones of the AVR.
    @param {defaultCallback} callback Function to be called when the command is run, and data returned
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getZones(function(error, data) {console.log('Zones: ' + JSON.stringify(data);});
// Zones: {Z1: 'MAIN ZONE', Z1: 'ZONE1', Z2: 'ZONE2'}
*/
MarantzDenonTelnet.prototype.getZones = function(callback) {
    var mdt = this;
    var zoneIds = ['ZM', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7', 'Z8', 'Z9'];
    var zones = {};

    // get number of zones (PW? -> ["PWON","Z2ON","Z3ON"])
    var handleZoneIds = function(err, data) {
        if (data) {
            for (i = 0; i < data.length; i++) {
                zones[zoneIds[i]] = zoneIds[i];
            }
        }
        mdt.telnet('RR?', handleZoneNames);
    };

    // Try to get zone names supported by recent AVR (RR? -> ["R1MAIN ZONE ","R2ZONE2     ","R3ZONE3"])
    var handleZoneNames = function(err, data) {
        var zoneName;
        if (data) {
            for (i = 0; i < data.length; i++) {
                zoneName = data[i].trim().substr(2);
                zones[zoneIds[i]] = zoneName;
            }
        }
        callback(null, zones);                                                  // whatever happens, we finally go on
    };

    this.telnet('PW?', handleZoneIds);
};



/**
    Returns the current power state of a zone.
    Telnet Command examples: PW?, Z2?, Z3?
    @param {defaultCallback} callback Function to be called when the command is run, and data returned
    @param {string} zone NULL or ZM for MAIN ZONE, Z1 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getZonePowerState(function(error, data) {console.log('Zone 2 is powered ' + (data ? 'on' : 'off') + '.';}, 'Z2');
// Zone 2 is powered on|off.
 */
MarantzDenonTelnet.prototype.getZonePowerState = function(callback, zone) {
    var commandPrefix = (!zone || (zone == 'ZM')) ? 'ZM' : zone;

    this.telnet(commandPrefix + '?', function(error, data) {
        if (!error) {
            callback(null, (data[0] == commandPrefix + 'ON'));
        } else {
            callback(error);
        }
    });
};



/**
    Sets the power state of a zone.
    Telnet Command examples: PWON, PWSTANDBY, Z2ON, Z3OFF
    @param {boolean} powerState TRUE to power on
    @param {defaultCallback} callback Function to be called when the command is run, and data returned
    @param {string} zone NULL or ZM for MAIN ZONE, Z1 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setZonePowerState(false, function(error, data) {console.log('Sent power off command to Zone 1.');}, 'Z1');
// Sent power off command to Zone 1.
 */
MarantzDenonTelnet.prototype.setZonePowerState = function(powerState, callback, zone) {
    var commandPrefix = (!zone || (zone == 'ZM')) ? 'MV' : zone;

    this.telnet(commandPrefix + (powerState ? 'ON' : 'OFF'), function(error, data) {
        if (!error) {
            callback(null, powerState);
        } else {
            callback(error);
        }
    });
};



/**
    Export.
*/
module.exports = MarantzDenonTelnet;
