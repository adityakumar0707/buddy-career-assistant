const fs=require('fs');
fs.readFileSync('.env','utf8').split('\n').forEach(l=>{const m=/^([A-Z_]+)=(.*)$/.exec(l);if(m)process.env[m[1]]=m[2];});
const {generate}=require('../api/_lib/gemini');
generate({messages:[{role:'user',content:'Reply with the single word: ready'}],maxTokens:50,timeoutMs:30000})
 .then(o=>console.log('OK',o.text.slice(0,60)))
 .catch(e=>console.log('FAIL',e.status,String(e.message).slice(0,300)));
