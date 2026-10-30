/* Marca da loja: cor principal com contraste automático e logo (horizontal centraliza; vertical fica à esquerda) */
(function(){
 const hex=h=>{h=String(h||"").trim().replace(/^#/,"");if(/^[0-9a-f]{3}$/i.test(h))h=h.split("").map(c=>c+c).join("");return /^[0-9a-f]{6}$/i.test(h)?h.toLowerCase():null};
 const canal=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
 const lum=h=>{const n=parseInt(h,16);return 0.2126*canal(n>>16&255)+0.7152*canal(n>>8&255)+0.0722*canal(n&255)};
 const textoSobre=cor=>{const h=hex(cor);if(!h)return"#111111";const L=lum(h);return (L+0.05)/0.05>1.05/(L+0.05)?"#000000":"#ffffff"};
 const orientacao=(w,h)=>w>=h?"horizontal":"vertical";
 const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 function aplica(b){const cor=hex(b&&b.cor),r=document.documentElement.style;if(cor){r.setProperty("--ac","#"+cor);r.setProperty("--on",textoSobre(cor))}else{r.removeProperty("--ac");r.removeProperty("--on")}}
 function html(b,nome){if(!b||!b.logoUrl)return"";return '<div class="marca '+(b.logoOrient==="vertical"?"esq":"cen")+'" style="margin:6px 0 10px"><img src="'+esc(b.logoUrl)+'" alt="'+esc(nome)+'" style="max-height:72px;max-width:100%;object-fit:contain"></div>'}
 window.MARCA={hex,textoSobre,orientacao,aplica,html,esc};
})();
