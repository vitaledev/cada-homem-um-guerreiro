import type {NextConfig} from 'next';
const backend=process.env.API_INTERNAL_URL||'http://127.0.0.1:4187';
const config:NextConfig={output:'standalone',trailingSlash:true,poweredByHeader:false,async rewrites(){return [{source:'/api/v1/:path*',destination:backend+'/api/v1/:path*'},{source:'/media/:path*',destination:backend+'/media/:path*'},{source:'/saude/',destination:backend+'/api/v1/health'}];},async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'},{key:'Referrer-Policy',value:'same-origin'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}]}];}};
export default config;
