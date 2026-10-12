import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
const BUCKET = "observation-medias";
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SECRET = process.env.OBSERVATION_RATE_LIMIT_SECRET || "";
function admin() { if (!URL || !KEY || !SECRET) throw new Error("Configuration serveur manquante"); return createClient(URL, KEY, {auth:{persistSession:false}}); }
function digest(id:string, expires:string) { return createHmac("sha256", SECRET).update(`observation-media:${id}:${expires}`).digest("hex"); }
function validateReceipt(id:string, receipt:string) {
  const [expires,mac] = receipt.split(".");
  if (!expires || !mac || !/^\d+$/.test(expires) || Number(expires)<Date.now() || Number(expires)>Date.now()+3600000) return false;
  const expected = Buffer.from(digest(id,expires),"hex");
  const actual = /^[0-9a-f]{64}$/.test(mac) ? Buffer.from(mac,"hex") : Buffer.alloc(0);
  return expected.length===actual.length && timingSafeEqual(expected,actual);
}
function validUUID(v:unknown):v is string {return typeof v==="string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);}
const MIME:Record<string,string>={"image/jpeg":"photo","image/png":"photo","image/webp":"photo","video/mp4":"video","video/webm":"video","video/quicktime":"video"};
const EXT:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","video/mp4":"mp4","video/webm":"webm","video/quicktime":"mov"};
function fail(message:string,status=400){return NextResponse.json({error:message},{status});}
export async function POST(req:NextRequest){
 try{
  const body=await req.json(); const id=body.observation_id; const receipt=body.media_token;
  if(!validUUID(id)||typeof receipt!=="string"||!validateReceipt(id,receipt))return fail("Autorisation d'envoi expirée ou invalide",403);
  const db=admin(); const {data:obs,error:oe}=await db.from("signalement_observations").select("id").eq("id",id).maybeSingle();
  if(oe||!obs)return fail("Observation introuvable",404);
  if(body.action==="prepare"){
   const mime=String(body.mime_type||"");const type=MIME[mime];const size=Number(body.file_size);
   if(!type||!Number.isSafeInteger(size)||size<1||size>20971520||(type==="photo"&&size>8*1024*1024))return fail("Format ou taille non autorisé (photo 8 Mo, vidéo 20 Mo)");
   const {data:existing,error:ee}=await db.from("signalement_observation_medias").select("media_type").eq("observation_id",id);
   if(ee)return fail("Lecture des médias impossible",500);
   if((existing||[]).filter(x=>x.media_type===type).length >= (type==="photo"?3:1))return fail("Nombre maximal de médias atteint");
   const path=`${id}/${randomUUID()}.${EXT[mime]}`;
   const {data,error}=await db.storage.from(BUCKET).createSignedUploadUrl(path);
   if(error||!data)return fail("Préparation du transfert impossible",500);
   return NextResponse.json({path,token:data.token});
  }
  if(body.action==="complete"){
   const path=String(body.path||"");const mime=String(body.mime_type||"");const type=MIME[mime];const size=Number(body.file_size);
   if(!type||!path.startsWith(`${id}/`)||!/^[-a-f0-9]{36}\.(jpg|png|webp|mp4|webm|mov)$/.test(path.slice(id.length+1))||!Number.isSafeInteger(size)||size<1||size>20971520||(type==="photo"&&size>8*1024*1024))return fail("Média invalide");
   const {data:list,error:le}=await db.storage.from(BUCKET).list(id,{limit:100});
   if(le||!list?.some(f=>f.name===path.slice(id.length+1)))return fail("Fichier non reçu",400);
   const {data:existing,error:ee}=await db.from("signalement_observation_medias").select("media_type").eq("observation_id",id);
   if(ee)return fail("Lecture impossible",500);
   if((existing||[]).filter(x=>x.media_type===type).length >= (type==="photo"?3:1))return fail("Limite de médias atteinte");
   const {error}=await db.from("signalement_observation_medias").insert({observation_id:id,storage_path:path,media_type:type,mime_type:mime,file_size:size});
   if(error)return fail("Enregistrement du média impossible",500);
   return NextResponse.json({ok:true});
  }
  return fail("Action inconnue");
 }catch(e){console.error("Observation media",e);return fail("Erreur serveur",500);}
}
export async function GET(req:NextRequest){
 try{
  const id=req.nextUrl.searchParams.get("signalement_id");if(!validUUID(id))return fail("Identifiant invalide");
  const bearer=req.headers.get("authorization")||"";if(!bearer.startsWith("Bearer "))return fail("Connexion nécessaire",401);
  const db=admin();const {data:auth,error:ae}=await db.auth.getUser(bearer.slice(7));if(ae||!auth.user)return fail("Session invalide",401);
  const {data:report,error:re}=await db.from("signalements").select("user_id").eq("id",id).maybeSingle();
  if(re||!report)return fail("Signalement introuvable",404);
  let allowed=report.user_id===auth.user.id;
  if(!allowed){const {data:profile}=await db.from("profiles").select("role").eq("id",auth.user.id).maybeSingle();allowed=profile?.role==="admin";}
  if(!allowed)return fail("Accès refusé",403);
  const {data:observations,error:oe}=await db.from("signalement_observations").select("id").eq("signalement_id",id);
  if(oe)return fail("Observations indisponibles",500);
  const ids=(observations||[]).map(x=>x.id);if(!ids.length)return NextResponse.json({medias:[]});
  const {data:rows,error:me}=await db.from("signalement_observation_medias").select("id,observation_id,storage_path,media_type,mime_type").in("observation_id",ids);
  if(me)return fail("Médias indisponibles",500);
  const medias=[];
  for(const item of rows||[]){const {data,error}=await db.storage.from(BUCKET).createSignedUrl(item.storage_path,300);if(!error&&data?.signedUrl)medias.push({id:item.id,observation_id:item.observation_id,media_type:item.media_type,mime_type:item.mime_type,url:data.signedUrl});}
  return NextResponse.json({medias});
 }catch(e){console.error("Lecture observation medias",e);return fail("Erreur serveur",500);}
}
