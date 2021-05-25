/**
 * This JavaScript file contains the magic.
 *
 * iTunes-bridge
 * @author AngryKiller
 * @copyright 2018
 * @license GPL-3.0
 *
 */

var exports = module.exports = {};
var fs = require('fs');
var {execSync} = require('child_process');
var events = require('events');
var event = new events.EventEmitter();
var plist = require('plist');
var path = require('path');
var os = require('os');
var compver = require('compare-versions');


if(process.platform === "darwin"){
    var libPath = path.resolve(os.homedir() + "/Music/iTunes/iTunes Library.xml");
}else if(process.platform === "win32"){
    var libPath = path.resolve(os.homedir() + "/My Music/iTunes/iTunes Library.xml");
}

var that = this;

/** Get informations about the current playing track
 * @returns {object}
 * @example {"name":"Business",
  "artist":"Eminem",
  "album":"The Eminem Show (Explicit Version)",
  "mediaKind":"song",
  "duration":251,
  "elapsedTime":2,
  "remainingTime":249,
  "genre":"Rap/Hip Hop",
  "releaseYear":2002,
  "id":2630,
  "playerState":"playing"}
 */
exports.getCurrentTrack = function () {
    if (exports.isRunning()) {
        try {
            return runScript('getCurrentTrack', 'fetch', undefined, true);
        } catch (e) {
            console.log(e);
        }
    } else {
        return {playerState: "stopped"};
    }
};
/**
 * Get the player state
 * @returns {string} - Possible values: playing, stopped or paused
 * @example "playing"
 */
exports.getPlayerState = function() {
    if (exports.isRunning()) {
        try {
            return runScript('getPlayerState', 'fetch', undefined, false);
        } catch (e) {
            console.log(e);
        }
    } else {
        return "stopped";
    }
};
/**
 * Gets the iTunes sound volume or sets it if there's a parameter (Windows only)
 * @param volume {int} - Windows only
 * @returns {int}
 */
exports.soundVolume = function(volume) {
    if (exports.isRunning()) {
        if(volume !== undefined && !isNaN(volume) && process.platform === "win32"){
            try{
                return runScript('setSoundVolume', 'control', volume);
            }catch(e){
                console.log(e);
            }
        }else{
            try {
                return runScript('getSoundVolume', 'fetch', undefined, false);
            } catch (e) {
                console.log(e);
            }
        }
    }else{
        console.log("iTunes is not running");
    }
};
/**
 * Tells iTunes to play
 */
exports.play = function (song) {
    runScript('play', 'control');
};
/**
 * Tells iTunes to pause
 */
exports.pause = function (){
    runScript('pause', 'control');
};
/**
 * Tells iTunes to stop
 */
exports.stop = function (){
    runScript('stop', 'control');
};
/**
 * Gets informations about a track from the library
 * @param {int} id - The id of the track
 * @returns {object}
 * @example  { 'Track ID': 1428,
     Size: 9019045,
     'Total Time': 217103,
     'Disc Number': 1,
     'Disc Count': 1,
     'Track Number': 14,
     'Track Count': 16,
     Year: 2011,
     BPM: 99,
     'Date Modified': 2018-03-18T22:37:46.000Z,
     'Date Added': 2018-03-24T14:03:15.000Z,
     'Bit Rate': 320,
     'Sample Rate': 44100,
     'Play Count': 3,
     'Play Date': 3604816264,
     'Play Date UTC': 2018-03-25T07:51:04.000Z,
     'Artwork Count': 1,
     'Persistent ID': '535F1580FAEB42E4',
     'Track Type': 'File',
     'File Folder Count': 5,
     'Library Folder Count': 1,
     Name: 'Ils sont cools',
     Artist: 'Orelsan, Gringe',
     'Album Artist': 'Orelsan',
     Album: 'Le chant des sirènes',
     Genre: 'Rap/Hip Hop',
     Kind: 'Fichier audio MPEG',
     'Sort Album': 'chant des sirènes',
     Location: 'file:///Users/steve/Music/iTunes/iTunes%20Media/Music/Orelsan/Le%20chant%20des%20sire%CC%80nes/14%20Ils%20sont%20cools.mp3' }
 */
exports.getTrack = function(id) {
    try {
        var obj = plist.parse(fs.readFileSync(libPath, 'utf8'));
        return obj.Tracks[id];
    }catch(err){
        return "not_found";
    }
};
/**
 * Gets the playlist count from the library
 * @returns {int}
 */
exports.getPlaylistCount = function () {
    try {
        var obj = plist.parse(fs.readFileSync(libPath, 'utf8'));
        return Object.keys(obj.Playlists).length;
    } catch (err) {
        return null;
    }
};
// TODO: Support for arguments in the track count (album, artist, playlist...)
/**
 * Gets the track count from the library
 * @returns {int}
 */
