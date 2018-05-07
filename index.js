/**
    @fileoverview Find Denon and marantz devices advertising their services by upnp.

    @author Mike Kronenberg <mike.kronenberg@kronenberg.org> (http://www.kronenberg.org)
*/



var telnet = require('telnet-client');



/**
    Returns an instance of MarantzDenonTelnet that can handle telnet commands to the given IP.
    @constructor
    @param {string} ip .
 */
var MarantzDenonTelnet = function(ip) {
    this.connectionparams = {
        host: ip,
        port: 23,
        timeout: 1500,
        sendTimeout: 200,
        negotiationMandatory: false
    };
    this.cmdCue = [];
    this.connection = null;
};



/**
    Work thru Telnet cue
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
            this.connection.send(item.cmd, function(error, data) {
                if (data) {
                    data = data.trim().split('\r');
                }
                console.log('data: ' + item.cmd + ' ' + data);
                item.callback(error, data);
                mdt.sendNextTelnetCueItem();
            });
        }
    } else {
        this.connection.end();
        this.connection = null;
    }
};



/**
    Returns the current power state of the AVR
    @param {string} cmd
    @param {Function} callback
 */
MarantzDenonTelnet.prototype.telnet = function(cmd, callback) {
    this.cmdCue.push({'cmd': cmd, 'callback': callback});
    if (!this.connection) {
        this.sendNextTelnetCueItem();
    }
};






/**
    Directly send codes to the AVR.
    For Code reference see: http://us.marantz.com/DocumentMaster/US/Marantz_AV_SR_NR_PROTOCOL_V02.xls
    @param {string} cmd
    @param {Function} callback
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
    Get the currently selected input of the AVR's MAIN ZONE. Possible values are:
    'CD', 'SPOTIFY', 'CBL/SAT', 'DVD', 'BD', 'GAME', 'GAME2', 'AUX1',
    'MPLAY', 'USB/IPOD', 'TUNER', 'NETWORK', 'TV', 'IRADIO', 'SAT/CBL', 'DOCK',
    'IPOD', 'NET/USB', 'RHAPSODY', 'PANDORA', 'LASTFM', 'IRP', 'FAVORITES', 'SERVER'
    @param {Function} callback
    @param {Function} callback
 */
MarantzDenonTelnet.prototype.getInput = function(callback) {
    this.telnet('SI?', function(error, data) {
        if (!error) {
            callback(null, data);
        } else {
            callback(error);
        }
    });
};



/**
    Select the input of the AVR's MAIN ZONE. Possible values are:
    'CD', 'SPOTIFY', 'CBL/SAT', 'DVD', 'BD', 'GAME', 'GAME2', 'AUX1',
    'MPLAY', 'USB/IPOD', 'TUNER', 'NETWORK', 'TV', 'IRADIO', 'SAT/CBL', 'DOCK',
    'IPOD', 'NET/USB', 'RHAPSODY', 'PANDORA', 'LASTFM', 'IRP', 'FAVORITES', 'SERVER'
    @param {string} input
    @param {Function} callback
 */
MarantzDenonTelnet.prototype.setInput = function(input, callback) {
    this.telnet('SI' + input, function(error, data) {
        if (!error) {
            callback(null);
        } else {
            callback(error);
        }
    });
};



/**
    Returns the current mute state of the AVR's MAIN ZONE.
    @param {Function} callback
 */
MarantzDenonTelnet.prototype.getMuteState = function(callback) {
    this.telnet('MU?', function(error, data) {
        if (!error) {
            callback(null, (data[0] == 'PWON'));
        } else {
            callback(error);
        }
    });
};



/**
    set the mute state of the AVR's MAIN ZONE.
    @param {boolean} muteState
    @param {Function} callback
 */
MarantzDenonTelnet.prototype.setMuteState = function(muteState, callback) {
    this.telnet('MU' + (muteState ? 'ON' : 'OFF'), function(error, data) {
        if (!error) {
            callback(null, muteState);
        } else {
            callback(error);
        }
    });
};



/**
    Returns the current power state of the AVR's MAIN ZONE.
    @param {Function} callback
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
    Sets the power state of the AVR's MAIN ZONE.
    @param {boolean} powerState - true or false
    @param {Function} callback
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
    Returns the current volume of the AVR's MAIN ZONE (with volume fix)
    @param {Function} callback
 */
MarantzDenonTelnet.prototype.getVolume = function(callback) {
    this.telnet('MV?', function(error, data) {
        if (!error) {
            callback(null, parseInt((data[0] + '0').substring(2, 5), 10) * 0.1);
        } else {
            callback(error);
        }
    });
};



/**
    Set the playback volume of the AVR's MAIN ZONE.
    The volume fix sets the volume to the volume the display shows
    @param {number} volume
    @param {Function} callback
 */
MarantzDenonTelnet.prototype.setVolume = function(volume, callback) {
    var vol = (volume * 10).toFixed(0);  //volume fix
    if (vol < 100) {
        vol = '0' + vol;
    } else {
        vol = '' + vol;
    }
    this.telnet('MV' + vol, function(error, data) {
        if (!error) {
            callback(null, volume);
        } else {
            callback(error);
        }
    });
};



/**
    Get all supported zones of the AVR.
    @param {Function} callback .
*/
MarantzDenonTelnet.prototype.getZones = function(callback) {
    var zoneIds = ['ZM', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7', 'Z8', 'Z9'];
    var zones = {};

    // get number of zones (PW? -> ["PWON","Z2ON","Z3ON"])
    var handleZoneIds = function(err, data) {
        if (data) {
            for (i = 0; i < data.length; i++) {
                zones[zoneIds[i]] = zoneIds[i];
            }
        }
        platform.telnet('RR?', handleZoneNames);
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

    platform.telnet('PW?', handleZoneIds);
};



/**
    Export.
*/
module.exports = MarantzDenonTelnet;
