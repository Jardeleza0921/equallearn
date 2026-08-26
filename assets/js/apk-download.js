const host = location.hostname.toLowerCase();
const isNetlify = host === 'equallearn.netlify.app' || host.endsWith('.netlify.app');
const repo = 'https://github.com/Jardeleza0921/equallearn';
const apkUrl = isNetlify ? '/downloads/EqualLearn.apk' : `${repo}/releases/download/mobile-latest/EqualLearn.apk`;

document.querySelectorAll('[data-apk-download]').forEach(link => {
  link.href = apkUrl;
  link.setAttribute('aria-label', isNetlify ? 'Download EqualLearn APK directly from Netlify' : 'Download EqualLearn APK');
  if (isNetlify) link.setAttribute('download', 'EqualLearn.apk');
});

document.querySelectorAll('[data-apk-release]').forEach(link => {
  if (isNetlify) {
    link.href = 'about.html';
    link.removeAttribute('target');
    link.textContent = 'About EqualLearn';
  } else {
    link.href = `${repo}/releases/tag/mobile-latest`;
  }
});
