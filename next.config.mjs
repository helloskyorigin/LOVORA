/** @type {import('next').NextConfig} */
const nextConfig={
 async headers(){
  return [{source:"/recover/verify",headers:[
   {key:"Referrer-Policy",value:"no-referrer"},
   {key:"Cache-Control",value:"private, no-store"},
   {key:"X-Robots-Tag",value:"noindex, nofollow"},
  ]}];
 }
};
export default nextConfig;
