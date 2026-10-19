export default defineEventHandler(async event=>{
 const auth=getHeader(event,'authorization');if(!auth)throw createError({statusCode:401,statusMessage:'Authentication required'});
 const res=await fetch(`${process.env.MVG_API_BASE||'https://be-mvg.mitravisualgroup.com'}/api/marketing/pricelist-private-costs`,{headers:{Authorization:auth},signal:AbortSignal.timeout(10000)});
 if(!res.ok)throw createError({statusCode:res.status,statusMessage:'Super Admin required'});
 setResponseHeader(event,'Cache-Control','no-store');return res.json();
})
