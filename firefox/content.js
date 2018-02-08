function web_midi() {
  var midi_access;
  var msg;
  var installed;
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
        console.log('found jazz-midi v.' + a[2]);
        resolve({});
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
