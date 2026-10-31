import nodemailer from 'npm:nodemailer@10.2.1';
import { Buffer } from 'node:buffer';
// Supabase Edge Function. Deploy only after configuring the server-side secrets.
const origin='https://jeanmoulin33210-cyber.github.io';
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
// A verified second administrator must belong to the existing general workspace.
// Memberships in an individual jury do not grant this permission.
export async function canSendReport(user:{id?:string;email_confirmed_at?:string;is_anonymous?:boolean;email?:string},authorization:string,school=''):Promise<boolean>{
  if(!user?.id||!user.email_confirmed_at||user.is_anonymous)return false;
  if(user.id==='1ea24b40-a93d-418d-a363-4d55d1bd8feb')return true;
  try{
    if(/^S(?:[1-9]|1[0-2])$/.test(school)){
      const schoolUrl=Deno.env.get('SUPABASE_URL')+'/rest/v1/jury_school_trials?select=school,email,enabled&school=eq.'+encodeURIComponent(school)+'&enabled=eq.true';
      const response=await fetch(schoolUrl,{headers:{Authorization:authorization,apikey:Deno.env.get('SUPABASE_ANON_KEY')!}});
      if(response.ok){
        const schools=await response.json();
        if(Array.isArray(schools)&&schools.length===1&&schools[0].school===school&&schools[0].enabled===true&&String(schools[0].email||'').toLowerCase()===String(user.email||'').toLowerCase()&&user.email)return true;
      }
    }
    const url=Deno.env.get('SUPABASE_URL')+'/rest/v1/test_culinaire_memberships?select=role&session_id=eq.675ee51b-915e-416a-ac45-349d6a69f524&user_id=eq.'+encodeURIComponent(user.id)+'&role=eq.admin';
    const result=await fetch(url,{headers:{Authorization:authorization,apikey:Deno.env.get('SUPABASE_ANON_KEY')!}});
    if(!result.ok)return false;
    const rows=await result.json();
    return Array.isArray(rows)&&rows.length===1&&rows[0]?.role==='admin';
  }catch{return false;}
}
export async function handler(req:Request):Promise<Response>{
  const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
  if(req.method==='OPTIONS')return new Response(null,{headers});
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply({error:'Forbidden'},403);
  const from='jeanmoulin33210@gmail.com',password=(Deno.env.get('SMTP_PASSWORD')||'').replace(/\s/g,'');
  if(!password)return reply({error:'Service non configuré'},503);
  const transport=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:from,pass:password},connectionTimeout:15000,greetingTimeout:15000,socketTimeout:30000,disableFileAccess:true,disableUrlAccess:true});
  const auth=req.headers.get('authorization')||'';
  if(!auth.startsWith('Bearer '))return reply({error:'Unauthorized'},401);
  const userResponse=await fetch(Deno.env.get('SUPABASE_URL')+'/auth/v1/user',{headers:{Authorization:auth,apikey:Deno.env.get('SUPABASE_ANON_KEY')!}});
  const user=await userResponse.json();
  if(!userResponse.ok||!user.id)return reply({error:'Forbidden'},403);
  if(Number(req.headers.get('content-length')||0)>5100000)return reply({error:'PDF trop volumineux'},413);
  try{
    const form=await req.formData(),file=form.get('report');
    if(!await canSendReport(user,auth,String(form.get('school')||'')))return reply({error:'Forbidden'},403);
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
