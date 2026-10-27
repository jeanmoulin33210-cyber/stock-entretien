// Supabase Edge Function. Deploy only after configuring the server-side secrets.
const origin='https://jeanmoulin33210-cyber.github.io';
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
export async function handler(req:Request):Promise<Response>{
  const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
  if(req.method==='OPTIONS')return new Response(null,{headers});
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply({error:'Forbidden'},403);
  const key=Deno.env.get('RESEND_API_KEY'),from=Deno.env.get('JURY_REPORT_FROM');
  const allowed=(Deno.env.get('JURY_REPORT_ALLOWED_USER_IDS')||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(!key||!from||!allowed.length)return reply({error:'Service non configuré'},503);
  const auth=req.headers.get('authorization')||'';
  if(!auth.startsWith('Bearer '))return reply({error:'Unauthorized'},401);
  const userResponse=await fetch(Deno.env.get('SUPABASE_URL')+'/auth/v1/user',{headers:{Authorization:auth,apikey:Deno.env.get('SUPABASE_ANON_KEY')!}});
  const user=await userResponse.json();
  if(!userResponse.ok||!user.id||!allowed.includes(user.id))return reply({error:'Forbidden'},403);
  if(Number(req.headers.get('content-length')||0)>5100000)return reply({error:'PDF trop volumineux'},413);
  try{
    const form=await req.formData(),file=form.get('report');
    const to=String(form.get('recipient')||''),subject=String(form.get('subject')||''),text=String(form.get('message')||''),id=String(form.get('requestId')||'');
    if(!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(to)||to.length>254||!subject.trim()||subject.length>200||/[\r\n]/.test(subject)||text.length>10000||!text.trim()||!/^[a-f0-9-]{36}$/.test(id))return reply({error:'Champs invalides'},400);
    if(!(file instanceof File)||!file.size||file.size>5000000||file.type!=='application/pdf')return reply({error:'PDF invalide ou supérieur à 5 Mo'},400);
    const bytes=new Uint8Array(await file.arrayBuffer());
    if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')return reply({error:'PDF invalide'},400);
    let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':user.id+'/'+id},body:JSON.stringify({from,to:[to],subject,text,attachments:[{filename:file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,120)||'rapport.pdf',content:btoa(binary)}]})});
    const result=await res.json();
    if(!res.ok||!result.id)return reply({error:'Le service n’a pas confirmé l’envoi'},502);
    return reply({id:result.id,status:'accepted'});
  }catch{return reply({error:'Envoi impossible'},500);}
}
Deno.serve(handler);
