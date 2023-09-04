export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').then(() => {
      console.log('SW registered');
    }).catch(registrationError => {
      console.error(`SW registration failed: ${JSON.stringify(registrationError)}`);
    });
  }
}
