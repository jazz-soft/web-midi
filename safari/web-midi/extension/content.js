if (document instanceof HTMLDocument && !navigator.requestMIDIAccess) {
  var script = document.createElement("script");
  script.textContent = "\n\n/// begin: [code injected by Web MIDI API browser extension]\nnavigator.requestMIDIAccess=function(MIDIOptions){if(typeof JZZ=='undefined')window.JZZ=(" +
    _JZZ.toString() +
    ")();navigator.requestMIDIAccess = JZZ.requestMIDIAccess;return navigator.requestMIDIAccess(MIDIOptions);}\n/// end: [code injected by Web MIDI API browser extension]\n\n";
  document.documentElement.appendChild(script);
}