exports.getTrackCount = function () {
    try {
        var obj = plist.parse(fs.readFileSync(libPath, 'utf8'));
        return (Object.keys(obj.Tracks).length + 1);
    } catch (err) {
        return null;
    }
};




// Starting the event system (track change and player state change)
that.currentTrack = null;
setInterval(function () {
    var currentTrack = exports.getCurrentTrack();
    if (currentTrack && that.currentTrack) {
        // On track change
        /**
         * Emits a playing event
         *
         * @fires iTunes-bridge#playing
         */
        if (currentTrack.id !== that.currentTrack.id && currentTrack.playerState === "playing") {
            that.currentTrack = currentTrack;
            /**
             * Playing event
             *
             * @event iTunes-bridge#playing
             * @type {object}
             * @property {string} type - Indicates whenever the player has been resumed or this is a new track being played.
             * @property {object} currentTrack - Gives the current track
             */
            event.emit('playing', 'new_track', currentTrack);
        }
        /**
         * Emits a paused event
         *
         * @fires iTunes-bridge#paused
         */
        else if (currentTrack.id !== that.currentTrack.id && currentTrack.playerState === "paused") {
            that.currentTrack = currentTrack;
            /**
             * Paused event
             *
             * @event iTunes-bridge#paused
             * @type {object}
             * @property {string} type - Indicates whenever the player has been resumed or this is a new track being played.
             * @property {object} currentTrack - Gives the current track
             */
            event.emit('paused', 'new_track', currentTrack);
        }
        /**
         * Emits a stopped event
         *
         * @fires iTunes-bridge#stopped
         */
        else if (currentTrack.id !== that.currentTrack.id && currentTrack.playerState === "stopped") {
            that.currentTrack = {"playerState": "stopped"};
            /**
             * Stopped event.
             *
             * @event iTunes-bridge#stopped
             * @type {object}
             */
            event.emit('stopped');
        }
        // On player state change
        if (currentTrack.playerState !== that.currentTrack.playerState && currentTrack.id === that.currentTrack.id) {
            that.currentTrack.playerState = currentTrack.playerState;
            event.emit(currentTrack.playerState, 'player_state_change', currentTrack);
        }
    } else {
        that.currentTrack = currentTrack;
    }
}, 1500);

exports.emitter = event;

/**
 * Function to know if iTunes is running
 * @returns {boolean} - true or false
 */
exports.isRunning = function() {
    if(process.platform === "darwin") {
        try {
            if(compver.compare(os.release(), '19.0.0', '>=')) {
                execSync('pgrep -x "Music"');
                return true;
            }else{
                execSync(('pgrep -x "iTunes"'));
                return true;
            }
        }
        catch (err) {
            return false;
        }
    }else if(process.platform === "win32"){
        try {
            execSync('tasklist | find "iTunes.exe"');
            return true;
        }
        catch (err) {
            return false;
        }
    }
};


function runScript(req, type, args, isJson) {

    if (process.platform === "darwin"){
            var iTunesCtrlScpt  = path.join(__dirname, '/jxa/iTunesControl.js');
            var iTunesFetcherScpt  = path.join(__dirname, '/jxa/iTunesFetcher.js');
        switch(type){
            case "fetch": {
                if(isJson) {
                    return JSON.parse(execSync('osascript ' +iTunesFetcherScpt+' '  + req));
                }else{
                    return execSync('osascript ' +iTunesFetcherScpt+' ' + req);
                }
                break;
            }
            case "control": {
                try {
                    execSync('osascript '+iTunesCtrlScpt+' ' + req+' '+args);
                }catch(e){
                    console.error(e);
                }
                break;
            }
        }
    } else if (process.platform === "win32") {
            var iTunesCtrlScpt  = path.join(__dirname, '/wscript/iTunesControl.js');
            var iTunesFetcherScpt  = path.join(__dirname, '/wscript/iTunesFetcher.js');
        switch(type){
            case "fetch": {
                if(isJson) {
                    return JSON.parse(execSync('cscript //Nologo ' + iTunesFetcherScpt + ' ' + req, { encoding: 'utf8'}));
                }else{
                    return execSync('cscript //Nologo ' + iTunesFetcherScpt+' ' + req, { encoding: 'utf8'});
                }
                break;
            }
            case "control": {
                try {
                    execSync('cscript //Nologo '+ iTunesCtrlScpt+' ' + req+' '+args);
                }catch(e){
                    console.error(e);
                }
                break;
            }
        }
    }

}

// Sends an event on module load

// If you're wondering why there's a timeout, that's because if you use this in another module, you will require this file AND THEN load the eventemitter, so if these events are emitted immediately, you will never receive them :')
setTimeout(function(){
    switch(exports.getCurrentTrack().playerState){
        case "playing":{
            event.emit('playing', 'new_track', exports.getCurrentTrack());
            break;
        }
        case "paused":{
            event.emit('paused', 'new_track', exports.getCurrentTrack());
            break;
        }
        case "stopped":{
            event.emit('stopped');
            break;
        }
    }
}, 500);
