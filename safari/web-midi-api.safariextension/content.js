function web_midi() {
  alert('Initializing Web MIDI API...');
};

if (!navigator.requestMIDIAccess) {
  var script = document.createElement("script");
  script.textContent = "navigator.requestMIDIAccess = " + web_midi.toString();
  document.documentElement.appendChild(script);
}
