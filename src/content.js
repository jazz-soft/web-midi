if (document instanceof HTMLDocument && !navigator.requestMIDIAccess) {
  var script = document.createElement("script");
  script.textContent = "navigator.requestMIDIAccess=function(){if(typeof JZZ=='undefined')window.JZZ=(" +
    _JZZ.toString() +
    ")();navigator.requestMIDIAccess = JZZ.requestMIDIAccess;return navigator.requestMIDIAccess();}";
  document.documentElement.appendChild(script);
}