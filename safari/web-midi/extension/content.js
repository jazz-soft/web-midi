var script = document.createElement('script');
script.src = browser.extension.getURL('inject.js');
document.documentElement.appendChild(script);
