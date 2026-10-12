import {createHmac} from "node:crypto";
export function issueObservationMediaReceipt(id:string){
 const secret=process.env.OBSERVATION_RATE_LIMIT_SECRET;
 if(!secret)throw new Error("OBSERVATION_RATE_LIMIT_SECRET manquant");
 const expires=String(Date.now()+30*60*1000);
 const mac=createHmac("sha256",secret).update(`observation-media:${id}:${expires}`).digest("hex");
 return `${expires}.${mac}`;
}
