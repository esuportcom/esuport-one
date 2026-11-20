const base=process.argv[2]||process.env.NEXT_PUBLIC_SITE_URL;
if(!base){console.error("Usage: node scripts/smoke-test.mjs https://your-service.onrender.com");process.exit(2)}
const url=new URL("/api/health",base);
const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
try{const response=await fetch(url,{signal:controller.signal,redirect:"error"});const data=await response.json();if(!response.ok||data.status!=="ok")throw new Error(`Unexpected health response: HTTP ${response.status}`);console.log(`PASS: ${url.origin}/api/health (${data.version||"version unknown"})`)}catch(e){console.error(`FAIL: ${e.message}`);process.exitCode=1}finally{clearTimeout(timeout)}
