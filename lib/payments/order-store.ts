import "server-only";
import {createCipheriv,createDecipheriv,createHash,randomBytes} from "node:crypto";
import type {JourneyDraft} from "../context";

export type OrderStatus="pending"|"paid"|"ready"|"failed"|"revoked";
export type PaidOrder={
 id:string;email:string;sessionId:string;paymentId:string;
 status:OrderStatus;reportId:string;encryptedDraft:string;createdAt:string;
};
const PREFIX="lovora:order:v1:";
const DURATION=60*60*24*90;
function orderKey(id:string){
 if(!/^[a-f0-9-]{36}$/.test(id))throw new Error("INVALID_ORDER_ID");
 return PREFIX+id;
}
export async function redis(args:(string|number)[]):Promise<unknown>{
 const host=process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/,"");
 const token=process.env.UPSTASH_REDIS_REST_TOKEN;
 if(!host||!token)throw new Error("PAYMENT_STORAGE_NOT_CONFIGURED");
 const response=await fetch(host,{method:"POST",cache:"no-store",
  signal:AbortSignal.timeout(12500),headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(args)});
 if(!response.ok)throw new Error("PAYMENT_STORAGE_UNAVAILABLE");
 const obj=await response.json() as {result?:unknown;error?:string};
 if(obj.error)throw new Error("PAYMENT_STORAGE_UNAVAILABLE");
 return obj.result;
}
export async function createOrder(order:PaidOrder){
 const entries=Object.entries(order).flatMap(([name,value])=>[name,value]);
 await redis(["HSET",orderKey(order.id),...entries]);
 await redis(["EXPIRE",orderKey(order.id),DURATION]);
}
export async function readOrder(id:string):Promise<PaidOrder|null>{
 if(!/^[a-f0-9-]{36}$/.test(id))return null;
 const value=await redis(["HGETALL",orderKey(id)]);
 if(!Array.isArray(value)||value.length<4)return null;
 const out:Record<string,string>={};
 for(let i=0;i<value.length;i+=2)if(typeof value[i]==="string"&&typeof value[i+1]==="string")out[value[i]]=value[i+1];
 if(out.id!==id||!out.status)return null;
 return {id:out.id,email:out.email||"",sessionId:out.sessionId||"",paymentId:out.paymentId||"",
 status:out.status as OrderStatus,reportId:out.reportId||"",encryptedDraft:out.encryptedDraft||"",createdAt:out.createdAt||""};
}
export async function patchOrder(id:string,updates:Partial<Omit<PaidOrder,"id">>){
 const entries=Object.entries(updates).flatMap(([name,value])=>[name,value]);
 if(entries.length)await redis(["HSET",orderKey(id),...entries]);
}
export async function limitAttempts(key:string,max:number,windowSeconds:number){
 const number=Number(await redis(["INCR","lovora:payment:rate:"+key]));
 if(number===1)await redis(["EXPIRE","lovora:payment:rate:"+key,windowSeconds]);
 return number<=max;
}
export async function lockFulfillment(orderId:string):Promise<string|null>{
 const token=randomBytes(16).toString("hex");
 const result=await redis(["SET",orderKey(orderId)+":lock",token,"EX",120,"NX"]);
 return result==="OK"?token:null;
}
export async function unlockFulfillment(orderId:string,token:string){
 await redis(["EVAL","if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end",1,orderKey(orderId)+":lock",token]);
}
function snapshotKey(){
 const secret=process.env.REPORT_ENCRYPTION_SECRET||process.env.BIRTH_SESSION_SECRET;
 if(!secret||secret.length<32)throw new Error("REPORT_SECRET_MISSING");
 return createHash("sha256").update("lovora-checkout:"+secret).digest();
}
export function encodeDraft(draft:JourneyDraft){
 const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",snapshotKey(),iv);
 const data=Buffer.concat([cipher.update(JSON.stringify(draft),"utf8"),cipher.final()]);
 return [iv,cipher.getAuthTag(),data].map(x=>x.toString("base64url")).join(".");
}
export function decodeDraft(payload:string):JourneyDraft {
 const pieces=payload.split(".");
 if(pieces.length!==3)throw new Error("INVALID_ORDER_DATA");
 const [iv,tag,data]=pieces.map(x=>Buffer.from(x,"base64url"));
 if(iv.length!==12||tag.length!==16)throw new Error("INVALID_ORDER_DATA");
 const dec=createDecipheriv("aes-256-gcm",snapshotKey(),iv);dec.setAuthTag(tag);
 const draft=JSON.parse(Buffer.concat([dec.update(data),dec.final()]).toString("utf8")) as JourneyDraft;
 if(!draft.relationship||!draft.timeKnown||!draft.birthTime||!draft.place?.timezone)throw new Error("INVALID_ORDER_DATA");
 return draft;
}
