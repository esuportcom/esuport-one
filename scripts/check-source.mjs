import {existsSync,readFileSync,readdirSync} from "node:fs";
import {resolve,join} from "node:path";
const root=process.cwd();let errors=[];let checked=0;
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const f=join(dir,e.name);if(e.isDirectory())walk(f);else if(/\.(tsx?|jsx?)$/.test(e.name)){checked++;const source=readFileSync(f,"utf8");for(const match of source.matchAll(/(?:from\s*|import\s*\()\s*["'](@\/[^"']+)["']/g)){const name=match[1].slice(2);const base=resolve(root,"src",name);if(![".ts",".tsx",".js",".jsx","/index.ts","/index.tsx","/index.js"].some(ext=>existsSync(base+ext)))errors.push(`${f}: unresolved ${match[1]}`)}}}}
walk(resolve(root,"src"));
if(errors.length){console.error(errors.join("\n"));process.exitCode=1}else console.log(`Verified ${checked} source files: all @/ imports resolve.`);
