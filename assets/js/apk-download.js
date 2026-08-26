const repo = 'https://github.com/Jardeleza0921/equallearn';
const isNetlifyPreview = location.hostname === 'equallearn.netlify.app' || location.hostname.endsWith('--equallearn.netlify.app');
const releaseTag = isNetlifyPreview ? 'mobile-preview' : 'mobile-latest';
const apkUrl = isNetlifyPreview ? '/apk' : `${repo}/releases/download/${releaseTag}/EqualLearn.apk`;
const releaseUrl = `${repo}/releases/tag/${releaseTag}`;

document.querySelectorAll('[data-apk-download]').forEach(link => {
  link.href = apkUrl;
  link.setAttribute('aria-label', isNetlifyPreview ? 'Download EqualLearn preview APK' : 'Download EqualLearn APK');
});
document.querySelectorAll('[data-apk-release]').forEach(link => link.href = releaseUrl);
