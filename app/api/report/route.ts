import { NextRequest,NextResponse } from "next/server";
import { REPORT_COOKIE,verifyAccess } from "@/lib/report/access";
import { getReport } from "@/lib/report/store";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(request:NextRequest){
  const noStore={"Cache-Control":"private, no-store"};
  const access=verifyAccess(request.cookies.get(REPORT_COOKIE)?.value);
  if(!access)return NextResponse.json({ok:false,error:"A verified report purchase is required."},{status:403,headers:noStore});
  try{
    const report=await getReport(access.reportId);
    if(!report)return NextResponse.json({ok:false,error:"Report not found or expired. Contact support with your payment email."},{status:404,headers:noStore});
    return NextResponse.json({ok:true,report},{headers:noStore});
  }catch{
    return NextResponse.json({ok:false,error:"The report service is temporarily unavailable."},{status:503,headers:noStore});
  }
}
