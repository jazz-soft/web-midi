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
        if (!midi_access) {
          midi_access = new MIDIAccess();
        }
        midi_access.inputs = inputs;
        midi_access.outputs = outputs;
        var promises = [];
        inputs.forEach(function(port) { promises.push(tryPort(port)); });
        outputs.forEach(function(port) { promises.push(tryPort(port)); });
        Promise.all(promises).then(function() { resume(midi_access); });
      }
      else if (a[0] === 'openout') {
        impl = pool[a[1]].output;
        impl.promise = undefined;
        if (impl) {
          if (a[2] == impl.name) {
            impl.open = true;
            impl.port.state = 'connected';
            impl.port.connection = 'open';
            if (impl.resolve) impl.resolve(impl.port);
          }
          else {
            impl.open = false;
            impl.port.state = 'disconnected';
            impl.port.connection = 'closed';
            if (impl.reject) impl.reject();
          }
        }
      }
      else if (a[0] === 'openin') {
        impl = pool[a[1]].input;
        impl.promise = undefined;
        if (impl) {
          if (a[2] == impl.name) {
            impl.open = true;
            impl.port.state = 'connected';
            impl.port.connection = 'open';
            if (impl.resolve) impl.resolve(impl.port);
          }
          else {
            impl.open = false;
            impl.port.state = 'disconnected';
            impl.port.connection = 'closed';
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
    this.sysexEnabled = true;
  }
  MIDIAccess.prototype.onstatechange = function() {};

  function MIDIConnectionEvent(port) {
    this.bubbles = false;
    this.cancelBubble = false;
    this.cancelable = false;
    this.currentTarget = midi_access;
    this.defaultPrevented = false;
    this.eventPhase = 0;
    this.path = [];
    this.port = port;
    this.returnValue = true;
    this.srcElement = midi_access;
    this.target = midi_access;
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
    this.type = 'output';
    this.name = a.name;
    this.manufacturer = a.manufacturer;
    this.version = a.version;
    this.id = getUUID(this.name, false);
    this.state = 'disconnected';
    this.connection = 'closed';
  }
  MIDIOutput.prototype.onstatechange = function() {};
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
    impl.open = false;
    this.state = 'disconnected';
    this.connection = 'closed';
    document.dispatchEvent(new CustomEvent('jazz-midi', { detail: ['closeout', impl.plugin.id, impl.name] }));
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
    if (timestamp > window.performance.now()) {
      setTimeout(function() {
        document.dispatchEvent(new CustomEvent('jazz-midi', { detail: v }));
      }, timestamp - window.performance.now()); 
    }
    else document.dispatchEvent(new CustomEvent('jazz-midi', { detail: v }));
  };

  function MIDIInput(a) {
    this.type = 'input';
    this.name = a.name;
    this.manufacturer = a.manufacturer;
    this.version = a.version;
    this.id = getUUID(this.name, true);
    this.state = 'disconnected';
    this.connection = 'closed';
  }
  MIDIInput.prototype.onstatechange = function() {};
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
    impl.open = false;
    this.state = 'disconnected';
    this.connection = 'closed';
    document.dispatchEvent(new CustomEvent('jazz-midi', { detail: ['closein', impl.plugin.id, impl.name] }));
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
    window.setTimeout(function() { if (!installed) reject('Jazz-MIDI extension not found!'); }, 10);
  });
}

if (!navigator.requestMIDIAccess) {
  var script = document.createElement("script");
  script.textContent = "navigator.requestMIDIAccess = " + web_midi.toString();
  document.documentElement.appendChild(script);
}
