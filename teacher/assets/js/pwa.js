if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const swUrl = new URL('../../service-worker.js', import.meta.url);
      await navigator.serviceWorker.register(swUrl, { scope: new URL('../../', import.meta.url).pathname });
    } catch (error) {
      console.warn('EqualLearn service worker was not registered:', error);
    }
  });
}
