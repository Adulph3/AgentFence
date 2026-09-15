/** A narrow CLI sink that can abandon a backpressured diagnostic on interruption. */
export interface CallbackTextSink {
  write(text:string,callback:(error?:Error|null)=>void):unknown;
}
export const writeInterruptibly=(stream:CallbackTextSink,text:string,signal?:AbortSignal):Promise<void>=>new Promise((resolve,reject)=>{
 let settled=false;
 const cleanup=()=>signal?.removeEventListener('abort',onAbort);
 const succeed=()=>{if(settled)return;settled=true;cleanup();resolve();};
 const fail=(error:unknown)=>{if(settled)return;settled=true;cleanup();reject(error);};
 const onAbort=()=>fail(new Error('AF_INTERRUPTED'));
 if(signal?.aborted){onAbort();return;}
 signal?.addEventListener('abort',onAbort,{once:true});
 try{stream.write(text,error=>error?fail(error):succeed());}catch(error){fail(error);}
});
