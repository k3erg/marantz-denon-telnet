/**
    @fileoverview Control marantz and Denon AVR's by telnet.

    @author Mike Kronenberg <mike.kronenberg@kronenberg.org> (http://www.kronenberg.org)
    @license MIT
*/


/**
    Function called when a command is run and data is returned.
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
        negotiationMandatory: false,
        ors: '\r', // Set outbound record separator
        irs: '\r'
    };
    this.cmdCue = [];
    this.connection = null;
};



/**
    Search for the required information in returned data array, as they may contain additional and random data from EVENTs.
    @param {Array} data Array of possible responses
    @param {RegExp} regexp to test against
    @return {!string} found string or false
 */
MarantzDenonTelnet.prototype.parseSimpleResponse = function(data, regexp) {
    var i;
    var ret = false;
    var r = false;

    for (i = 0; i < data.length; i++) {
        if (r = regexp.exec(data[i])) {
            return r[1];
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
            this.connection.on('error', function() {
                // There must be an item on the cmdCue, else we wouldn't be here...
                // and node.js barfs if we don't catch this error. So lets catch it
                // and use the first item in the cmdCue's error handler.
                // Only quetion is, should we remove it from the queue or not?
                mdt.cmdCue[0].callback('Failed to connect', null);
                mdt.connection.end();
                mdt.connection = null;
            });
            this.connection.connect(this.connectionparams);
        } else {
            var item = this.cmdCue.shift();
            var isRequestCommand = (item.cmd.substr(-1) === '?');
            var send_options = {timeout: (isRequestCommand ? this.connectionparams.timeout : 10)};
            if (typeof item.waitfor !== 'undefined') {
                send_options.waitfor = item.waitfor;
            }
            this.connection.send(item.cmd, send_options, function(error, data) {
//if (isRequestCommand) console.log(`\n\n\n${item.cmd}:${JSON.stringify(data)}`);
                if (typeof data === 'string') {
                    data = data.trim().split('\r');
                    for (var i = 0; i < data.length; i++) {                     // sanitize data
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
    @param {defaultCallback} callback Function to be called when the command is run and data is returned
    @param {?RegExp} waitfor Wait for this regexp to fulfill instead of a timeout.
 */
MarantzDenonTelnet.prototype.telnet = function(cmd, callback, waitfor) {
    this.cmdCue.push({'cmd': cmd, 'callback': callback, 'waitfor': waitfor});
    if (!this.connection) {
        this.sendNextTelnetCueItem();
    }
};



/**
    Send raw Telnet codes to the AVR.
    @see marantz Telnet Reference {@link http://www.us.marantz.com/DocumentMaster/US/Marantz_FY16_AV_SR_NR_PROTOCOL_V01(2).xls}
    @param {string} cmd Telnet command
    @param {defaultCallback} callback Function to be called when the command is run and data is returned
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.cmd('PW?', function(error, data) {console.log('Power is: ' + data);});
// Power is: [PWON,Z2ON,Z3ON|PWSTANDBY]
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
    @param {defaultCallback} callback Function to be called when the command is run and data is returned. Will return one or more of: 'CD', 'SPOTIFY', 'CBL/SAT', 'DVD', 'BD', 'GAME', 'GAME2', 'AUX1',
    'MPLAY', 'USB/IPOD', 'TUNER', 'NETWORK', 'TV', 'IRADIO', 'SAT/CBL', 'DOCK',
    'IPOD', 'NET/USB', 'RHAPSODY', 'PANDORA', 'LASTFM', 'IRP', 'FAVORITES', 'SERVER'
    @param {?string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getInput(function(error, data) {console.log('INPUT of MAIN ZONE is: ' + JSON.stringify(data));}, 'ZM');
// INPUT of MAIN ZONE is: "MPLAY"
 */
MarantzDenonTelnet.prototype.getInput = function(callback, zone) {
    var mdt = this;
    var commandPrefix = (!zone || (zone == 'ZM')) ? 'SI' : zone;
    var regexp = RegExp('(?:^|[\r])' + commandPrefix + '([^O0-9]+[^NF]+)');

    this.telnet(commandPrefix + '?', function(error, data) {
        if (!error) {
            if (ret = mdt.parseSimpleResponse(data, regexp)) {
                callback(null, ret);
            } else {
                callback('MarantzDenonTelnet: Did not get RESPONSE in time.');
            }
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
    @param {defaultCallback} callback Function to be called when the command is run and data is returned
    @param {?string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setInput('MPLAY', function(error, data) {console.log('Set INPUT of MAIN ZONE to MPLAY.');});
// Set INPUT of MAIN ZONE to MPLAY.
 */
MarantzDenonTelnet.prototype.setInput = function(input, callback, zone) {
    var commandPrefix = (!zone || (zone == 'ZM')) ? 'SI' : zone;

    this.telnet(commandPrefix + input, function(error, data) {
        if (!error) {
            callback(null, data);
        } else {
            callback(error);
        }
    });
};



/**
    Get the current mute state of a zone.
    Defaults MAIN ZONE, if no zone set.
    Telnet Command examples: SIMPLAY, Z2MPLAY, Z3CD
    @param {defaultCallback} callback Function to be called when the command is run and data is returned
    @param {?string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getMuteState(function(error, data) {console.log('MUTE state of ZONE2 is: ' + (data ? 'ON' : 'OFF'));}, 'Z2');
// MUTE state of ZONE2 is: [ON|OFF]
 */
MarantzDenonTelnet.prototype.getMuteState = function(callback, zone) {
    var mdt = this;
    var commandPrefix = (!zone || (zone == 'ZM')) ? '' : zone;
    var regexp = RegExp('(?:^|[\r])' + commandPrefix + 'MU(ON|OFF)');

    this.telnet(commandPrefix + 'MU?', function(error, data) {
        var ret;

        if (!error) {
            if (ret = mdt.parseSimpleResponse(data, regexp)) {
                callback(null, (ret == 'ON'));
            } else {
                callback('MarantzDenonTelnet: Did not get RESPONSE in time.');
            }
        } else {
            callback(error);
        }
    }, regexp);
};



/**
    Set the mute state of a zone.
    Defaults MAIN ZONE, if no zone set.
    Telnet Command examples: MUON, MUOFF, Z2MUON, Z3MUOFF
    @param {boolean} muteState TRUE for muted
    @param {defaultCallback} callback Function to be called when the command is run and data is returned
    @param {?string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setMuteState(true, function(error, data) {console.log('Set MUTE state of ZONE2 to ON.');}, 'Z2');
// Set MUTE state of ZONE2 to ON.
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
    @param {defaultCallback} callback Function to be called when the command is run and data is returned
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getPowerState(function(error, data) {console.log('POWER state of AVR is: ' + (data ? 'ON' : 'OFF'))});
// POWER state of AVR is: [ON|OFF]
 */
MarantzDenonTelnet.prototype.getPowerState = function(callback) {
    var mdt = this;
    var regexp = RegExp(/PW(ON|OFF)/);

    this.telnet('PW?', function(error, data) {
        var ret;

        if (!error) {
            if (ret = mdt.parseSimpleResponse(data, regexp)) {
                callback(null, (ret == 'ON'));
            } else {
                callback('MarantzDenonTelnet: Did not get RESPONSE in time.');
            }
        } else {
            callback("Can't connect to device: " + error, false);
        }
    }, regexp);
};



/**
    Sets the power state of the AVR.
    Telnet Command examples: PWON, PWSTANDBY (threr is no PWOFF!)
    @param {boolean} powerState - TRUE to power the AVR on
    @param {defaultCallback} callback Function to be called when the command is run and data is returned
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setPowerState(false, function(error, data) {console.log('Sent power off command to AVR.');});
// Set POWER state of AVR to ON.
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
    Get the currently selected SMART SELECT of a zone.
    Telnet Command examples: MSSMART ?, Z2SMART ?
    @param {defaultCallback} callback Function to be called when the command is run and data is returned.
    @param {?string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getSmartSelect(function(error, data) {console.log('SMART SELECT is: ' + JSON.stringify(data));}, 'SMART');
// SMART SELECT is: "0"
 */
MarantzDenonTelnet.prototype.getSmartSelect = function(callback, zone) {
    var mdt = this;
    var commandPrefix = (!zone || (zone == 'ZM')) ? 'MS' : zone;
    var regexp = RegExp('(?:^|[\r])' + commandPrefix + 'SMART(.*)');

    this.telnet(commandPrefix + 'SMART ?', function(error, data) {
        var ret;

        if (!error) {
            if (ret = mdt.parseSimpleResponse(data, regexp)) {
                callback(null, ret);
            } else {
                callback('MarantzDenonTelnet: Did not get RESPONSE in time.');
            }
        } else {
            callback(error);
        }
    }, regexp);
};



/**
    Select the SMART SELECT of a zone.
    Telnet Command examples: SMART1, SMART2
    @param {number} input Supported values: 1 ... 5
    @param {defaultCallback} callback Function to be called when the command is run and data is returned
    @param {?string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setSmartSelect(1, function(error, data) {console.log('Set SMART SELECT of MAIN ZONE to 1.');});
// Set SMART SELECT of MAIN ZONE to 1.
 */
MarantzDenonTelnet.prototype.setSmartSelect = function(input, callback, zone) {
    var commandPrefix = (!zone || (zone == 'ZM')) ? 'MS' : zone;

    this.telnet(commandPrefix + 'SMART' + input, function(error, data) {
        if (!error) {
            callback(null, data);
        } else {
            callback(error);
        }
    });
};



/**
    Store current setup to SMART SELECT of a zone.
    Telnet Command examples: SMART1 MEMORY, SMART2 MEMORY
    @param {number} input Supported values: 1 ... 5
    @param {defaultCallback} callback Function to be called when the command is run and data is returned
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.storeSmartSelect(1, function(error, data) {console.log('Store current settings to SMART SELECT of MAIN ZONE.');});
// Store current settings to SMART SELECT of MAIN ZONE.
 */
MarantzDenonTelnet.prototype.storeSmartSelect = function(input, callback) {
    var commandPrefix = (!zone || (zone == 'ZM')) ? 'MS' : zone;

    this.telnet(commandPrefix + 'SMART' + input + ' MEMORY', function(error, data) {
        if (!error) {
            callback(null, data);
        } else {
            callback(error);
        }
    });
};



/**
    Get the currently selected video source.
    Telnet Command examples: SV?
    @param {defaultCallback} callback Function to be called when the command is run and data is returned. Will return one or more of:
    'DVD', 'BD', 'TV', 'SAT/CBL', 'MPLAY', 'GAME', 'AUX1', 'AUX2', 'AUX3', 'AUX4'
     'AUX5', 'AUX6', 'AUX7', 'CD', 'SOURCE', 'ON', 'OFF'
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getVideoSelect(function(error, data) {console.log('VIDEO SELECT of MAIN ZONE is: ' + JSON.stringify(data));}, 'ZM');
// VIDEO SELECT is: "OFF"
 */
MarantzDenonTelnet.prototype.getVideoSelect = function(callback) {
    var mdt = this;
    var regexp = RegExp('(?:^|[\r])SV(.*)');

    this.telnet('SV?', function(error, data) {
        var ret;

        if (!error) {
            if (ret = mdt.parseSimpleResponse(data, regexp)) {
                callback(null, ret);
            } else {
                callback('MarantzDenonTelnet: Did not get RESPONSE in time.');
            }
        } else {
            callback(error);
        }
    }, regexp);
};



/**
    Select the video source.
    Telnet Command examples: SVBD, SVDVD, SVCD
    @param {string} input Supported values: 'DVD', 'BD', 'TV', 'SAT/CBL', 'MPLAY',
    'GAME', 'AUX1', 'AUX2', 'AUX3', 'AUX4', 'AUX5', 'AUX6', 'AUX7', 'CD', 'SOURCE', 'ON', 'OFF'
    @param {defaultCallback} callback Function to be called when the command is run and data is returned
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setVideoSelect('MPLAY', function(error, data) {console.log('Set VIDEO SELECT of MAIN ZONE to MPLAY.');});
// Set VIDEO SELECT to MPLAY.
 */
MarantzDenonTelnet.prototype.setVideoSelect = function(input, callback) {
    this.telnet('SV' + input, function(error, data) {
        if (!error) {
            callback(null, data);
        } else {
            callback(error);
        }
    });
};



/**
    Get the current volume of a zone.
    There is no MAIN ZONE Volue, its handled by the Mastervolume (MV)
    Telnet Command examples: MV10, Z215
    @param {defaultCallback} callback Function to be called when the command is run and data is returned
    @param {?string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getVolume(function(error, data) {console.log('VOLUME of MAIN ZONE is: ' + data);}, 'ZM');
// VOLUME of MAIN ZONE is: [0-100]
 */
MarantzDenonTelnet.prototype.getVolume = function(callback, zone) {
    var mdt = this;
    var commandPrefix = (!zone || (zone == 'ZM')) ? 'MV' : zone;
    var regexp = RegExp('(?:^|[\r])' + commandPrefix + '(\\d+)');

    this.telnet(commandPrefix + '?', function(error, data) {
        var ret;

        if (!error) {
            if (ret = mdt.parseSimpleResponse(data, regexp)) {
                callback(null, parseInt((ret + '0').substr(0, 3), 10) * 0.1);
            } else {
                callback('MarantzDenonTelnet: Did not get RESPONSE in time.');
            }
        } else {
            callback(error);
        }
    }, regexp);
};



/**
    Set the playback volume of a zone.
    There is no MAIN ZONE Volue, its handled by the Mastervolume (MV)
    Telnet Command examples: MV20, Z230, Z340
    @param {number} volume 0-100
    @param {defaultCallback} callback Function to be called when the command is run and data is returned
    @param {?string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setVolume(30, function(error, data) {console.log('Set VOLUME of MAIN ZONE to 30.');}, 'ZM');
// Set VOLUME of MAIN ZONE to 30.
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
    @param {defaultCallback} callback Function to be called when the command is run and data is returned
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getZones(function(error, data) {console.log('Available Zones: ' + JSON.stringify(data));});
// Available Zones: {"ZM":"MAIN ZONE","Z2":"ZONE2","Z3":"ZONE3"}
*/
MarantzDenonTelnet.prototype.getZones = function(callback) {
    var mdt = this;
    var zoneIds = ['', 'ZM', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7', 'Z8', 'Z9'];
    var zones = {};

    // get number of zones (PW? -> ["PWON","Z2ON","Z3ON"])
    var handleZoneIds = function(err, data) {
        var regexp = RegExp(/(Z\d)ON/);
        var ret;

        if (data) {
            for (i = 0; i < data.length; i++) {
                if (ret = regexp.exec(data[i])) {
                    zones[ret[1]] = ret[1];
                } else if (data[i] == 'PWON') {
                    zones['ZM'] = 'ZM';
                }
            }
        }
        mdt.telnet('RR?', handleZoneNames);
    };

    // Try to get zone names supported by recent AVR (RR? -> ["R1MAIN ZONE ","R2ZONE2     ","R3ZONE3"])
    var handleZoneNames = function(err, data) {
        var regexp = RegExp(/R(\d)(.*)/);
        var ret;
        var zoneName;

        if (data) {
            for (i = 0; i < data.length; i++) {
                if (ret = regexp.exec(data[i])) {
                    zoneName = data[i].trim().substr(2);
                    zones[zoneIds[parseInt(ret[1], 10)]] = zoneName;
                }
            }
        }
        callback(null, zones);                                                  // whatever happens, we finally go on
    };

    this.telnet('PW?', handleZoneIds);
};



/**
    Returns the current power state of a zone.
    Telnet Command examples: PW?, Z2?, Z3?
    @param {defaultCallback} callback Function to be called when the command is run and data is returned
    @param {string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.getZonePowerState(function(error, data) {console.log('POWER state of ZONE3 is: ' + (data ? 'ON' : 'OFF'));}, 'Z3');
// POWER state of ZONE3 is: [ON|OFF]
 */
MarantzDenonTelnet.prototype.getZonePowerState = function(callback, zone) {
    var mdt = this;
    var commandPrefix = (!zone || (zone == 'ZM')) ? 'ZM' : zone;
    var regexp = RegExp('(?:^|[\r])' + commandPrefix + '(ON|OFF)');

    this.telnet(commandPrefix + '?', function(error, data) {
        var ret;

        if (!error) {
            if (ret = mdt.parseSimpleResponse(data, regexp)) {
                callback(null, (ret == 'ON'));
            } else {
                callback('MarantzDenonTelnet: Did not get RESPONSE in time.');
            }
        } else {
            callback(error);
        }
    }, regexp);
};



/**
    Sets the power state of a zone.
    Telnet Command examples: PWON, PWSTANDBY, Z2ON, Z3OFF
    @param {boolean} powerState TRUE to power on
    @param {defaultCallback} callback Function to be called when the command is run and data is returned
    @param {string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
    @example
var mdt = new MarantzDenonTelnet('127.0.0.1');
mdt.setZonePowerState(false, function(error, data) {console.log('Set POWER state of ZONE3 to OFF.');}, 'Z3');
// Set POWER state of ZONE3 to OFF.
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
