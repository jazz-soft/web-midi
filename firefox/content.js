console.log('web-midi extension works!');

function web_midi() {
  return new Promise(function(resolve, reject) {
    reject('broken!');
  });
}

if (!navigator.requestMIDIAccess) {
  var script = document.createElement("script");
  script.textContent = "navigator.requestMIDIAccess = " + web_midi.toString();
  document.documentElement.appendChild(script);
}
