navigator.requestMIDIAccess = function(MIDIOptions) {
  if (typeof JZZ == 'undefined') window.JZZ = (
/* insert here */
  )();
  navigator.requestMIDIAccess = JZZ.requestMIDIAccess;
  return navigator.requestMIDIAccess(MIDIOptions);
}
