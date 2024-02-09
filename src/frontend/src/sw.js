import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

precacheAndRoute(self.__WB_MANIFEST);

// Respond to navigation requests with the cached HTML entry.
const handler = createHandlerBoundToURL('./index.html');
const navigationRoute = new NavigationRoute(handler);
registerRoute(navigationRoute);

if (process.env.NODE_ENV === 'development') {
  self.addEventListener('install', () => {
    self.skipWaiting();
  });
}
