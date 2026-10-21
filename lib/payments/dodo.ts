import "server-only";
export const PRICE_PAISE = 29900;
export const CURRENCY = "INR";
export type DodoPayment = {
 payment_id?: string; checkout_session_id?: string; status?: string; currency?: string;
 total_amount?: number; metadata?: Record<string,string>;
 product_cart?: {product_id:string;quantity:number}[];
 customer?: {email?:string}; refund_status?:string;
};
export type DodoProduct = { product_id?:string; is_recurring?:boolean;
 price?:{type?:string;currency?:string;price?:number;pay_what_you_want?:boolean;tax_inclusive?:boolean} };
export function getDodoProductId():string {
 const id=process.env.DODO_LOVORA_PRODUCT_ID;
 if(!id || !/^pdt_[A-Za-z0-9]+$/.test(id)) throw new Error("DODO_PRODUCT_NOT_CONFIGURED");
 return id;
}
export function dodoBase():string {
 const mode=process.env.DODO_PAYMENTS_ENVIRONMENT;
 if(mode!=="test_mode" && mode!=="live_mode") throw new Error("DODO_MODE_NOT_CONFIGURED");
 return mode==="test_mode"?"https://test.dodopayments.com":"https://live.dodopayments.com";
}
export async function dodoGet<T>(route:string):Promise<T> {
 const key=process.env.DODO_PAYMENTS_API_KEY;
 if(!key) throw new Error("DODO_API_NOT_CONFIGURED");
 const response=await fetch(dodoBase()+route,{cache:"no-store",signal:AbortSignal.timeout(15000),headers:{"Authorization":"Bearer "+key}});
 if(!response.ok) throw new Error("DODO_PROVIDER_UNAVAILABLE");
 return await response.json() as T;
}
export async function dodoPost<T>(route:string,data:unknown):Promise<T>{
 const key=process.env.DODO_PAYMENTS_API_KEY;
 if(!key) throw new Error("DODO_API_NOT_CONFIGURED");
 const response=await fetch(dodoBase()+route,{method:"POST",cache:"no-store",signal:AbortSignal.timeout(15000),headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify(data)});
 if(!response.ok) throw new Error("DODO_PROVIDER_UNAVAILABLE");
 return await response.json() as T;
}
export function assertProduct(product:DodoProduct,id:string):void {
 if(product.product_id!==id || product.is_recurring!==false || product.price?.type!=="one_time_price" ||
 product.price?.currency!=="INR" || product.price?.price!==PRICE_PAISE || product.price?.pay_what_you_want===true || product.price?.tax_inclusive!==true) {
  throw new Error("DODO_PRODUCT_PRICE_MISMATCH");
 }
}
export function validPayment(payment:DodoPayment, order:{id:string;sessionId:string;email:string;paymentId?:string},product:string):boolean {
 return payment.status==="succeeded" && payment.currency===CURRENCY && payment.total_amount===PRICE_PAISE &&
 payment.metadata?.lovora_order_id===order.id && payment.checkout_session_id===order.sessionId &&
 Array.isArray(payment.product_cart) && payment.product_cart.length===1 &&
 payment.product_cart[0].product_id===product && payment.product_cart[0].quantity===1 &&
 !!payment.payment_id && (!order.paymentId || order.paymentId===payment.payment_id) &&
 typeof payment.customer?.email==="string" && payment.customer.email.trim().toLowerCase()===order.email.trim().toLowerCase() &&
 (!payment.refund_status || payment.refund_status==="none");
}
export function verifiedCheckoutURL(value:unknown):string {
 if(typeof value!=="string")throw new Error("DODO_CHECKOUT_MISSING");
 const url=new URL(value),host=process.env.DODO_PAYMENTS_ENVIRONMENT==="live_mode"?"checkout.dodopayments.com":"test.checkout.dodopayments.com";
 if(url.protocol!=="https:" || url.hostname!==host || !url.pathname.startsWith("/session/") || url.username || url.password)throw new Error("DODO_CHECKOUT_INVALID_URL");
 return url.toString();
}
