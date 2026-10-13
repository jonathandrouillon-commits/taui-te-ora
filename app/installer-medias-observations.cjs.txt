// TAUI TE ORA - installation médias observations
// À lancer dans le dossier racine : node installer-medias-observations.cjs
const fs=require('fs'),path=require('path');
const root=process.cwd();
const paths={api:'app/api/signalement/observations/route.ts',form:'app/components/SignalementObservationForm.tsx',page:'app/signalements/observations/[id]/page.tsx',media:'app/api/signalement/observations/media/route.ts',receipt:'app/lib/observationMediaReceipt.ts'};
const abs=(p)=>path.join(root,p);
function die(m){console.error('INSTALLATION ANNULÉE : '+m);process.exit(1);}
if(!fs.existsSync(path.join(root,'package.json')))die('Lance ce script depuis C:\\Users\\jonat\\taui-te-ora');
for(const k of ['api','form','page'])if(!fs.existsSync(abs(paths[k])))die('Fichier introuvable : '+paths[k]);
const read=(k)=>fs.readFileSync(abs(paths[k]),'utf8');
let api=read('api'),form=read('form'),page=read('page');
if(api.includes('issueObservationMediaReceipt')||form.includes('observationMediaFiles'))die('Installation déjà présente. Aucun fichier modifié.');
const target='observation_id: data.id';
if(!api.includes(target))die('Format de réponse API inconnu : envoie app/api/signalement/observations/route.ts pour adaptation.');
if(!form.includes('setSuccess(true);')||!form.includes('const data = await response.json().catch(() => ({}));')||!form.includes('Les photos et l\'analyse IA seront ajoutées'))die('Formulaire différent de la version vérifiée. Aucun fichier modifié.');
if(!page.includes('setItems(result?.observations || []);')||!page.includes('{item.comments && ('))die('Page privée différente de la version vérifiée. Aucun fichier modifié.');
api='import { issueObservationMediaReceipt } from "../../../../lib/observationMediaReceipt";\n'+api;
api=api.replace(target,target+', media_token: issueObservationMediaReceipt(data.id)');
form=form.replace('const [sending, setSending] = useState(false);',`const [observationMediaFiles, setObservationMediaFiles] = useState<File[]>([]);
  const [mediaUploadFeedback, setMediaUploadFeedback] = useState("");
  const [sending, setSending] = useState(false);`);
form=form.replace('setSuccess(true);',`let uploaded = 0;
      if (observationMediaFiles.length) {
        if (!data.observation_id || !data.media_token) {
          setMediaUploadFeedback("Témoignage enregistré, mais transfert des médias indisponible. Contactez l'équipe TAUI TE ORA.");
        } else {
          for (const file of observationMediaFiles) {
            try {
              const prepare = await fetch("/api/signalement/observations/media", {
                method: "POST", headers: {"Content-Type":"application/json"},
                body: JSON.stringify({action:"prepare", observation_id:data.observation_id, media_token:data.media_token, mime_type:file.type, file_size:file.size})
              });
              const prepared = await prepare.json();
              if (!prepare.ok) throw new Error(prepared.error || "Préparation impossible");
              const { error: uploadError } = await supabase.storage.from("observation-medias").uploadToSignedUrl(prepared.path,prepared.token,file,{contentType:file.type});
              if (uploadError) throw uploadError;
              const complete = await fetch("/api/signalement/observations/media",{
                method:"POST",headers:{"Content-Type":"application/json"},
                body:JSON.stringify({action:"complete",observation_id:data.observation_id,media_token:data.media_token,path:prepared.path,mime_type:file.type,file_size:file.size})
              });
              const result = await complete.json();
              if (!complete.ok) throw new Error(result.error || "Confirmation impossible");
              uploaded++;
            } catch (mediaError) {
              console.error("Transfert média",mediaError);
              setMediaUploadFeedback("Une pièce jointe n’a pas pu être envoyée.");
            }
          }
          if (uploaded === observationMediaFiles.length) setMediaUploadFeedback("Tous les médias ont été transmis.");
          else setMediaUploadFeedback("Témoignage enregistré. Médias transmis : " + uploaded + "/" + observationMediaFiles.length);
        }
      }
      setSuccess(true);`.replace('\u00060\u0006','"Une pièce jointe n’a pas pu être envoyée."').replace('\u00061\u0006','"Tous les médias ont été transmis."').replace('\u00062\u0006','3'.replace('\u00063\u0006','"Témoignage enregistré. Médias transmis : " + uploaded + "/" + observationMediaFiles.length')));
