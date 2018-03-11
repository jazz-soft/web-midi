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

  function newPlugin() {
    var plg = document.createElement('object');
    plg.style.visibility = 'hidden';
    plg.style.width = '0px';
    plg.style.height = '0px';
    plg.type = 'audio/x-jazz';
    document.body.appendChild(plg);
    return plg.isJazz ? plg : undefined;
  };

  function getOutput(x) {
    var impl = outputMap[x[0]];
    if (!impl) {
      if (pool.length <= outputArr.length) newPlugin();
      var plugin = pool[outputArr.length];
      impl = {
        name: x[0],
        port: new MIDIOutput(x),
        plugin: plugin
      };
      plugin.output = impl;
      outputArr.push(impl);
      outputMap[x[0]] = impl;
    }
    return impl.port;
  }

  function getInput(x) {
    var impl = inputMap[x[0]];
    if (!impl) {
      if (pool.length <= inputArr.length) newPlugin();
      var plugin = pool[inputArr.length];
      impl = {
        name: x[0],
        port: new MIDIInput(x),
        plugin: plugin
      };
      plugin.input = impl;
      inputArr.push(impl);
      inputMap[x[0]] = impl;
    }
    return impl.port;
  }

  function refresh() {
    var i, x, p;
    var outputs = new Map();
    var inputs = new Map();
    for (i = 0; (x = pool[0].MidiOutInfo(i)).length; i++) {
      p = getOutput(x[i]);
      outputs.set(p.id, p);
    }
    for (i = 0; (x = pool[0].MidiInInfo(i)).length; i++) {
      p = getInput(x[i]);
      inputs.set(p.id, p);
    }
    midi_access.inputs = inputs;
    midi_access.outputs = outputs;
  }

  function MIDIAccess(plg) {
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

  function MIDIOutput(x) {
    var self = this;
    this.type = 'output';
    this.name = x[0];
    this.manufacturer = x[1];
    this.version = x[2];
    this.id = getUUID(this.name, false);
    this.state = 'disconnected';
    this.connection = 'closed';
    Object.defineProperty(this, 'onstatechange', {
      get() { return outputMap[self.name].onstatechange; },
      set(value) {
        if (value instanceof Function) {
          outputMap[self.name].onstatechange = value;
          outputMap[self.name].onstatechange(new MIDIConnectionEvent(self, self));
        }
        else {
          outputMap[self.name].onstatechange = value;
        }
      }
    });
  }
  MIDIOutput.prototype.open = function() {
    var impl = outputMap[this.name];
    if (!impl.open) {
      var s = impl.plugin.MidiOutOpen(this.name);
      if (s == this.name) {
        impl.open = true;
        this.state = 'connected';
        this.connection = 'open';
        //if (impl.onstatechange) impl.onstatechange(new MIDIConnectionEvent(this, this));
      }
      else if (s) impl.plugin.MidiOutClose();
    }
    if (impl.open) return this;
    else return new Promise(function(resolve, reject) { reject(); });
  };
  MIDIOutput.prototype.close = function() {
    var impl = outputMap[this.name];
    if (impl.open) {
      impl.plugin.MidiOutClose();
      impl.open = false;
      this.state = 'disconnected';
      this.connection = 'closed';
      //if (impl.onstatechange) impl.onstatechange(new MIDIConnectionEvent(this, this));
    }
    return this;
  };
  MIDIOutput.prototype.clear = function() {};
  MIDIOutput.prototype.send = function(data, timestamp) {
    var plugin = outputMap[this.name].plugin;
    var v = [];
    for (var i = 0; i < data.length; i++) {
      if (data[i] == Math.floor(data[i]) && data[i] >=0 && data[i] <= 255) v.push(data[i]);
      else return;
    }
    if (timestamp > performance.now()) {
      setTimeout(function() { plugin.MidiOutRaw(v); }, timestamp - performance.now()); 
    }
    else plugin.MidiOutRaw(v);
  };

  function MIDIInput(x) {
    var self = this;
    this.type = 'input';
    this.name = x[0];
    this.manufacturer = x[1];
    this.version = x[2];
    this.id = getUUID(this.name, true);
    this.state = 'disconnected';
    this.connection = 'closed';
    Object.defineProperty(this, 'onstatechange', {
      get() { return inputMap[self.name].onstatechange; },
      set(value) {
        if (value instanceof Function) {
          inputMap[self.name].onstatechange = value;
          inputMap[self.name].onstatechange(new MIDIConnectionEvent(self, self));
        }
        else {
          inputMap[self.name].onstatechange = value;
        }
      }
    });
  }
  MIDIInput.prototype.onmidimessage = function() {};
  MIDIInput.prototype.open = function() {
    var impl = inputMap[this.name];
    if (!impl.open) {
      var s = impl.plugin.MidiInOpen(this.name, function(x){ console.log('midi received:', x); });
      if (s == this.name) {
        impl.open = true;
        this.state = 'connected';
        this.connection = 'open';
        //if (impl.onstatechange) impl.onstatechange(new MIDIConnectionEvent(this, this));
      }
      else if (s) impl.plugin.MidiInClose();
    }
    if (impl.open) return this;
    else return new Promise(function(resolve, reject) { reject(); });
  };
  MIDIInput.prototype.close = function() {
    var impl = inputMap[this.name];
    if (impl.open) {
      impl.plugin.MidiOutClose();
      impl.open = false;
      this.state = 'disconnected';
      this.connection = 'closed';
      //if (impl.onstatechange) impl.onstatechange(new MIDIConnectionEvent(this, this));
    }
    this.onmidimessage = MIDIInput.prototype.onmidimessage;
    return this;
  };

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
      var plg = newPlugin();
      if (plg) {
        pool.push(plg);
        midi_access = new MIDIAccess(plg);
        refresh();
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
