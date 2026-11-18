// Content-verified persistence. A CDN outage always falls back to the app origin.
export function createAssetLoader({manifest,baseURL,download,fetch:request=globalThis.fetch,cacheStorage=globalThis.caches,crypto=globalThis.crypto,configURL=new URL('asset-host.json',baseURL),onState=()=>{}}){
 const inFlight=new Map();
 let configuration;
 async function config(){
  return configuration??=(async()=>{
   try{
    const response=await request(configURL,{cache:'no-cache',signal:AbortSignal.timeout(3000)});
    if(!response.ok)return {};
    const value=await response.json();
    if(!value.baseURL)return {};
    const url=new URL(value.baseURL);
    if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)return {};
    return {baseURL:url.href.endsWith('/')?url.href:url.href+'/',layout:value.layout==='github'?'github':'content-addressed',hedgeDelayMs:Math.min(3000,Math.max(300,Number(value.hedgeDelayMs)||1200)),timeoutMs:Math.min(30000,Math.max(1000,Number(value.timeoutMs)||12000))};
   }catch{return {};}
  })();
 }
 async function valid(bytes,entry){
  if(bytes.byteLength!==entry.bytes)return false;
  // Older browsers without digest support use the origin downloader, never an
  // unverifiable persistent object or third-party CDN response.
  if(!crypto?.subtle)return false;
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('')===entry.sha256;
 }
 async function load(path,onProgress=()=>{}){
  const notify=onProgress;let reported=0;onProgress=size=>{reported=Math.max(reported,size);notify(reported);};
  const entry=manifest.assets[path];
  if(!entry)return download(new URL(path,baseURL).href,onProgress);
  if(inFlight.has(path)){
   const bytes=await inFlight.get(path);onProgress(bytes.byteLength);return bytes;
  }
  const promise=(async()=>{
   const cacheKey=new URL('_verified-assets/'+entry.sha256,baseURL).href;
   let cache;
   if(crypto?.subtle){
    try{
     cache=await cacheStorage?.open('marine-assets-v1');
     const hit=await cache?.match(cacheKey);
     if(hit){
      const bytes=new Uint8Array(await hit.arrayBuffer());
      if(await valid(bytes,entry)){onProgress(bytes.byteLength);onState({path,source:'persistent-cache'});return bytes;}
      await cache.delete(cacheKey);
     }
    }catch{cache=null;}
   }
   const host=crypto?.subtle?await config():{};
   async function origin(signal){
    const url=new URL(path,baseURL).href;
    let value=await download(url,onProgress,signal);
    if(crypto?.subtle&&!await valid(value,entry)){
     value=await download(url,onProgress,signal,true);
     if(!await valid(value,entry))throw Error('Asset integrity mismatch: '+path);
    }
    return value;
   }
   let bytes;
   const cdnPath=host.layout==='github'?entry.githubPath:entry.cdnPath;
   if(host.baseURL&&cdnPath){
    const cdnControl=new AbortController(),originControl=new AbortController();
    let startedOrigin=false,cdnProgress=false,startOrigin;
    const originPromise=new Promise((resolve,reject)=>{startOrigin=()=>{
     if(startedOrigin)return;startedOrigin=true;
     origin(originControl.signal).then(value=>resolve({bytes:value,source:'origin-fallback'}),reject);
    };});
    const timeout=setTimeout(()=>cdnControl.abort(),host.timeoutMs);
    const hedge=setTimeout(()=>{if(!cdnProgress)startOrigin();},host.hedgeDelayMs);
    const cdnPromise=(async()=>{
     try{
      const value=await download(new URL(cdnPath,host.baseURL).href,size=>{if(size>0)cdnProgress=true;onProgress(size);},cdnControl.signal);
      if(!await valid(value,entry))throw Error('CDN asset integrity mismatch');
      return {bytes:value,source:'cdn'};
     }catch(error){startOrigin();throw error;}
    })();
    try{
     const winner=await Promise.any([cdnPromise,originPromise]);bytes=winner.bytes;
     onState({path,source:winner.source});
    }finally{
     clearTimeout(timeout);clearTimeout(hedge);cdnControl.abort();originControl.abort();
    }
   }else{bytes=await origin();onState({path,source:'origin'});}
   // Cache writes must neither delay preparation nor make a successful load fail.
   if(cache){
    try{void cache.put(cacheKey,new Response(bytes,{headers:{'Content-Type':'application/octet-stream'}})).catch(()=>{});}catch{}
   }
   return bytes;
  })().catch(error=>{inFlight.delete(path);throw error;});
  inFlight.set(path,promise);
  try{const bytes=await promise;onProgress(bytes.byteLength);return bytes;}finally{inFlight.delete(path);}
 }
 return {load};
}

export async function decodeWaterData(bytes,revision){
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
 const data=JSON.parse(await new Response(stream).text());
 if(data.schema!==1||data.revision!==revision)throw Error('Incompatible prepared water data');
 const finiteArray=(a,length)=>Array.isArray(a)&&a.length===length&&a.every(Number.isFinite);
 if(!finiteArray(data.profile,128)||!finiteArray(data.volume,128*96*4)||!finiteArray(data.bounds,4)||!Array.isArray(data.opening)||data.opening.length>96||!data.opening.every(p=>finiteArray(p,3)))throw Error('Invalid prepared water data');
 return {profileData:new Float32Array(data.profile),volumeData:new Float32Array(data.volume),volumeBounds:data.bounds,opening:data.opening};
}