form=form.replace('            {feedback}\n',`            {feedback}
            {mediaUploadFeedback && <p className="mt-3 text-sm">{mediaUploadFeedback}</p>}
`);
const picker=`<div className="space-y-3 rounded-2xl bg-white p-4">
              <h3 className="text-lg font-black">5. Photos et vidéo (facultatif)</h3>
              <p className="text-sm text-[#42695f]">Jusqu'à 3 photos (8 Mo chacune) et 1 vidéo (20 Mo). Ces fichiers restent privés.</p>
              <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" multiple
                className="block w-full text-sm"
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  const photos=files.filter(f=>f.type.startsWith("image/"));
                  const videos=files.filter(f=>f.type.startsWith("video/"));
                  if (photos.length>3 || videos.length>1 || files.length>4 || files.some(f=>!(["image/jpeg","image/png","image/webp","video/mp4","video/webm","video/quicktime"].includes(f.type))) || files.some(f=>f.size>(f.type.startsWith("image/")?8:20)*1024*1024)) {
                    setFeedback("Maximum 3 photos de 8 Mo et 1 vidéo de 20 Mo. Formats JPG, PNG, WebP, MP4, WebM, MOV.");
                    setObservationMediaFiles([]);
                    event.target.value="";
                    return;
                  }
                  setFeedback(""); setObservationMediaFiles(files);
                }} />
              {observationMediaFiles.length>0 && <ul className="text-sm">{observationMediaFiles.map((f,i)=><li key={i}>✓ {f.name} ({(f.size/1024/1024).toFixed(1)} Mo)</li>)}</ul>}
            </div>`;
form=form.replace(/<p className="text-xs text-\[#42695f\]">\s*Les photos et l'analyse IA seront ajoutées\s*lors d'une prochaine étape\.\s*<\/p>/,picker);
page=page.replace('const [items, setItems] = useState<Observation[]>([]);',`const [items, setItems] = useState<Observation[]>([]);
  const [observationMedias, setObservationMedias] = useState<Array<{id:string;observation_id:string;media_type:string;url:string}>>([]);`);
page=page.replace('setItems(result?.observations || []);',`setItems(result?.observations || []);
      const mediaResponse = await fetch(4,{headers:{Authorization:5},cache:"no-store"});
      if (mediaResponse.ok) {
        const mediaData = await mediaResponse.json();
        setObservationMedias(mediaData.medias || []);
      }`.replace('\u00064\u0006','`/api/signalement/observations/media?signalement_id=${encodeURIComponent(id)}`').replace('\u00065\u0006','`Bearer ${token}`'));
page=page.replace('{item.comments && (',`{observationMedias.some(m=>m.observation_id===item.id) && (
                    <div className="mt-4 rounded-xl bg-[#eaf5f1] p-4">
                      <h3 className="font-black">Photos et vidéos du témoin (privées)</h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {observationMedias.filter(m=>m.observation_id===item.id).map(m=>(
                          <div key={m.id}>
                            {m.media_type==="photo" ? <a href={m.url} target="_blank" rel="noopener noreferrer"><img src={m.url} alt="Photo transmise par le témoin" className="w-full rounded-xl object-cover" /></a> :
                            <video controls preload="metadata" src={m.url} className="w-full rounded-xl" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.comments && (`);
