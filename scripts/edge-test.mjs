import assert from 'node:assert/strict';
import { readFile, writeFile, access, mkdir, utimes } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
const base=process.env.ZDROP_TEST_URL || 'http://localhost:3000';
const p=await PDFDocument.create();p.addPage();p.addPage();const pdf=Buffer.from(await p.save());
async function request(action,{method='POST',body,token,query='',status=200}={}) {
  const r=await fetch(base+'/api/sessions/'+action+query,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body && !Buffer.isBuffer(body)?{'Content-Type':'application/json'}:{})},body:body?Buffer.isBuffer(body)?body:JSON.stringify(body):undefined});
  const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));return data;
}
const input={files:[{fileName:'edge.pdf',fileSize:pdf.length,mimeType:'application/pdf'}],preferences:{copies:1,colorMode:'BW',sides:'DOUBLE',pageRange:'ALL'}};
async function ready(){const r=await request('create',{body:input,status:201});await request('upload',{body:pdf,token:r.token,query:'?sessionId='+r.session.id+'&fileId='+r.session.files[0].fileId});const c=await request('confirm',{token:r.token,body:{sessionId:r.session.id}});assert.equal(c.session.files[0].pageCount,2);return r;}
const expired=await ready();await request('resolve',{method:'GET',query:'?code='+expired.session.accessCode});
const file='.zdrop-data/'+expired.session.id+'/session.json';const stored=JSON.parse(await readFile(file,'utf8'));stored.expiresAt=Date.now()-1000;await writeFile(file,JSON.stringify(stored));
const ended=await request('status',{method:'GET',token:expired.token,query:'?sessionId='+expired.session.id});assert.equal(ended.session.status,'EXPIRED');await assert.rejects(access('.zdrop-data/'+stored.id+'/'+stored.files[0].fileId));
const stale=await ready();const lock='.zdrop-data/'+stale.session.id+'.lock';await mkdir(lock);const old=new Date(Date.now()-360000);await utimes(lock,old,old);await request('delete',{token:stale.token,body:{sessionId:stale.session.id}});
const interrupted=await ready();const metadata='.zdrop-data/'+interrupted.session.id+'/session.json';const pending=JSON.parse(await readFile(metadata,'utf8'));pending.purging=true;pending.purgeSource='STUDENT_REVOKE';await writeFile(metadata,JSON.stringify(pending));const recovered=await request('status',{method:'GET',token:interrupted.token,query:'?sessionId='+pending.id});assert.equal(recovered.session.status,'DELETED');await assert.rejects(access('.zdrop-data/'+pending.id+'/'+pending.files[0].fileId));
const bad=await request('create',{body:{...input,files:[{...input.files[0],fileSize:5}]},status:201});await request('upload',{token:bad.token,body:Buffer.from('%PDF-'),query:'?sessionId='+bad.session.id+'&fileId='+bad.session.files[0].fileId,status:400});await request('delete',{token:bad.token,body:{sessionId:bad.session.id}});
assert.equal((await fetch(base+'/api/cron/purge-expired')).status,401);
let limited=false;for(let i=0;i<31;i++){const r=await fetch(base+'/api/sessions/resolve?code=000000');if(r.status===429){limited=true;break}}assert.ok(limited);
console.log('PASS: real page counts, accessed-session expiry, physical deletion, stale-lock recovery, interrupted-purge recovery, invalid PDFs, cron authorization, and rate limits.');
