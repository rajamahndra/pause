const VERSION="fc226f12cf073f0c";
const PRECACHE=["/offline-fallback.html","/offline-help/index.html","/offline-help/style.css","/offline-help/guide.js","/offline-help/library.js","/fonts/dm-serif-regular.woff2","/fonts/dm-serif-italic.woff2","/fonts/dm-sans.woff2","/icons/icon-192.png","/icons/icon-512.png","/icons/maskable-512.png","/icons/apple-touch-icon.png"];
const ARTICLE_URLS=["/offline-education/dukungan-saat-panik.html","/offline-education/mencari-bantuan.html","/offline-education/mencatat-tanpa-menuntut.html","/offline-education/mendampingi-orang-lain.html","/offline-education/mengenal-panik.html","/offline-education/sensasi-dan-pemeriksaan.html"];
const PUBLIC_CACHE='pause-public-core-'+VERSION;
const EDUCATION_CACHE='pause-public-education-'+VERSION;
const isSafe=response=>response.ok&&response.status===200&&!response.redirected&&response.type!=='opaque';
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(PUBLIC_CACHE);const responses=await Promise.all(PRECACHE.map(async url=>{const response=await fetch(url,{credentials:'omit',cache:'reload'});if(!isSafe(response))throw new Error('Precache failed');return [url,response];}));await Promise.all(responses.map(([url,response])=>cache.put(url,response)));})());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{
 const old=(await caches.keys()).filter(n=>n.startsWith('pause-public-')&&n!==PUBLIC_CACHE&&n!==EDUCATION_CACHE);
 const education=await caches.open(EDUCATION_CACHE);
 for(const name of old.filter(n=>n.startsWith('pause-public-education-'))){const cache=await caches.open(name);for(const req of await cache.keys()){const path=new URL(req.url).pathname;if(ARTICLE_URLS.includes(path)&&!await education.match(path)){try{const fresh=await fetch(path,{credentials:'omit',cache:'reload'});if(isSafe(fresh))await education.put(path,fresh);else{const oldResponse=await cache.match(req);if(oldResponse)await education.put(path,oldResponse);}}catch{const oldResponse=await cache.match(req);if(oldResponse)await education.put(path,oldResponse);}}}}
 await Promise.all(old.map(n=>caches.delete(n)));await self.clients.claim();
 })());});
self.addEventListener('message',event=>{event.waitUntil((async()=>{
 const send=value=>event.ports[0]?.postMessage(value);
 if(!event.source||new URL(event.source.url).origin!==self.location.origin)return;
 try{
  const {type,slug}=event.data||{};
  if(type==='ACTIVATE'){await self.skipWaiting();return;}
  const core=await caches.open(PUBLIC_CACHE);
  if(type==='STATUS'){send({ready:(await Promise.all(PRECACHE.map(url=>core.match(url)))).every(Boolean)});return;}
  const cache=await caches.open(EDUCATION_CACHE);
  if(type==='LIST'){send({items:(await cache.keys()).map(r=>new URL(r.url).pathname.split('/').pop().replace('.html',''))});return;}
  const url='/offline-education/'+slug+'.html';if(!ARTICLE_URLS.includes(url))throw new Error('Artikel tidak tersedia.');
  if(type==='SAVE_ARTICLE'){const response=await fetch(url,{credentials:'omit',cache:'reload'});if(!isSafe(response))throw new Error('Unduhan belum berhasil. Periksa koneksi.');for(const asset of PRECACHE)if(!await core.match(asset))throw new Error('Aset offline belum lengkap. Siapkan bantuan lagi.');await cache.put(url,response);send({ready:true});}
  else if(type==='REMOVE_ARTICLE'){await cache.delete(url);send({ready:true});}
 }catch(error){send({error:error.message||'Belum berhasil. Coba lagi.'});}
 })());});
self.addEventListener('fetch',event=>{
 const request=event.request;const url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.headers.has('rsc')||request.headers.has('next-router-prefetch')||request.headers.get('purpose')==='prefetch'||url.searchParams.has('_rsc'))return;
 const privateRoute=/^\/(api(?:\/|$)|app(?:\/|$)|masuk(?:\/|$)|daftar(?:\/|$))/.test(url.pathname);
 if(request.mode==='navigate'){
  event.respondWith((async()=>{try{const help=/^\/bantuan(?:\/|$)/.test(url.pathname);return await fetch(request,help?{signal:AbortSignal.timeout(4000)}:undefined);}catch{
   const core=await caches.open(PUBLIC_CACHE);if(/^\/bantuan(?:\/|$)/.test(url.pathname))return await core.match('/offline-help/index.html')||Response.error();
   if(ARTICLE_URLS.includes(url.pathname)){const cache=await caches.open(EDUCATION_CACHE);const article=await cache.match(url.pathname);if(article)return article;}
   if(PRECACHE.includes(url.pathname))return await core.match(url.pathname)||Response.error();
   return await core.match('/offline-fallback.html')||Response.error();
  }})());return;
 }
 if(privateRoute||url.search)return;
 if(PRECACHE.includes(url.pathname))event.respondWith((async()=>await(await caches.open(PUBLIC_CACHE)).match(url.pathname)||fetch(request))());
 else if(ARTICLE_URLS.includes(url.pathname))event.respondWith((async()=>await(await caches.open(EDUCATION_CACHE)).match(url.pathname)||fetch(request))());
});