const content={api,form,page,media:Buffer.from('aW1wb3J0IHsgTmV4dFJlcXVlc3QsIE5leHRSZXNwb25zZSB9IGZyb20gIm5leHQvc2VydmVyIjsKaW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSAiQHN1cGFiYXNlL3N1cGFiYXNlLWpzIjsKaW1wb3J0IHsgY3JlYXRlSG1hYywgcmFuZG9tVVVJRCwgdGltaW5nU2FmZUVxdWFsIH0gZnJvbSAibm9kZTpjcnlwdG8iOwoKZXhwb3J0IGNvbnN0IHJ1bnRpbWUgPSAibm9kZWpzIjsKY29uc3QgQlVDS0VUID0gIm9ic2VydmF0aW9uLW1lZGlhcyI7CmNvbnN0IFVSTCA9IHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX1VSTCB8fCAiIjsKY29uc3QgS0VZID0gcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWSB8fCAiIjsKY29uc3QgU0VDUkVUID0gcHJvY2Vzcy5lbnYuT0JTRVJWQVRJT05fUkFURV9MSU1JVF9TRUNSRVQgfHwgIiI7CmZ1bmN0aW9uIGFkbWluKCkgeyBpZiAoIVVSTCB8fCAhS0VZIHx8ICFTRUNSRVQpIHRocm93IG5ldyBFcnJvcigiQ29uZmlndXJhdGlvbiBzZXJ2ZXVyIG1hbnF1YW50ZSIpOyByZXR1cm4gY3JlYXRlQ2xpZW50KFVSTCwgS0VZLCB7YXV0aDp7cGVyc2lzdFNlc3Npb246ZmFsc2V9fSk7IH0KZnVuY3Rpb24gZGlnZXN0KGlkOnN0cmluZywgZXhwaXJlczpzdHJpbmcpIHsgcmV0dXJuIGNyZWF0ZUhtYWMoInNoYTI1NiIsIFNFQ1JFVCkudXBkYXRlKGBvYnNlcnZhdGlvbi1tZWRpYToke2lkfToke2V4cGlyZXN9YCkuZGlnZXN0KCJoZXgiKTsgfQpmdW5jdGlvbiB2YWxpZGF0ZVJlY2VpcHQoaWQ6c3RyaW5nLCByZWNlaXB0OnN0cmluZykgewogIGNvbnN0IFtleHBpcmVzLG1hY10gPSByZWNlaXB0LnNwbGl0KCIuIik7CiAgaWYgKCFleHBpcmVzIHx8ICFtYWMgfHwgIS9eXGQrJC8udGVzdChleHBpcmVzKSB8fCBOdW1iZXIoZXhwaXJlcyk8RGF0ZS5ub3coKSB8fCBOdW1iZXIoZXhwaXJlcyk+RGF0ZS5ub3coKSszNjAwMDAwKSByZXR1cm4gZmFsc2U7CiAgY29uc3QgZXhwZWN0ZWQgPSBCdWZmZXIuZnJvbShkaWdlc3QoaWQsZXhwaXJlcyksImhleCIpOwogIGNvbnN0IGFjdHVhbCA9IC9eWzAtOWEtZl17NjR9JC8udGVzdChtYWMpID8gQnVmZmVyLmZyb20obWFjLCJoZXgiKSA6IEJ1ZmZlci5hbGxvYygwKTsKICByZXR1cm4gZXhwZWN0ZWQubGVuZ3RoPT09YWN0dWFsLmxlbmd0aCAmJiB0aW1pbmdTYWZlRXF1YWwoZXhwZWN0ZWQsYWN0dWFsKTsKfQpmdW5jdGlvbiB2YWxpZFVVSUQodjp1bmtub3duKTp2IGlzIHN0cmluZyB7cmV0dXJuIHR5cGVvZiB2PT09InN0cmluZyIgJiYgL15bMC05YS1mXXs4fS1bMC05YS1mXXs0fS1bMS04XVswLTlhLWZdezN9LVs4OWFiXVswLTlhLWZdezN9LVswLTlhLWZdezEyfSQvaS50ZXN0KHYpO30KY29uc3QgTUlNRTpSZWNvcmQ8c3RyaW5nLHN0cmluZz49eyJpbWFnZS9qcGVnIjoicGhvdG8iLCJpbWFnZS9wbmciOiJwaG90byIsImltYWdlL3dlYnAiOiJwaG90byIsInZpZGVvL21wNCI6InZpZGVvIiwidmlkZW8vd2VibSI6InZpZGVvIiwidmlkZW8vcXVpY2t0aW1lIjoidmlkZW8ifTsKY29uc3QgRVhUOlJlY29yZDxzdHJpbmcsc3RyaW5nPj17ImltYWdlL2pwZWciOiJqcGciLCJpbWFnZS9wbmciOiJwbmciLCJpbWFnZS93ZWJwIjoid2VicCIsInZpZGVvL21wNCI6Im1wNCIsInZpZGVvL3dlYm0iOiJ3ZWJtIiwidmlkZW8vcXVpY2t0aW1lIjoibW92In07CmZ1bmN0aW9uIGZhaWwobWVzc2FnZTpzdHJpbmcsc3RhdHVzPTQwMCl7cmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHtlcnJvcjptZXNzYWdlfSx7c3RhdHVzfSk7fQpleHBvcnQgYXN5bmMgZnVuY3Rpb24gUE9TVChyZXE6TmV4dFJlcXVlc3QpewogdHJ5ewogIGNvbnN0IGJvZHk9YXdhaXQgcmVxLmpzb24oKTsgY29uc3QgaWQ9Ym9keS5vYnNlcnZhdGlvbl9pZDsgY29uc3QgcmVjZWlwdD1ib2R5Lm1lZGlhX3Rva2VuOwogIGlmKCF2YWxpZFVVSUQoaWQpfHx0eXBlb2YgcmVjZWlwdCE9PSJzdHJpbmcifHwhdmFsaWRhdGVSZWNlaXB0KGlkLHJlY2VpcHQpKXJldHVybiBmYWlsKCJBdXRvcmlzYXRpb24gZCdlbnZvaSBleHBpcsOpZSBvdSBpbnZhbGlkZSIsNDAzKTsKICBjb25zdCBkYj1hZG1pbigpOyBjb25zdCB7ZGF0YTpvYnMsZXJyb3I6b2V9PWF3YWl0IGRiLmZyb20oInNpZ25hbGVtZW50X29ic2VydmF0aW9ucyIpLnNlbGVjdCgiaWQiKS5lcSgiaWQiLGlkKS5tYXliZVNpbmdsZSgpOwogIGlmKG9lfHwhb2JzKXJldHVybiBmYWlsKCJPYnNlcnZhdGlvbiBpbnRyb3V2YWJsZSIsNDA0KTsKICBpZihib2R5LmFjdGlvbj09PSJwcmVwYXJlIil7CiAgIGNvbnN0IG1pbWU9U3RyaW5nKGJvZHkubWltZV90eXBlfHwiIik7Y29uc3QgdHlwZT1NSU1FW21pbWVdO2NvbnN0IHNpemU9TnVtYmVyKGJvZHkuZmlsZV9zaXplKTsKICAgaWYoIXR5cGV8fCFOdW1iZXIuaXNTYWZlSW50ZWdlcihzaXplKXx8c2l6ZTwxfHxzaXplPjIwOTcxNTIwfHwodHlwZT09PSJwaG90byImJnNpemU+OCoxMDI0KjEwMjQpKXJldHVybiBmYWlsKCJGb3JtYXQgb3UgdGFpbGxlIG5vbiBhdXRvcmlzw6kgKHBob3RvIDggTW8sIHZpZMOpbyAyMCBNbykiKTsKICAgY29uc3Qge2RhdGE6ZXhpc3RpbmcsZXJyb3I6ZWV9PWF3YWl0IGRiLmZyb20oInNpZ25hbGVtZW50X29ic2VydmF0aW9uX21lZGlhcyIpLnNlbGVjdCgibWVkaWFfdHlwZSIpLmVxKCJvYnNlcnZhdGlvbl9pZCIsaWQpOwogICBpZihlZSlyZXR1cm4gZmFpbCgiTGVjdHVyZSBkZXMgbcOpZGlhcyBpbXBvc3NpYmxlIiw1MDApOwogICBpZigoZXhpc3Rpbmd8fFtdKS5maWx0ZXIoeD0+eC5tZWRpYV90eXBlPT09dHlwZSkubGVuZ3RoID49ICh0eXBlPT09InBob3RvIj8zOjEpKXJldHVybiBmYWlsKCJOb21icmUgbWF4aW1hbCBkZSBtw6lkaWFzIGF0dGVpbnQiKTsKICAgY29uc3QgcGF0aD1gJHtpZH0vJHtyYW5kb21VVUlEKCl9LiR7RVhUW21pbWVdfWA7CiAgIGNvbnN0IHtkYXRhLGVycm9yfT1hd2FpdCBkYi5zdG9yYWdlLmZyb20oQlVDS0VUKS5jcmVhdGVTaWduZWRVcGxvYWRVcmwocGF0aCk7CiAgIGlmKGVycm9yfHwhZGF0YSlyZXR1cm4gZmFpbCgiUHLDqXBhcmF0aW9uIGR1IHRyYW5zZmVydCBpbXBvc3NpYmxlIiw1MDApOwogICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oe3BhdGgsdG9rZW46ZGF0YS50b2tlbn0pOwogIH0KICBpZihib2R5LmFjdGlvbj09PSJjb21wbGV0ZSIpewogICBjb25zdCBwYXRoPVN0cmluZyhib2R5LnBhdGh8fCIiKTtjb25zdCBtaW1lPVN0cmluZyhib2R5Lm1pbWVfdHlwZXx8IiIpO2NvbnN0IHR5cGU9TUlNRVttaW1lXTtjb25zdCBzaXplPU51bWJlcihib2R5LmZpbGVfc2l6ZSk7CiAgIGlmKCF0eXBlfHwhcGF0aC5zdGFydHNXaXRoKGAke2lkfS9gKXx8IS9eWy1hLWYwLTldezM2fVwuKGpwZ3xwbmd8d2VicHxtcDR8d2VibXxtb3YpJC8udGVzdChwYXRoLnNsaWNlKGlkLmxlbmd0aCsxKSl8fCFOdW1iZXIuaXNTYWZlSW50ZWdlcihzaXplKXx8c2l6ZTwxfHxzaXplPjIwOTcxNTIwfHwodHlwZT09PSJwaG90byImJnNpemU+OCoxMDI0KjEwMjQpKXJldHVybiBmYWlsKCJNw6lkaWEgaW52YWxpZGUiKTsKICAgY29uc3Qge2RhdGE6bGlzdCxlcnJvcjpsZX09YXdhaXQgZGIuc3RvcmFnZS5mcm9tKEJVQ0tFVCkubGlzdChpZCx7bGltaXQ6MTAwfSk7CiAgIGlmKGxlfHwhbGlzdD8uc29tZShmPT5mLm5hbWU9PT1wYXRoLnNsaWNlKGlkLmxlbmd0aCsxKSkpcmV0dXJuIGZhaWwoIkZpY2hpZXIgbm9uIHJlw6d1Iiw0MDApOwogICBjb25zdCB7ZGF0YTpleGlzdGluZyxlcnJvcjplZX09YXdhaXQgZGIuZnJvbSgic2lnbmFsZW1lbnRfb2JzZXJ2YXRpb25fbWVkaWFzIikuc2VsZWN0KCJtZWRpYV90eXBlIikuZXEoIm9ic2VydmF0aW9uX2lkIixpZCk7CiAgIGlmKGVlKXJldHVybiBmYWlsKCJMZWN0dXJlIGltcG9zc2libGUiLDUwMCk7CiAgIGlmKChleGlzdGluZ3x8W10pLmZpbHRlcih4PT54Lm1lZGlhX3R5cGU9PT10eXBlKS5sZW5ndGggPj0gKHR5cGU9PT0icGhvdG8iPzM6MSkpcmV0dXJuIGZhaWwoIkxpbWl0ZSBkZSBtw6lkaWFzIGF0dGVpbnRlIik7CiAgIGNvbnN0IHtlcnJvcn09YXdhaXQgZGIuZnJvbSgic2lnbmFsZW1lbnRfb2JzZXJ2YXRpb25fbWVkaWFzIikuaW5zZXJ0KHtvYnNlcnZhdGlvbl9pZDppZCxzdG9yYWdlX3BhdGg6cGF0aCxtZWRpYV90eXBlOnR5cGUsbWltZV90eXBlOm1pbWUsZmlsZV9zaXplOnNpemV9KTsKICAgaWYoZXJyb3IpcmV0dXJuIGZhaWwoIkVucmVnaXN0cmVtZW50IGR1IG3DqWRpYSBpbXBvc3NpYmxlIiw1MDApOwogICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oe29rOnRydWV9KTsKICB9CiAgcmV0dXJuIGZhaWwoIkFjdGlvbiBpbmNvbm51ZSIpOwogfWNhdGNoKGUpe2NvbnNvbGUuZXJyb3IoIk9ic2VydmF0aW9uIG1lZGlhIixlKTtyZXR1cm4gZmFpbCgiRXJyZXVyIHNlcnZldXIiLDUwMCk7fQp9CmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQocmVxOk5leHRSZXF1ZXN0KXsKIHRyeXsKICBjb25zdCBpZD1yZXEubmV4dFVybC5zZWFyY2hQYXJhbXMuZ2V0KCJzaWduYWxlbWVudF9pZCIpO2lmKCF2YWxpZFVVSUQoaWQpKXJldHVybiBmYWlsKCJJZGVudGlmaWFudCBpbnZhbGlkZSIpOwogIGNvbnN0IGJlYXJlcj1yZXEuaGVhZGVycy5nZXQoImF1dGhvcml6YXRpb24iKXx8IiI7aWYoIWJlYXJlci5zdGFydHNXaXRoKCJCZWFyZXIgIikpcmV0dXJuIGZhaWwoIkNvbm5leGlvbiBuw6ljZXNzYWlyZSIsNDAxKTsKICBjb25zdCBkYj1hZG1pbigpO2NvbnN0IHtkYXRhOmF1dGgsZXJyb3I6YWV9PWF3YWl0IGRiLmF1dGguZ2V0VXNlcihiZWFyZXIuc2xpY2UoNykpO2lmKGFlfHwhYXV0aC51c2VyKXJldHVybiBmYWlsKCJTZXNzaW9uIGludmFsaWRlIiw0MDEpOwogIGNvbnN0IHtkYXRhOnJlcG9ydCxlcnJvcjpyZX09YXdhaXQgZGIuZnJvbSgic2lnbmFsZW1lbnRzIikuc2VsZWN0KCJ1c2VyX2lkIikuZXEoImlkIixpZCkubWF5YmVTaW5nbGUoKTsKICBpZihyZXx8IXJlcG9ydClyZXR1cm4gZmFpbCgiU2lnbmFsZW1lbnQgaW50cm91dmFibGUiLDQwNCk7CiAgbGV0IGFsbG93ZWQ9cmVwb3J0LnVzZXJfaWQ9PT1hdXRoLnVzZXIuaWQ7CiAgaWYoIWFsbG93ZWQpe2NvbnN0IHtkYXRhOnByb2ZpbGV9PWF3YWl0IGRiLmZyb20oInByb2ZpbGVzIikuc2VsZWN0KCJyb2xlIikuZXEoImlkIixhdXRoLnVzZXIuaWQpLm1heWJlU2luZ2xlKCk7YWxsb3dlZD1wcm9maWxlPy5yb2xlPT09ImFkbWluIjt9CiAgaWYoIWFsbG93ZWQpcmV0dXJuIGZhaWwoIkFjY8OocyByZWZ1c8OpIiw0MDMpOwogIGNvbnN0IHtkYXRhOm9ic2VydmF0aW9ucyxlcnJvcjpvZX09YXdhaXQgZGIuZnJvbSgic2lnbmFsZW1lbnRfb2JzZXJ2YXRpb25zIikuc2VsZWN0KCJpZCIpLmVxKCJzaWduYWxlbWVudF9pZCIsaWQpOwogIGlmKG9lKXJldHVybiBmYWlsKCJPYnNlcnZhdGlvbnMgaW5kaXNwb25pYmxlcyIsNTAwKTsKICBjb25zdCBpZHM9KG9ic2VydmF0aW9uc3x8W10pLm1hcCh4PT54LmlkKTtpZighaWRzLmxlbmd0aClyZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oe21lZGlhczpbXX0pOwogIGNvbnN0IHtkYXRhOnJvd3MsZXJyb3I6bWV9PWF3YWl0IGRiLmZyb20oInNpZ25hbGVtZW50X29ic2VydmF0aW9uX21lZGlhcyIpLnNlbGVjdCgiaWQsb2JzZXJ2YXRpb25faWQsc3RvcmFnZV9wYXRoLG1lZGlhX3R5cGUsbWltZV90eXBlIikuaW4oIm9ic2VydmF0aW9uX2lkIixpZHMpOwogIGlmKG1lKXJldHVybiBmYWlsKCJNw6lkaWFzIGluZGlzcG9uaWJsZXMiLDUwMCk7CiAgY29uc3QgbWVkaWFzPVtdOwogIGZvcihjb25zdCBpdGVtIG9mIHJvd3N8fFtdKXtjb25zdCB7ZGF0YSxlcnJvcn09YXdhaXQgZGIuc3RvcmFnZS5mcm9tKEJVQ0tFVCkuY3JlYXRlU2lnbmVkVXJsKGl0ZW0uc3RvcmFnZV9wYXRoLDMwMCk7aWYoIWVycm9yJiZkYXRhPy5zaWduZWRVcmwpbWVkaWFzLnB1c2goe2lkOml0ZW0uaWQsb2JzZXJ2YXRpb25faWQ6aXRlbS5vYnNlcnZhdGlvbl9pZCxtZWRpYV90eXBlOml0ZW0ubWVkaWFfdHlwZSxtaW1lX3R5cGU6aXRlbS5taW1lX3R5cGUsdXJsOmRhdGEuc2lnbmVkVXJsfSk7fQogIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7bWVkaWFzfSk7CiB9Y2F0Y2goZSl7Y29uc29sZS5lcnJvcigiTGVjdHVyZSBvYnNlcnZhdGlvbiBtZWRpYXMiLGUpO3JldHVybiBmYWlsKCJFcnJldXIgc2VydmV1ciIsNTAwKTt9Cn0K','base64').toString('utf8'),receipt:Buffer.from('aW1wb3J0IHtjcmVhdGVIbWFjfSBmcm9tICJub2RlOmNyeXB0byI7CmV4cG9ydCBmdW5jdGlvbiBpc3N1ZU9ic2VydmF0aW9uTWVkaWFSZWNlaXB0KGlkOnN0cmluZyl7CiBjb25zdCBzZWNyZXQ9cHJvY2Vzcy5lbnYuT0JTRVJWQVRJT05fUkFURV9MSU1JVF9TRUNSRVQ7CiBpZighc2VjcmV0KXRocm93IG5ldyBFcnJvcigiT0JTRVJWQVRJT05fUkFURV9MSU1JVF9TRUNSRVQgbWFucXVhbnQiKTsKIGNvbnN0IGV4cGlyZXM9U3RyaW5nKERhdGUubm93KCkrMzAqNjAqMTAwMCk7CiBjb25zdCBtYWM9Y3JlYXRlSG1hYygic2hhMjU2IixzZWNyZXQpLnVwZGF0ZShgb2JzZXJ2YXRpb24tbWVkaWE6JHtpZH06JHtleHBpcmVzfWApLmRpZ2VzdCgiaGV4Iik7CiByZXR1cm4gYCR7ZXhwaXJlc30uJHttYWN9YDsKfQo=','base64').toString('utf8')};
const backups=path.join(root,'backup-observation-medias-'+new Date().toISOString().replace(/[:.]/g,'-'));
fs.mkdirSync(backups,{recursive:true});
for(const k of ['api','form','page'])fs.copyFileSync(abs(paths[k]),path.join(backups,k+'.bak'));
for(const k of Object.keys(paths)){
 fs.mkdirSync(path.dirname(abs(paths[k])),{recursive:true});
 fs.writeFileSync(abs(paths[k]),content[k],'utf8');
 console.log('OK '+paths[k]);
}
console.log('\nInstallation terminée. Sauvegardes : '+backups);
console.log('Lancer : node node_modules\\next\\dist\\bin\\next build');
