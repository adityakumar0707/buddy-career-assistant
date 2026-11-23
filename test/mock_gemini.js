// Fake Gemini for local tests. Returns shaped JSON based on the prompt.
const http=require('http');
http.createServer((req,res)=>{
  let b='';req.on('data',c=>b+=c);req.on('end',()=>{
    let t='',inter=/\/interactions/.test(req.url),j={};try{j=JSON.parse(b);t=JSON.stringify(j.contents||j.input)+JSON.stringify(j.systemInstruction||j.system_instruction||'')}catch(e){}
    if(process.env.MOCK_NO_INTERACTIONS&&inter){res.statusCode=404;return res.end(JSON.stringify({error:{message:'not found'}}))}
    if(inter&&(j.model!=='gemini-4-hydrogen'||req.headers['api-revision']!=='2026-05-20'||!req.headers['x-goog-api-key']||j.generation_config===undefined)){res.statusCode=400;return res.end(JSON.stringify({error:{message:'bad request shape'}}))}
    let out='ok';
    if(/Suggest \d+ postgraduate programs/.test(t)){
      const law=/in Law|Law\b/.test(t);
      const th=/do not require an entrance test/.test(t)?'N':/widen/.test(t)?'E':'F';
      const names=law?['Law','Laws']:['Data','Tech'];
      const progs=[1,2,3,4,5,6].map(i=>({university:'Mock University '+th+i,program:(law?'LLM in Commercial Law ':'MS in Data Science ')+th+i,country:['UK','Canada','Germany'][i%3],city:'City'+i,reason:'Fits your '+(law?'law':'tech')+' background, row '+th+'.',official_url:'https://example.edu/'+th+i}));
      out=JSON.stringify({insight:'Most programs here accept your background without extra tests.',programs:progs});
    } else if(/Collect the application facts/.test(t)){
      out=JSON.stringify({deadline:'15 January 2027',cycle:'Fall 2027',duration:'12 months',entrance_tests:'GRE optional',english_test:'IELTS 6.5',academic_requirement:'Four year degree',sop_requirement:'500 words',lor_count:2,application_fee:'GBP 75',tuition:null,documents:[],checklist:[{title:'Statement of purpose',kind:'sop',note:'500 words'},{title:'Resume',kind:'resume',note:null},{title:'Transcripts',kind:'transcripts',note:null},{title:'Two recommendation letters',kind:'lor',note:'academic'},{title:'Online form',kind:'form',note:null}],highlights:'A one year course with an industry project.',sources:[{title:'Official page',url:'https://example.edu/x'}]});
    } else if(/Write a draft of about/.test(t)){
      out='I first noticed this in college. It stayed with me.\n\n[Sources: Q1]\n\nMy project taught me to ship.\n\n[Sources: Q2, Q3]';
      out='I first noticed this in college. [Sources: Q1]\n\nMy project taught me to ship. [Sources: Q2, Q3]';
    } else if(/Write 8 interview questions/.test(t)){
      out=JSON.stringify(['Why this program?','Tell us about a project.','A setback?','Why this country?','Your goals?','A subject question?','What will you bring?','Any questions for us?']);
    } else if(/Give feedback in exactly this format/.test(t)){
      out='What worked:\n- Clear\n- Honest\n\nTo improve:\n- Add a number\n- Shorter\n\nTry this opening: I built it myself.';
    } else if(/Reply with the single word/.test(t)){ out='ready'; }
    else { out='Here is a short answer. Open the Shortlist tab for more. — test'; }
    const body=inter?JSON.stringify({id:'v1_x',status:'completed',steps:[{type:'thought',signature:'x'},{type:'model_output',content:[{type:'text',text:out,annotations:[{type:'url_citation',title:'Src',url:'https://example.edu/s'}]}]}]}):JSON.stringify({candidates:[{content:{parts:[{text:out}]},groundingMetadata:{groundingChunks:[{web:{title:'Src',uri:'https://example.edu/s'}}]}}]});
    setTimeout(()=>{res.setHeader('Content-Type','application/json');res.end(body)},300);
  });
}).listen(4010,()=>console.log('mock on 4010'));
