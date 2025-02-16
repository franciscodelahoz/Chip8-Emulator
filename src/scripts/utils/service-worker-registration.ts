const registerServiceWorker = (): void => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').then(() => {
      console.log('SW registered');
    })
      .catch((registrationError: unknown) => {
        console.error(`SW registration failed: ${JSON.stringify(registrationError)}`);
      });
  }
};

window.addEventListener('load', () => {
  registerServiceWorker();
});
