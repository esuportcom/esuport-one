import {existsSync,readFileSync,readdirSync} from "node:fs";
const required=["package.json","render.yaml","src/app/api/health/route.ts","src/app/api/cron/sync-email/route.ts","src/app/api/stripe/webhook/route.ts","src/app/api/email/reply/route.ts","DEPLOY_RENDER.md"];
let errors=0;
for(const file of required){if(!existsSync(file)){console.error(`MISSING ${file}`);errors++}}
const migrations=readdirSync("supabase/migrations").filter(x=>x.endsWith(".sql")).sort();
const nums=migrations.map(x=>Number(x.slice(0,4)));
for(let i=0;i<nums.length;i++){if(nums[i]!==i+1){console.error(`Migration sequence gap at ${migrations[i]}`);errors++}}
const pkg=JSON.parse(readFileSync("package.json","utf8"));
if(!pkg.scripts?.build||!pkg.scripts?.start){console.error("Missing build/start scripts");errors++}
if(pkg.version!=="1.5.0"){console.error(`Expected package version 1.5.0, found ${pkg.version}`);errors++}
const render=readFileSync("render.yaml","utf8");
for(const marker of ["runtime: node","healthCheckPath: /api/health","startCommand: yarn start"])if(!render.includes(marker)){console.error(`Render config missing ${marker}`);errors++}
console.log(`Release check: ${required.length} required files, ${migrations.length} sequential SQL migrations; ${errors} error(s).`);
if(errors)process.exit(1);
