'use strict';

// jscs:disable requireTrailingComma
self.addEventListener('install', event => {
  let offlineResources = [
    'scripts/main.js',
    'styles/vendor.css',
    'styles/main.css',
    'offline.html',
    'images/497849353.jpg'
  ];

  event.waitUntil(
    caches.open('myOfflineCache').then(cache => {
      return cache.addAll(offlineResources);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      if (event.request.url === 'http://localhost:8080/') {
        return caches.match(new Request('offline.html'));
      } else {
        return caches.match(event.request).then(response => {
          return response;
        });
      }
    })
  );
});

const API_ENDPOINT = 'https://query.yahooapis.com/' +
  'v1/public/yql?q=select%20*%20from%20weather.forecast%20where%' +
  '20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where' +
  '%20text%3D%22london%2C%20uk%22)&format=json&env=store%3A%2F%2' +
  'Fdatatables.org%2Falltableswithkeys';

function showNotification(title, body, data) {
  let notificationOptions = {
    body: body,
    icon: '/images/icon-apple-touch-icon-72x72.png',
    tag: 'push-demo-notification',
    data: data
  };

  return self.registration.showNotification(title, notificationOptions);
}

self.addEventListener('push', event => {
  console.log('Received a push message', event);
  if (event.data) {
    console.log('message data', event.data);
    console.log('message data', event.data.text);
    var output = event.data.text();
    console.log(output);
  }

  event.waitUntil(
    fetch(API_ENDPOINT)
      .then(response => {
        if (response.status !== 200) {
          // Throw an error so the promise is rejected and catch() is executed
          throw new Error('Invalid status code from weather API: ' +
            response.status);
        }

        // Examine the text in the response
        return response.json();
      })
      .then(data => {
        console.log('Weather API data: ', data);
        if (data.query.count === 0) {
          // Throw an error so the promise is rejected and catch() is executed
          throw new Error();
        }

        let title = 'What\'s the weather like in London?';
        let message = data.query.results.channel.item.condition.text;
        let notificationData = {
          url: data.query.results.channel.link
        };

        return showNotification(title, message, notificationData);
      })
      .catch(err => {
        console.error('A Problem occured with handling the push msg', err);

        let title = 'An error occured';
        let message = 'We were unable to get data for this push message';

        return showNotification(title, message);
      })
  );
});

self.addEventListener('notificationclick', event => {
  let url = event.notification.data.url;
  event.notification.close();
  event.waitUntil(clients.openWindow(url));
});
