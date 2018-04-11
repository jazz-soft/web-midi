if (!navigator.requestMIDIAccess) {
  var script = document.createElement("script");
  script.textContent = "JZZ = (" + _JZZ.toString() + ")(); navigator.requestMIDIAccess = JZZ.requestMIDIAccess;";
  document.documentElement.appendChild(script);
}
