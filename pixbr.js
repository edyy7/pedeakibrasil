/* PedeAí · Pix com valor e ID do pedido (BR Code) + QR Code, sem internet.
   Camada de geração abstraída: PIX_PROVIDER.gerar(pedido) → {copiaecola}. Hoje: Pix manual (chave da loja).
   Para trocar por gateway no futuro, basta substituir window.PIX_PROVIDER. */
(function(){
const crc16=s=>{let c=0xFFFF;for(let i=0;i<s.length;i++){c^=s.charCodeAt(i)<<8;for(let j=0;j<8;j++)c=(c&0x8000)?((c<<1)^0x1021)&0xFFFF:(c<<1)&0xFFFF}return c.toString(16).toUpperCase().padStart(4,"0")};
const f=(id,v)=>id+String(v.length).padStart(2,"0")+v;
const ascii=(s,n)=>(String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Za-z0-9 .\-]/g," ").trim().toUpperCase().slice(0,n))||"LOJA";
function payload(o){const mai=f("00","br.gov.bcb.pix")+f("01",String(o.chave||"").trim());
 const tx=String(o.txid||"***").replace(/[^A-Za-z0-9]/g,"").slice(0,25)||"***";
 let p=f("00","01")+f("01","12")+f("26",mai)+f("52","0000")+f("53","986")+(o.valor>0?f("54",Number(o.valor).toFixed(2)):"")+f("58","BR")+f("59",ascii(o.nome,25))+f("60",ascii(o.cidade||"BRASIL",15))+f("62",f("05",tx));
 p+="6304";return p+crc16(p)}
/* ---- QR Code (byte, correção M, mascara 0, versões 1–15) ---- */
const ECC=[-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24],NBL=[-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10];
const mul=(x,y)=>{let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x}return z&255};
const rsDiv=d=>{const r=new Array(d).fill(0);r[d-1]=1;let root=1;for(let i=0;i<d;i++){for(let j=0;j<r.length;j++){r[j]=mul(r[j],root);if(j+1<r.length)r[j]^=r[j+1]}root=mul(root,2)}return r};
const rsRem=(data,div)=>{const r=div.map(()=>0);for(const b of data){const fa=b^r.shift();r.push(0);div.forEach((c,i)=>r[i]^=mul(c,fa))}return r};
const raw=v=>{let r=(16*v+128)*v+64;if(v>=2){const n=Math.floor(v/7)+2;r-=(25*n-10)*n-55;if(v>=7)r-=36}return r};
const dcw=v=>Math.floor(raw(v)/8)-ECC[v]*NBL[v];
function qr(text){const by=Array.from(new TextEncoder().encode(text));let ver=1;
 for(;ver<=15;ver++){const cc=ver<=9?8:16;if(4+cc+8*by.length<=dcw(ver)*8)break}
 if(ver>15)throw new Error("texto longo demais para o QR");
 const bits=[];const put=(v,n)=>{for(let i=n-1;i>=0;i--)bits.push((v>>>i)&1)};
 put(4,4);put(by.length,ver<=9?8:16);by.forEach(b=>put(b,8));
 const cap=dcw(ver)*8;put(0,Math.min(4,cap-bits.length));while(bits.length%8)bits.push(0);
 const data=[];for(let i=0;i<bits.length;i+=8){let b=0;for(let j=0;j<8;j++)b=(b<<1)|bits[i+j];data.push(b)}
 for(let p=0xEC;data.length<dcw(ver);p^=0xEC^0x11)data.push(p);
 const nb=NBL[ver],el=ECC[ver],rc=Math.floor(raw(ver)/8),ns=nb-rc%nb,sl=Math.floor(rc/nb),div=rsDiv(el),blocks=[];
 for(let i=0,k=0;i<nb;i++){const d=data.slice(k,k+sl-el+(i<ns?0:1));k+=d.length;const e=rsRem(d,div);if(i<ns)d.push(0);blocks.push(d.concat(e))}
 const out=[];for(let i=0;i<blocks[0].length;i++)blocks.forEach((b,j)=>{if(i!==sl-el||j>=ns)out.push(b[i])});
 const n=ver*4+17,M=Array.from({length:n},()=>new Array(n).fill(false)),FN=Array.from({length:n},()=>new Array(n).fill(false));
 const set=(x,y,v)=>{M[y][x]=v;FN[y][x]=true};
 for(let i=0;i<n;i++){set(6,i,i%2==0);set(i,6,i%2==0)}
 const fin=(cx,cy)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),x=cx+dx,y=cy+dy;if(x>=0&&x<n&&y>=0&&y<n)set(x,y,d!==2&&d!==4)}};
 fin(3,3);fin(n-4,3);fin(3,n-4);
 let pos=[];if(ver>1){const na=Math.floor(ver/7)+2,st=ver===32?26:Math.ceil((ver*4+4)/(na*2-2))*2;pos=[6];for(let p=n-7;pos.length<na;p-=st)pos.splice(1,0,p)}
 pos.forEach((a,i)=>pos.forEach((b,j)=>{if((i===0&&j===0)||(i===0&&j===pos.length-1)||(i===pos.length-1&&j===0))return;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(a+dx,b+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}));
 const fb=(()=>{const d=(0<<3)|0;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);return((d<<10)|r)^0x5412})(),g=(v,i)=>((v>>>i)&1)!==0;
 for(let i=0;i<=5;i++)set(8,i,g(fb,i));set(8,7,g(fb,6));set(8,8,g(fb,7));set(7,8,g(fb,8));for(let i=9;i<15;i++)set(14-i,8,g(fb,i));
 for(let i=0;i<8;i++)set(n-1-i,8,g(fb,i));for(let i=8;i<15;i++)set(8,n-15+i,g(fb,i));set(8,n-8,true);
 if(ver>=7){let r=ver;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const vb=(ver<<12)|r;for(let i=0;i<18;i++){const a=n-11+i%3,b=Math.floor(i/3);set(a,b,g(vb,i));set(b,a,g(vb,i))}}
 let i=0;for(let right=n-1;right>=1;right-=2){if(right===6)right=5;for(let v=0;v<n;v++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?n-1-v:v;if(!FN[y][x]&&i<out.length*8){M[y][x]=g(out[i>>>3],7-(i&7));i++}}}
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(!FN[y][x]&&(x+y)%2===0)M[y][x]=!M[y][x];
 return M}
function qrSvg(text,px){const M=qr(text),n=M.length,q=4;let d="";M.forEach((r,y)=>r.forEach((v,x)=>{if(v)d+="M"+(x+q)+" "+(y+q)+"h1v1h-1z"}));
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(n+2*q)+' '+(n+2*q)+'" width="'+(px||240)+'" height="'+(px||240)+'" shape-rendering="crispEdges" role="img" aria-label="QR Code Pix"><rect width="100%" height="100%" fill="#fff"/><path d="'+d+'" fill="#000"/></svg>'}
const api={payload,crc16,qr,qrSvg};
window.PIXBR=api;
window.PIX_PROVIDER=window.PIX_PROVIDER||{nome:"manual",gerar:async p=>({copiaecola:payload(p)})};
if(typeof module!=="undefined")module.exports=api;
})();
