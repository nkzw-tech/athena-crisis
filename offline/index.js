import { Capacitor, registerPlugin } from '@capacitor/core';

const ReloadWebViewPlugin = registerPlugin('ReloadWebViewPlugin');

let timer;
const reload = () => {
  if (window.$__AC__) {
    window.$__AC__.reload();
    return;
  }

  if (Capacitor.getPlatform() === 'android' && ReloadWebViewPlugin) {
    ReloadWebViewPlugin.reload();
    return;
  }

  if (process.env.CLIENT_URL) {
    location.href = process.env.CLIENT_URL;
  }
};
const setTimer = () => {
  timer = setTimeout(() => {
    if (navigator.onLine) {
      reload();
      timer = null;
    } else {
      setTimer();
    }
  }, 1000);
};

document.getElementById('box').addEventListener('click', reload);
document
  .getElementById('keyart')
  .addEventListener('dragstart', (event) => event.preventDefault());

window.addEventListener('offline', () => {
  clearTimeout(timer);
  timer = null;
});

window.addEventListener('online', () => {
  if (navigator.onLine && !timer) {
    setTimer();
  }
});

if (navigator.onLine) {
  setTimer();
}
