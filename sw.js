'use strict';
/* オフライン用の保存係。画面と部品を端末に覚えておき、ネットがなくても開けるようにします。 */
var VERSION = '98c04e81c0';
var CACHE = 'yakyu-note-' + VERSION;
var ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  './fonts/barlow-condensed-latin-500-normal.woff2',
  './fonts/barlow-condensed-latin-600-normal.woff2',
  './fonts/barlow-condensed-latin-700-normal.woff2'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('yakyu-note-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// まず端末に覚えているものを返し、ネットがあれば裏で最新に入れ替える
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    var net = fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    });
    if (hit) { e.waitUntil(net.catch(function () {})); return hit; }
    return net.catch(function () {
      return req.mode === 'navigate' ? caches.match('./index.html') : Response.error();
    });
  }));
});
