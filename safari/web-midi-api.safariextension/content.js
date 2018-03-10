function web_midi() {
console.log('Initializing Web MIDI API...');
  var midi_access;
  var pool = [];
  var outputArr = [];
  var inputArr = [];
  var outputMap = {};
  var inputMap = {};
  var outputUUID = {};
  var inputUUID = {};

  function generateUUID() {
    var a = new Array(64);
    for (var i = 0; i < 64; i++) {
      a[i] = Math.floor((Math.random() * 16) % 16).toString(16).toUpperCase();
    }
    return a.join('');
  }
  function getUUID(name, input) {
    if (input) {
      if (!inputUUID[name]) inputUUID[name] = generateUUID();
      return inputUUID[name];
    }
    else {
      if (!outputUUID[name]) outputUUID[name] = generateUUID();
      return outputUUID[name];
    }
  }

  function _newPlugin() {
    var plg = document.createElement('object');
    plg.style.visibility = 'hidden';
    plg.style.width = '0px';
    plg.style.height = '0px';
    plg.type = 'audio/x-jazz';
    document.body.appendChild(plg);
    return plg.isJazz ? plg : undefined;
  };

  function MIDIAccess(obj) {
    var watcher;
    this.sysexEnabled = true;
    this.outputs = new Map();
    this.inputs = new Map();
    Object.defineProperty(this, 'onstatechange', {
      get() { return _onstatechange; },
      set(value) {
        if (value instanceof Function) {
          _onstatechange = value;
        }
        else {
          _onstatechange = undefined;
        }
      }
    });
  }
  MIDIAccess.prototype.onstatechange = function() {};

  function notInstalled() {
    var div = document.createElement('div');
    div.innerHTML = 'Web MIDI API extension requires <a href=https://jazz-soft.net style="color:red">Jazz-Plugini</a>!';
    div.style.display = 'inline-block';
    div.style.position = 'fixed';
    div.style.top = '.5em';
    div.style.left = '.5em';
    div.style.padding = '.5em';
    div.style.color = 'red';
    div.style.border = '1px solid';
    div.style.borderRadius = '.5em';
    div.style.backgroundColor = '#ff8';
    div.style.opacity = '.9';
    document.body.appendChild(div);
    setTimeout(function() { document.body.removeChild(div); }, 4000);
  }

  return new Promise(function(resolve, reject) {
    if (midi_access) resolve(midi_access);
    else {
      var div = document.createElement('div');
      div.style.visibility='hidden';
      document.body.appendChild(div);
      var plg = _newPlugin();
      if (plg) {
        midi_access = new MIDIAccess(plg);
        resolve(midi_access);
      }
      else {
        console.log('Web MIDI extension requires Jazz-Plugin!');
        notInstalled();
        reject('Jazz-Plugin not found!');
      }
    }
  });
};

if (!navigator.requestMIDIAccess) {
  var script = document.createElement("script");
  script.textContent = "navigator.requestMIDIAccess = " + web_midi.toString();
  document.documentElement.appendChild(script);
}
