import { test,expect } from "@playwright/test";import fs from "node:fs/promises";
test("manifest, real offline guides, selected readings and private cache boundary",async({page,context})=>{
 await page.goto("/");await expect(page.getByText("Bantuan tersedia offline",{exact:true})).toBeVisible();await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();
 const manifest=await(await page.request.get("/manifest.webmanifest")).json();expect(manifest).toMatchObject({name:"Pause",short_name:"Pause",id:"/",display:"standalone",lang:"id"});for(const icon of manifest.icons){const res=await page.request.get(icon.src);expect(res.status()).toBe(200);expect(res.headers()["content-type"]).toContain("image/png");}
 await page.goto("/edukasi/mengenal-panik");await page.getByRole("button",{name:"Simpan untuk offline"}).click();await expect(page.getByText("Artikel sudah tersedia offline.",{exact:true})).toBeVisible();
 await context.setOffline(true);await page.goto("/bantuan/napas");await expect(page.getByRole("button",{name:"Mulai panduan"})).toBeVisible();await expect(page.locator("#start")).toHaveText("Mulai panduan");await page.locator("#start").click();await expect(page.locator("#start")).toHaveText("Hentikan panduan");await page.locator("#start").click();await page.locator("#text-mode").click();await expect(page.locator("#text-panel")).toBeVisible();await page.getByRole("button",{name:"Ganti panduan"}).click();await page.getByRole("button",{name:"Fokus ke sekitar",exact:true}).click();await expect(page.locator("#step-count")).toHaveText("Langkah 1 / 3");await page.locator("#next").click();await expect(page.locator("#step-count")).toHaveText("Langkah 2 / 3");await page.locator("#skip").click();await expect(page.locator("#step-count")).toHaveText("Langkah 3 / 3");await page.locator("#finish").click();await expect(page.locator("#finished")).toBeVisible();await page.getByText("Kapan mencari bantuan medis",{exact:true}).click();await expect(page.locator("#medical-copy")).toBeVisible();
 await page.goto("/offline-education/mengenal-panik.html");await expect(page.getByRole("heading",{name:"Mengenal panik, pelan-pelan"})).toBeVisible();await page.goto("/offline-education/mencari-bantuan.html");await expect(page.getByText("Halaman ini belum tersedia offline.",{exact:false})).toBeVisible();
 await page.goto("/app/jurnal");await expect(page.getByText("Data pribadi tidak disalin ke cache.",{exact:false})).toBeVisible();expect(await page.locator(".entry-card").count()).toBe(0);
 await context.setOffline(false);await page.goto("/edukasi/mengenal-panik");await page.getByRole("button",{name:"Hapus unduhan"}).click();await expect(page.getByText("Unduhan telah dihapus.",{exact:true})).toBeVisible();
 const keys=await page.evaluate(async()=>{const urls:string[]=[];for(const key of await caches.keys()){expectName(key);for(const req of await(await caches.open(key)).keys())urls.push(req.url);}function expectName(name:string){if(!name.startsWith("pause-public-"))throw new Error("Unexpected cache");}return urls;});expect(keys.some(url=>/\/(api|app|masuk|daftar)(\/|\?|$)|_rsc=/.test(url))).toBe(false);
});
test("SW update waits for user and keeps an active guide intact",async({page})=>{
 await page.goto("/bantuan/napas");await expect(page.getByText("Bantuan tersedia offline",{exact:true})).toBeVisible();await page.reload();await page.getByRole("button",{name:"Mulai panduan"}).click();
 const original=await fs.readFile("public/sw.js","utf8");try{
 await fs.writeFile("public/sw.js",original.replace(/const VERSION=("[^"]+");/,'const VERSION="update-test-'+Date.now()+'";'));
 await page.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration())?.update();});
 await expect(page.getByText(/Versi baru tersedia/)).toBeVisible();await expect(page.getByRole("button",{name:"Muat ulang",exact:true})).toBeDisabled();await expect(page.getByRole("button",{name:"Hentikan panduan"})).toBeVisible();
 await page.getByRole("button",{name:"Hentikan panduan"}).click();await expect(page.getByRole("button",{name:"Muat ulang",exact:true})).toBeEnabled();await Promise.all([page.waitForEvent("load"),page.getByRole("button",{name:"Muat ulang",exact:true}).click()]);await expect(page.getByRole("button",{name:"Mulai panduan"})).toBeVisible();
 await expect.poll(async()=>(await page.evaluate(()=>caches.keys())).filter(n=>n.startsWith("pause-public-core-"))).toHaveLength(1);
 }finally{await fs.writeFile("public/sw.js",original);}
});
test("install UI supports browser event and hides in standalone",async({page})=>{
 await page.goto("/");await page.evaluate(()=>{const e=new Event("beforeinstallprompt",{cancelable:true});Object.assign(e,{prompt:async()=>{},userChoice:Promise.resolve({outcome:"dismissed"})});dispatchEvent(e);});await expect(page.getByRole("button",{name:"Pasang Pause"})).toBeVisible();await page.getByRole("button",{name:"Pasang Pause"}).click();await expect(page.getByRole("button",{name:"Pasang Pause"})).toHaveCount(0);
 await page.addInitScript(()=>{const original=window.matchMedia.bind(window);window.matchMedia=(query:string)=>query==="(display-mode: standalone)"?{...original(query),matches:true,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){},dispatchEvent(){return true;},onchange:null,media:query}:original(query);});await page.reload();await expect(page.getByRole("button",{name:"Pasang Pause"})).toHaveCount(0);
});

test("SW update preserves an unsaved journal and waits for save",async({page})=>{
 await page.goto("/demo/jurnal/baru");await expect(page.getByText("Bantuan tersedia offline",{exact:true})).toBeVisible();await page.reload();await page.getByLabel("Apa yang ingin kamu ceritakan?").fill("Draft fiktif tetap berada di layar.");
 const original=await fs.readFile("public/sw.js","utf8");try{
  await fs.writeFile("public/sw.js",original.replace(/const VERSION=("[^"]+");/,'const VERSION="form-update-test-'+Date.now()+'";'));await page.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration())?.update();});
  await expect(page.getByText(/Versi baru tersedia/)).toBeVisible();await expect(page.getByRole("button",{name:"Muat ulang",exact:true})).toBeDisabled();await expect(page.getByLabel("Apa yang ingin kamu ceritakan?")).toHaveValue("Draft fiktif tetap berada di layar.");
  await page.getByRole("button",{name:"Simpan catatan",exact:true}).click();await expect(page.getByText("Draft fiktif tetap berada di layar.",{exact:true})).toBeVisible();await expect(page.getByRole("button",{name:"Muat ulang",exact:true})).toBeEnabled();
 }finally{await fs.writeFile("public/sw.js",original);}
});

test("focus guide is protected from updates immediately after opening",async({page})=>{
 await page.goto("/bantuan/fokus");await expect(page.getByText("Bantuan tersedia offline",{exact:true})).toBeVisible();await page.reload();
 const original=await fs.readFile("public/sw.js","utf8");try{
  await fs.writeFile("public/sw.js",original.replace(/const VERSION=("[^"]+");/,'const VERSION="focus-update-test-'+Date.now()+'";'));await page.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration())?.update();});
  await expect(page.getByText(/Versi baru tersedia/)).toBeVisible();await expect(page.getByRole("button",{name:"Muat ulang",exact:true})).toBeDisabled();await page.getByRole("button",{name:"Selesai",exact:true}).click();await expect(page.getByRole("button",{name:"Muat ulang",exact:true})).toBeEnabled();
 }finally{await fs.writeFile("public/sw.js",original);}
});
