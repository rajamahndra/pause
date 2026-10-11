import { test,expect,type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
const url=process.env.DATABASE_URL||"";
if(!new URL(url).pathname.endsWith("_test"))throw new Error("Integration tests require a dedicated database ending in _test.");
const db=new PrismaClient({adapter:new PrismaPg({connectionString:url})});
const origin=process.env.APP_ORIGIN||"http://localhost:3000";const password="pause-test-password";const emails:string[]=[];
async function account(request:APIRequestContext){const email="test-"+crypto.randomUUID()+"@example.invalid";emails.push(email);const res=await request.post("/api/v1/auth/register",{headers:{Origin:origin},data:{email,password,timezone:"Asia/Makassar"}});expect(res.status()).toBe(201);return (await res.json()).data as {user:{id:string};csrfToken:string};}
const auth=(csrf:string)=>({Origin:origin,"X-CSRF-Token":csrf});
test.afterAll(async()=>{await db.user.deleteMany({where:{email:{in:emails}}});await db.$disconnect();});
test("registration and login require the configured browser origin, including its port",async({request})=>{
 const alternatePort=new URL(origin);alternatePort.port=alternatePort.port==="3100"?"3000":"3100";
 for(const route of ["auth/register","auth/login"]){
  for(const rejectedOrigin of [undefined,"https://evil.invalid",alternatePort.origin]){
   const response=await request.post("/api/v1/"+route,{headers:rejectedOrigin?{Origin:rejectedOrigin}:{},data:{}});
   expect(response.status()).toBe(403);expect((await response.json()).error.code).toBe("ORIGIN");
  }
  // Valid origin reaches input validation; no account is created by this request.
  const allowed=await request.post("/api/v1/"+route,{headers:{Origin:origin},data:{}});
  expect(allowed.status()).toBe(400);expect((await allowed.json()).error.code).toBe("VALIDATION");
 }
});
test("ownership, CSRF, minimal entry, atomic aggregates, export and deletion",async({playwright})=>{
 const a=await playwright.request.newContext({baseURL:origin});const b=await playwright.request.newContext({baseURL:origin});const ua=await account(a);const ub=await account(b);
 const body={title:"Pribadi A",occurredAt:"2026-10-10T15:59:59Z",occurredTimezone:"Asia/Makassar",actions:[{actionKey:"sit",label:"Duduk",helpful:true},{actionKey:"sit",label:"Duduk lagi",helpful:true}],narrative:"Khusus pemilik A."};
 expect((await a.post("/api/v1/journal",{data:body})).status()).toBe(403);
 expect((await a.post("/api/v1/journal",{headers:auth("wrong"),data:body})).status()).toBe(403);
 expect((await a.post("/api/v1/journal",{headers:{...auth(ua.csrfToken),Origin:"https://evil.invalid"},data:body})).status()).toBe(403);
 expect((await a.post("/api/v1/journal",{headers:auth(ua.csrfToken),data:{}})).status()).toBe(400);
 expect((await a.post("/api/v1/journal",{headers:auth(ua.csrfToken),data:{title:"x",userId:ub.user.id}})).status()).toBe(400);
 const created=await a.post("/api/v1/journal",{headers:auth(ua.csrfToken),data:body});expect(created.status()).toBe(201);const id=(await created.json()).data.id;
 for(const method of ["get","patch","delete"] as const){const res=await b[method]("/api/v1/journal/"+id,{headers:auth(ub.csrfToken),...(method==="patch"?{data:{title:"Intrusion"}}:{})});expect(res.status()).toBe(404);}
 const minimal=await a.post("/api/v1/journal",{headers:auth(ua.csrfToken),data:{narrative:"Satu kalimat."}});expect(minimal.status()).toBe(201);
 await a.patch("/api/v1/journal/"+id,{headers:auth(ua.csrfToken),data:{title:null}});
 const detail=(await(await a.get("/api/v1/journal/"+id)).json()).data;expect(detail.title).toBeNull();expect(detail.narrative).toBe(body.narrative);expect(detail.actions).toHaveLength(2);
 const filtered=(await(await a.get("/api/v1/journal?from=2026-10-10&to=2026-10-10&q=Khusus")).json()).data;expect(filtered.total).toBe(1);
 const stats=(await(await a.get("/api/v1/summary?from=2026-10-10&to=2026-10-10")).json()).data;expect(stats.actions.find((v:{actionKey:string})=>v.actionKey==="sit").count).toBe(1);
 const plan={title:"Rencana A",reminder:"Satu langkah",preferredGuide:"focus",steps:[{text:"Duduk"}],contacts:[{name:"Kontak fiktif",phone:"080000000000"}]};
 expect((await a.put("/api/v1/plan",{headers:auth(ua.csrfToken),data:plan})).status()).toBe(200);expect((await(await b.get("/api/v1/plan")).json()).data).toBeNull();
 expect((await a.put("/api/v1/plan",{headers:auth(ua.csrfToken),data:{...plan,steps:[{text:"Baru"},{text:""}]}})).status()).toBe(400);expect((await(await a.get("/api/v1/plan")).json()).data.steps[0].text).toBe("Duduk");
 // Fail after aggregate mutations to verify PostgreSQL rolls the whole transaction back.
 const old=await db.supportPlan.findUniqueOrThrow({where:{userId:ua.user.id}});
 await expect(db.$transaction(async tx=>{await tx.supportPlanStep.deleteMany({where:{planId:old.id}});await tx.supportPlanStep.create({data:{planId:"00000000-0000-4000-8000-000000000000",text:"Invalid FK",position:0}});})).rejects.toThrow();
 expect(await db.supportPlanStep.count({where:{planId:old.id}})).toBe(1);
 const exported=await a.get("/api/v1/export");expect(exported.headers()["cache-control"]).toContain("no-store");const raw=await exported.text();const data=JSON.parse(raw);expect(data.profile.id).toBe(ua.user.id);expect(raw).not.toMatch(/passwordHash|tokenHash|csrfToken|Khusus pemilik B/);expect(data.journals.every((e:{userId:string})=>e.userId===ua.user.id)).toBe(true);
 expect((await a.delete("/api/v1/account",{headers:auth(ua.csrfToken),data:{password:"wrong",confirm:"HAPUS"}})).status()).toBe(400);expect(await db.user.findUnique({where:{id:ua.user.id}})).not.toBeNull();
 await expect(db.$transaction(async tx=>{await tx.user.delete({where:{id:ua.user.id}});throw new Error("Simulated failure");})).rejects.toThrow();expect(await db.journalEntry.count({where:{userId:ua.user.id}})).toBe(2);
 expect((await a.delete("/api/v1/account",{headers:auth(ua.csrfToken),data:{password,confirm:"HAPUS"}})).status()).toBe(204);
 expect(await db.user.findUnique({where:{id:ua.user.id}})).toBeNull();expect(await db.session.count({where:{userId:ua.user.id}})).toBe(0);expect(await db.journalEntry.count({where:{userId:ua.user.id}})).toBe(0);expect(await db.supportPlan.findUnique({where:{userId:ua.user.id}})).toBeNull();expect(await db.trustedContact.count({where:{planId:old.id}})).toBe(0);expect((await a.get("/api/v1/export")).status()).toBe(401);
 await a.dispose();await b.dispose();
});
test("logout, session rotation and expiration reject private endpoints",async({playwright})=>{
 const a=await playwright.request.newContext({baseURL:origin});const u=await account(a);const previous=(await a.storageState()).cookies;
 const login=await a.post("/api/v1/auth/login",{headers:{Origin:origin},data:{email:emails.at(-1),password}});expect(login.status()).toBe(200);const token=(await login.json()).data.csrfToken;
 const stale=await playwright.request.newContext({baseURL:origin,storageState:{cookies:previous,origins:[]}});expect((await stale.get("/api/v1/journal")).status()).toBe(401);
 expect((await a.post("/api/v1/auth/logout",{headers:auth(token)})).status()).toBe(204);expect((await a.get("/api/v1/plan")).status()).toBe(401);
 await a.post("/api/v1/auth/login",{headers:{Origin:origin},data:{email:emails.at(-1),password}});await db.session.updateMany({where:{userId:u.user.id},data:{expiresAt:new Date(Date.now()-1000)}});expect((await a.get("/api/v1/plan")).status()).toBe(401);await a.dispose();await stale.dispose();
});
