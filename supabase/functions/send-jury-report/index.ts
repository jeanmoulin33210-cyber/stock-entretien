import nodemailer from 'npm:nodemailer@10.2.1';
import { Buffer } from 'node:buffer';
// Supabase Edge Function. Deploy only after configuring the server-side secrets.
const origin='https://jeanmoulin33210-cyber.github.io';
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
export async function handler(req:Request):Promise<Response>{
  const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
  if(req.method==='OPTIONS')return new Response(null,{headers});
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply({error:'Forbidden'},403);
  const from='jeanmoulin33210@gmail.com',password=(Deno.env.get('SMTP_PASSWORD')||'').replace(/\s/g,'');
  const allowed=['1ea24b40-a93d-418d-a363-4d55d1bd8feb'];
  if(!password)return reply({error:'Service non configuré'},503);
  const transport=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:from,pass:password},connectionTimeout:15000,greetingTimeout:15000,socketTimeout:30000,disableFileAccess:true,disableUrlAccess:true});
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
    const result=await transport.sendMail({from:{name:'Tests culinaires — Jury',address:from},to,subject,text,messageId:'<'+id+'@gmail.com>',attachments:[{filename:file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,120)||'rapport.pdf',content:Buffer.from(bytes),contentType:'application/pdf'}]});
    if(!result.accepted?.length)return reply({error:'Envoi non confirmé'},502);
    return reply({id:result.messageId,status:'accepted'});
  }catch{return reply({error:'Envoi impossible'},500);}
}
Deno.serve(handler);
