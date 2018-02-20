function web_midi() {
  var midi_access;
  var msg;
  var installed;
  var resume;
  var pool = [];
  var outputArr = [];
  var inputArr = [];
  var outputMap = {};
  var inputMap = {};
  var outputUUID = {};
  var inputUUID = {};
  var _onstatechange;
  function newPlugin() {
    var plugin = { id: pool.length };
    if (!plugin.id) plugin.ready = true;
    else document.dispatchEvent(new CustomEvent('jazz-midi', { detail: ['new'] }));
    pool.push(plugin);
  }
  function refresh() {
    document.dispatchEvent(new CustomEvent('jazz-midi', { detail: ['refresh'] }));
  }
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

  function getOutput(a) {
    var impl = outputMap[a.name];
    if (!impl) {
      if (pool.length <= outputArr.length) newPlugin();
      var plugin = pool[outputArr.length];
      impl = {
        name: a.name,
        port: new MIDIOutput(a),
        plugin: plugin
      };
      plugin.output = impl;
      outputArr.push(impl);
      outputMap[a.name] = impl;
    }
    return impl.port;
  }

  function getInput(a) {
    var impl = inputMap[a.name];
    if (!impl) {
      if (pool.length <= inputArr.length) newPlugin();
      var plugin = pool[inputArr.length];
      impl = {
        name: a.name,
        port: new MIDIInput(a),
        plugin: plugin
      };
      plugin.input = impl;
      inputArr.push(impl);
      inputMap[a.name] = impl;
    }
    return impl.port;
  }

  function tryPort(port) {
    return new Promise(function(resolve, reject) {
      function returnPort() { resolve(port); }
      port.open().then(returnPort, returnPort);
    });
  }

  function listener(e) {
    var v = msg.innerText.split('\n');
    var impl, i, j;
    msg.innerText = '';
    for (i = 0; i < v.length; i++) {
      var a = [];
      try { a = JSON.parse(v[i]);} catch (err) {}
      if (!a.length) continue;
      if (a[0] === 'refresh') {
        if (!midi_access) {
          midi_access = new MIDIAccess();
        }
        var outputs = new Map();
        var inputs = new Map();
        if (a[1].ins) {
          for (j = 0; j < a[1].ins.length; j++) {
            var port = getInput(a[1].ins[j]);
            inputs.set(port.id, port);
          }
        }
        if (a[1].outs) {
          for (j = 0; j < a[1].outs.length; j++) {
            var port = getOutput(a[1].outs[j]);
            outputs.set(port.id, port);
          }
        }
        var changed = [];
        var promises = [];
        inputs.forEach(function(port) {
          if (!midi_access.inputs.has(port.id)) {
            changed.push(port);
            promises.push(tryPort(port));
          }
        });
        outputs.forEach(function(port) {
          if (!midi_access.outputs.has(port.id)) {
            changed.push(port);
            promises.push(tryPort(port));
          }
        });
        midi_access.inputs.forEach(function(port) {
          if (!inputs.has(port.id)) {
            changed.push(port);
            port.close();
          }
        });
        midi_access.outputs.forEach(function(port) {
          if (!outputs.has(port.id)) {
            changed.push(port);
            port.close();
          }
        });
        if (changed.length) {
          midi_access.inputs = inputs;
          midi_access.outputs = outputs;
          Promise.all(promises).then(function(x) {
            return function() {
              if (_onstatechange) {
                for (var i = 0; i < x.length; i++) {
                  _onstatechange(new MIDIConnectionEvent(x[i], midi_access));
                }
              }
              if (resume) {
                resume(midi_access);
                resume = undefined;
              }
            };
          }(changed));
        }
        else { // first time and empty
          if (resume) {
            resume(midi_access);
            resume = undefined;
          }
        }
      }
      else if (a[0] === 'openout') {
        impl = pool[a[1]].output;
        impl.promise = undefined;
        if (impl) {
          if (a[2] == impl.name) {
            if (!impl.open) {
              impl.open = true;
              impl.port.state = 'connected';
              impl.port.connection = 'open';
              if (impl.onstatechange) impl.onstatechange(new MIDIConnectionEvent(impl.port, impl.port));
            }
            if (impl.resolve) impl.resolve(impl.port);
          }
          else {
            if (impl.open) {
              impl.open = false;
              impl.port.state = 'disconnected';
              impl.port.connection = 'closed';
              if (impl.onstatechange) impl.onstatechange(new MIDIConnectionEvent(impl.port, impl.port));
            }
            if (impl.reject) impl.reject();
          }
        }
      }
      else if (a[0] === 'openin') {
        impl = pool[a[1]].input;
        impl.promise = undefined;
        if (impl) {
          if (a[2] == impl.name) {
            if (!impl.open) {
              impl.open = true;
              impl.port.state = 'connected';
              impl.port.connection = 'open';
              if (impl.onstatechange) impl.onstatechange(new MIDIConnectionEvent(impl.port, impl.port));
            }
            if (impl.resolve) impl.resolve(impl.port);
          }
          else {
            if (impl.open) {
              impl.open = false;
              impl.port.state = 'disconnected';
              impl.port.connection = 'closed';
              if (impl.onstatechange) impl.onstatechange(new MIDIConnectionEvent(impl.port, impl.port));
            }
            if (impl.reject) impl.reject();
          }
        }
      }
      else if (a[0] === 'midi') {
        impl = pool[a[1]].input;
        if (impl) {
          impl.port.onmidimessage(new MIDIMessageEvent(impl.port, Uint8Array.from(a.slice(3))));
        }
      }
    }
  }

  function MIDIAccess() {
    var watcher;
    this.sysexEnabled = true;
    this.outputs = new Map();
    this.inputs = new Map();
    Object.defineProperty(this, 'onstatechange', {
      get() { return _onstatechange; },
      set(value) {
        if (value instanceof Function) {
          if (!_onstatechange) {
            watcher = setInterval(refresh, 250);
          }
          _onstatechange = value;
        }
        else {
          if (_onstatechange) {
            clearInterval(watcher);
            _onstatechange = undefined;
          }
        }
      }
    });
  }
  MIDIAccess.prototype.onstatechange = function() {};

  function MIDIConnectionEvent(port, target) {
    this.bubbles = false;
    this.cancelBubble = false;
    this.cancelable = false;
    this.currentTarget = target;
    this.defaultPrevented = false;
    this.eventPhase = 0;
    this.path = [];
    this.port = port;
    this.returnValue = true;
    this.srcElement = target;
    this.target = target;
    this.timeStamp = Date.now();
    this.type = 'statechange';
  }

  function MIDIMessageEvent(port, data) {
    this.bubbles = false;
    this.cancelBubble = false;
    this.cancelable = false;
    this.currentTarget = port;
    this.data = data;
    this.defaultPrevented = false;
    this.eventPhase = 0;
    this.path = [];
    this.receivedTime = Date.now();
    this.returnValue = true;
    this.srcElement = port;
    this.target = port;
    this.timeStamp = this.receivedTime;
    this.type = 'midimessage';
  }

  function MIDIOutput(a) {
    var self = this;
    this.type = 'output';
    this.name = a.name;
    this.manufacturer = a.manufacturer;
    this.version = a.version;
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
    var self = this;
    return new Promise(function(resolve, reject) {
      var impl = outputMap[self.name];
      impl.resolve = resolve;
      impl.reject = reject;
      document.dispatchEvent(new CustomEvent('jazz-midi', { detail: ['openout', impl.plugin.id, impl.name] }));
    });
  };
  MIDIOutput.prototype.close = function() {
    var impl = outputMap[this.name];
    if (impl.open) {
      impl.open = false;
      this.state = 'disconnected';
      this.connection = 'closed';
      document.dispatchEvent(new CustomEvent('jazz-midi', { detail: ['closeout', impl.plugin.id, impl.name] }));
      if (impl.onstatechange) impl.onstatechange(new MIDIConnectionEvent(this, this));
    }
    return this;
  };
  MIDIOutput.prototype.clear = function() {};
  MIDIOutput.prototype.send = function(data, timestamp) {
    var impl = outputMap[this.name];
    var v = ['play', impl.plugin.id];
    for (var i = 0; i < data.length; i++) {
      if (data[i] == Math.floor(data[i]) && data[i] >=0 && data[i] <= 255) v.push(data[i]);
      else return;
    }
    if (timestamp > performance.now()) {
      setTimeout(function() {
        document.dispatchEvent(new CustomEvent('jazz-midi', { detail: v }));
      }, timestamp - performance.now()); 
    }
    else document.dispatchEvent(new CustomEvent('jazz-midi', { detail: v }));
  };

  function MIDIInput(a) {
    var self = this;
    this.type = 'input';
    this.name = a.name;
    this.manufacturer = a.manufacturer;
    this.version = a.version;
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
    var self = this;
    return new Promise(function(resolve, reject) {
      var impl = inputMap[self.name];
      impl.resolve = resolve;
      impl.reject = reject;
      document.dispatchEvent(new CustomEvent('jazz-midi', { detail: ['openin', impl.plugin.id, impl.name] }));
    });
  };
  MIDIInput.prototype.close = function() {
    var impl = inputMap[this.name];
    if (impl.open) {
      impl.open = false;
      this.state = 'disconnected';
      this.connection = 'closed';
      document.dispatchEvent(new CustomEvent('jazz-midi', { detail: ['closein', impl.plugin.id, impl.name] }));
      if (impl.onstatechange) impl.onstatechange(new MIDIConnectionEvent(this, this));
    }
    this.onmidimessage = MIDIInput.prototype.onmidimessage;
    return this;
  };

  return new Promise(function(resolve, reject) {
    if (midi_access) resolve(midi_access);
    function initListener(e) {
      installed = true;
      if (!msg) msg = document.getElementById('jazz-midi-msg');
      if (!msg) return;
      var a = [];
      try { a = JSON.parse(msg.innerText);} catch (err) {}
      msg.innerText = '';
      document.removeEventListener('jazz-midi-msg', initListener);
      if (a[0] === 'version') {
        resume = resolve;
        newPlugin();
        refresh();
        document.addEventListener('jazz-midi-msg', listener);
      }
      else reject('Jazz-MIDI extension is not properly installed!')
    }
    document.addEventListener('jazz-midi-msg', initListener);
    document.dispatchEvent(new Event('jazz-midi'));
    setTimeout(function() { if (!installed) reject('Jazz-MIDI extension not found!'); }, 10);
  });
}

if (!navigator.requestMIDIAccess) {
  var script = document.createElement("script");
  script.textContent = "navigator.requestMIDIAccess = " + web_midi.toString();
  document.documentElement.appendChild(script);
}
