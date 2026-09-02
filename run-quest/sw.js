/* 러닝퀘스트 서비스 워커 — 앱 셸을 캐시해 오프라인·홈 화면 설치를 가능하게 한다.
   버전을 올리면 CACHE 이름을 바꿔 옛 캐시를 비운다. */
var CACHE = "runquest-v0.5";
var SHELL = [
  "./prototype/v0.5.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];
self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if(url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then(function(hit){
    if(hit) return hit;
    return fetch(e.request).then(function(res){
      if(res && res.ok && url.pathname.indexOf("/run-quest/") >= 0){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
      }
      return res;
    }).catch(function(){ return caches.match("./prototype/v0.5.html"); });
  }));
});
