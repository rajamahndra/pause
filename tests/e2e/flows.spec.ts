import { test,expect } from "@playwright/test";
import { PLAN_ENABLED } from "../../src/lib/features";
import { PrismaClient } from "@prisma/client";import { PrismaPg } from "@prisma/adapter-pg";import "dotenv/config";
const url=process.env.DATABASE_URL||"";if(!new URL(url).pathname.endsWith("_test"))throw new Error("E2E requires a dedicated _test database.");
const db=new PrismaClient({adapter:new PrismaPg({connectionString:url})});const emails:string[]=[];
test.afterAll(async()=>{await db.user.deleteMany({where:{email:{in:emails}}});await db.$disconnect();});
test("logged-in users keep their private home through links, history, direct URLs and other tabs",async({page,context,playwright})=>{
 const email="navigation-"+crypto.randomUUID()+"@example.invalid";emails.push(email);
 const origin=process.env.APP_ORIGIN!;
 const account=await playwright.request.newContext({baseURL:origin});
 try {
  expect((await account.post("/api/v1/auth/register",{headers:{Origin:origin},data:{email,password:"pause-e2e-password"}})).status()).toBe(201);
 } finally { await account.dispose(); }

 await page.goto("/");
 await expect(page.getByRole("link",{name:"Masuk",exact:true})).toBeVisible();
 const otherTab=await context.newPage();await otherTab.goto("/");
 await page.getByRole("link",{name:"Masuk",exact:true}).click();
 await expect(page).toHaveURL(/\/masuk$/);
 await page.getByLabel("Email",{exact:true}).fill(email);
 await page.getByLabel("Kata sandi",{exact:true}).fill("pause-e2e-password");
 await page.getByRole("button",{name:"Masuk ke Pause"}).click();
 await expect(page).toHaveURL(/\/app$/);
 await expect(otherTab).toHaveURL(/\/app$/);await otherTab.close();
 // The landing page was visited before login; browser Back must not restore it.
 await page.goBack();await expect(page).toHaveURL(/\/app$/);
 expect((await page.request.get("/api/v1/auth/me")).status()).toBe(200);
 await expect(page.locator(".demo-banner")).toHaveCount(0);

 for(const route of ["/","/masuk","/daftar","/demo","/demo/jurnal"]){
  await page.goto(route);await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator(".demo-banner")).toHaveCount(0);
 }
 await page.goto("/masuk?returnTo=%2Fapp%2Fjurnal");await expect(page).toHaveURL(/\/app\/jurnal$/);
 await expect(page.getByRole("link",{name:"Pause, beranda",exact:true})).toHaveAttribute("href","/app");
 await page.getByRole("link",{name:"Pause, beranda",exact:true}).click();await expect(page).toHaveURL(/\/app$/);
 await page.getByRole("navigation",{name:"Ruang pribadi",exact:true}).getByRole("link",{name:"Edukasi",exact:true}).click();
 await expect(page).toHaveURL(/\/edukasi$/);
 const educationNav=page.getByRole("navigation",{name:"Ruang pribadi",exact:true});
 await expect(educationNav).toBeVisible();
 await expect(educationNav.getByRole("link",{name:"Edukasi",exact:true})).toHaveAttribute("aria-current","page");
 await expect(page.getByRole("main")).toHaveCount(1);
 await expect(page.getByRole("link",{name:"Masuk",exact:true})).toHaveCount(0);
 await expect(page.getByRole("link",{name:/demo/i})).toHaveCount(0);
 await page.screenshot({path:"docs/screenshots/education-account-desktop.png",fullPage:true});
 await page.getByRole("link",{name:/Mengenal panik, pelan-pelan/}).click();
 await expect(page).toHaveURL(/\/edukasi\/mengenal-panik$/);
 await page.reload();await expect(educationNav).toBeVisible();
 await expect(educationNav.getByRole("link",{name:"Edukasi",exact:true})).toHaveAttribute("aria-current","page");
 await educationNav.getByRole("link",{name:"Jurnal",exact:true}).click();await expect(page).toHaveURL(/\/app\/jurnal$/);
 await page.goto("/edukasi");await page.setViewportSize({width:360,height:800});
 const mobileNav=page.getByRole("navigation",{name:"Navigasi akun",exact:true});
 await expect(mobileNav).toBeVisible();
 await expect(mobileNav.getByRole("link",{name:"Edukasi",exact:true})).toHaveAttribute("aria-current","page");
 await page.screenshot({path:"docs/screenshots/education-account-mobile.png"});
 await mobileNav.getByRole("link",{name:"Beranda",exact:true}).click();await expect(page).toHaveURL(/\/app$/);
 await page.setViewportSize({width:1280,height:720});

 await page.goto("/app/pengaturan");await page.getByRole("button",{name:"Keluar dari akun"}).click();
 await expect(page).toHaveURL(/\/$/);
 await expect(page.getByRole("link",{name:"Masuk",exact:true})).toBeVisible();
 await page.goto("/demo");await expect(page.locator(".demo-banner")).toBeVisible();
});

test("expired sessions do not redirect guests away from the landing page",async({page})=>{
 const email="expired-home-"+crypto.randomUUID()+"@example.invalid";emails.push(email);
 const registration=await page.request.post("/api/v1/auth/register",{headers:{Origin:process.env.APP_ORIGIN!},data:{email,password:"pause-e2e-password"}});
 expect(registration.status()).toBe(201);
 const user=(await registration.json()).data.user;
 await db.session.updateMany({where:{userId:user.id},data:{expiresAt:new Date(Date.now()-1000)}});
 await page.goto("/");await expect(page).toHaveURL(/\/$/);
 await expect(page.getByRole("link",{name:"Masuk",exact:true})).toBeVisible();
 await page.goto("/app");await expect(page).toHaveURL(/\/masuk\?returnTo/);
});

