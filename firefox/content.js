function web_midi() {
  var midi_access;
  var msg;
  var installed;
  var resume;
  var pool = [];
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
            var port = new MIDIInput(a[1].ins[j]);
            inputs.set(port.id, port);
          }
        }
        if (a[1].outs) {
          for (j = 0; j < a[1].outs.length; j++) {
            var port = new MIDIOutput(a[1].outs[j]);
            outputs.set(port.id, port);
          }
        }
        if (midi_access) {
          midi_access.inputs = inputs;
          midi_access.outputs = outputs;
        }
        else {
          midi_access = new MIDIAccess();
          midi_access.inputs = inputs;
          midi_access.outputs = outputs;
          resume(midi_access);
        }
      }
    }
  }
  function MIDIAccess() {
    this.sysexEnabled = true;
  }
  function MIDIOutput(a) {
    this.type = 'output';
    this.name = a.name;
    this.manufacturer = a.manufacturer;
    this.version = a.version;
    this.id = getUUID(this.name, false);
  }
  function MIDIInput(a) {
    this.type = 'input';
    this.name = a.name;
    this.manufacturer = a.manufacturer;
    this.version = a.version;
    this.id = getUUID(this.name, true);
  }
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
