import "dotenv/config";
import { defineConfig,devices } from "@playwright/test";
export default defineConfig({testDir:"./tests",testMatch:/.*\.(spec)\.ts/,fullyParallel:false,workers:1,timeout:45000,expect:{timeout:10000},globalSetup:"./tests/setup.ts",use:{baseURL:process.env.APP_ORIGIN||"http://localhost:3000",trace:"retain-on-failure",screenshot:"only-on-failure",...devices["Desktop Chrome"]},reporter:[["list"],["html",{open:"never"}]]});