test("register → journal → export → logout",async({page})=>{
 const email="e2e-"+crypto.randomUUID()+"@example.invalid";emails.push(email);
 await page.goto("/app/jurnal/baru");await expect(page).toHaveURL(/masuk.*returnTo/);await page.getByRole("link",{name:"Buat akun",exact:true}).click();await expect(page).toHaveURL(/\/daftar\?returnTo/);await page.getByLabel("Email",{exact:true}).fill(email);await page.getByLabel("Kata sandi",{exact:true}).fill("pause-e2e-password");await page.getByRole("button",{name:"Buat ruang pribadi"}).click();await expect(page).toHaveURL(/app\/jurnal\/baru$/);
 await page.getByLabel("Judul").fill("Satu langkah fiktif");await page.getByLabel("Apa yang ingin kamu ceritakan?").fill("Catatan pengujian fiktif.");await page.getByLabel("Hal yang ingin diingat").fill("Duduk di tempat yang nyaman.");await page.getByRole("button",{name:"Simpan catatan",exact:true}).click();await expect(page.getByRole("heading",{name:"Satu langkah fiktif"})).toBeVisible();
 if (PLAN_ENABLED) {
  await page.getByRole("button",{name:"Tambahkan ke rencana saya"}).click();await expect(page.getByRole("dialog")).toBeVisible();await page.getByRole("button",{name:"Konfirmasi & simpan"}).click();await expect(page.getByText("Langkah sudah ditambahkan")).toBeVisible();
  await page.goto("/app/rencana");await expect(page.getByText("Duduk di tempat yang nyaman.",{exact:true})).toBeVisible();
 } else {
  await expect(page.getByRole("button",{name:"Tambahkan ke rencana saya"})).toHaveCount(0);
  await expect(page.getByRole("link",{name:"Rencana",exact:true})).toHaveCount(0);
 }
 await page.goto("/app/pengaturan");await page.getByRole("button",{name:"Ekspor JSON",exact:true}).click();const downloadPromise=page.waitForEvent("download");await page.getByRole("button",{name:"Unduh JSON",exact:true}).click();const download=await downloadPromise;expect(download.suggestedFilename()).toBe("pause-ekspor.json");
 const cacheUrls=await page.evaluate(async()=>{const urls:string[]=[];for(const name of await caches.keys())for(const req of await(await caches.open(name)).keys())urls.push(req.url);return urls;});expect(cacheUrls.some(url=>/\/(api|app|masuk|daftar)(\/|\?|$)|_rsc=/.test(url))).toBe(false);
 await page.getByRole("button",{name:"Keluar dari akun"}).click();await expect(page).toHaveURL(/\/$/);expect((await page.request.get("/api/v1/journal")).status()).toBe(401);
});
test("demo remains in memory and makes no private API requests",async({page})=>{
 const calls:string[]=[];page.on("request",req=>{if(req.url().includes("/api/v1/"))calls.push(req.url());});await page.goto("/demo");await expect(page.getByText("Mode demo — data fiktif, tidak disimpan ke akun")).toBeVisible();await page.getByRole("link",{name:"Catat pengalaman",exact:true}).click();await page.getByLabel("Apa yang ingin kamu ceritakan?").fill("Fiktif baru");await page.getByRole("button",{name:"Simpan catatan",exact:true}).click();await expect(page.getByText("Fiktif baru",{exact:true})).toBeVisible();await page.reload();await expect(page.getByText("Catatan tidak ditemukan.")).toBeVisible();expect(calls).toEqual([]);
 expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual([]);
});
test("failed save retains input and never shows success",async({page})=>{
 const email="failed-"+crypto.randomUUID()+"@example.invalid";emails.push(email);await page.goto("/daftar");await page.getByLabel("Email",{exact:true}).fill(email);await page.getByLabel("Kata sandi",{exact:true}).fill("pause-e2e-password");await page.getByRole("button",{name:"Buat ruang pribadi"}).click();await expect(page).toHaveURL(/\/app$/);await page.goto("/app/jurnal/baru");await page.getByLabel("Apa yang ingin kamu ceritakan?").fill("Isian tetap ada.");await page.route("**/api/v1/journal",route=>route.abort());await page.getByRole("button",{name:"Simpan catatan",exact:true}).click();await expect(page.locator("form [role=alert]")).toContainText("Koneksi terputus");await expect(page.getByLabel("Apa yang ingin kamu ceritakan?")).toHaveValue("Isian tetap ada.");await expect(page).toHaveURL(/\/baru$/);
});
test("mobile layout, keyboard help and reduced motion",async({page})=>{
 await page.setViewportSize({width:360,height:800});for(const route of ["/","/edukasi","/bantuan","/demo","/demo/jurnal/baru",...(PLAN_ENABLED ? ["/demo/rencana"] : [])]){await page.goto(route);await expect(page.locator("h1")).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/bantuan/napas");await expect(page.getByRole("button",{name:"Mulai panduan"})).toBeVisible();await page.getByRole("button",{name:"Mulai panduan"}).focus();await page.keyboard.press("Enter");await expect(page.getByRole("button",{name:"Hentikan panduan"})).toBeVisible();await expect(page.locator(".breath-circle")).toHaveCount(0);await page.getByText("Kapan mencari bantuan medis",{exact:true}).click();await expect(page.getByText(/nyeri dada berat/)).toBeVisible();
 await page.screenshot({path:"docs/screenshots/mobile-help.png",fullPage:true});await page.goto("/");await page.screenshot({path:"docs/screenshots/mobile-home.png",fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:"docs/screenshots/desktop-home.png",fullPage:true});
});
