"use strict";
const screenEl=document.querySelector("#screen"), pop=document.querySelector("#pop"), statusEl=document.querySelector("#status");
const niveles=["Inicial","Intermedio","Avanzado"], lineas=["012","345","678","036","147","258","048","246"];
const colores={"Clásica":["#22344b","#73e8c4"],"Neón":["#321944","#fa9bff"],"Circuito":["#153b32","#b1ef75"],"Dorada":["#403024","#ffe39a"],"Campeón":["#322744","#99d9ff"]};
const perfil=Object.assign({racha:0,victorias:0,oro:false,logros:[],vistos:{},tiempos:[13,10,8],skin:"Clásica"},JSON.parse(localStorage.getItem("gato-fime-v1")||"{}"));
let banco,nombres,nivel=0,ronda=null;
function guardar(){localStorage.setItem("gato-fime-v1",JSON.stringify(perfil))}
function azar(xs){return xs[Math.floor(Math.random()*xs.length)]}
function boton(texto,accion,primario=false){const b=document.createElement("button");b.textContent=texto;b.onclick=accion;if(primario)b.className="primary";return b}
function inicio(){
 pop.close();ronda=null;statusEl.textContent="Racha · "+perfil.racha;
 screenEl.innerHTML='<nav></nav><h1>Gato numérico</h1><p>Resuelve un método para ganar tu casilla.</p><div id="play"></div><label>Dificultad <select></select></label><footer></footer>';
 screenEl.querySelector("nav").append(boton("Recompensas",premios));
 screenEl.querySelector("#play").append(boton("Jugar partida",iniciar,true));
 const s=screenEl.querySelector("select");niveles.forEach((n,i)=>s.add(new Option(n+" · "+perfil.tiempos[i]+" min",i)));s.value=nivel;s.onchange=()=>nivel=Number(s.value);
 screenEl.querySelector("footer").append(boton("Ajustar tiempos",ajustes),document.createElement("p"));screenEl.querySelector("footer p").textContent=perfil.logros.length+" de 29 métodos acreditados";
}
function ajustes(){
 pop.innerHTML="<h2>Minutos por partida</h2>"+niveles.map((n,i)=>'<label>'+n+' <input type="number" value="'+perfil.tiempos[i]+'"></label>').join("")+"<p></p>";
 pop.append(boton("Guardar",()=>{const t=Array.from(pop.querySelectorAll("input"),x=>Number(x.value));if(t.every(Number.isInteger)&&120>=t[0]&&t[0]>t[1]&&t[1]>t[2]&&t[2]>=1){perfil.tiempos=t;guardar();inicio()}else pop.querySelector("p").textContent="Usa minutos enteros descendentes entre 1 y 120."}),boton("Volver",inicio));pop.showModal()
}
function premios(){
 screenEl.innerHTML="<h1>Recompensas</h1>";const areas=[...new Set(nombres.map(n=>banco[n].area))];const completa=areas.some(a=>nombres.filter(n=>banco[n].area===a).every(n=>perfil.logros.includes(n)));
 Object.keys(colores).forEach((k,i)=>{let b=boton(k+" · "+["Disponible","3 victorias","Una categoría completa","Victoria avanzada en 8 min","29 métodos acreditados"][i],()=>{perfil.skin=k;guardar();premios()},perfil.skin===k);b.disabled=![true,perfil.victorias>=3,completa,perfil.oro,perfil.logros.length===29][i];let p=document.createElement("p");p.append(b);screenEl.append(p)});screenEl.append(boton("Inicio",inicio))
}
function iniciar(){const ahora=Date.now();ronda={inicio:ahora,fin:ahora+60000*perfil.tiempos[nivel],tab:Array(9).fill(""),yo:"X",libre:false,registro:[],usados:[]};perfil.rachaAnterior=perfil.racha;perfil.racha=0;guardar();tablero("Resuelve el reto inicial.");reto("inicio")}
function tiempo(){return Math.max(0,Math.ceil((ronda.fin-Date.now())/1000))}
function reloj(){if(!ronda)return;const t=tiempo();document.querySelectorAll("time").forEach(e=>e.textContent=Math.floor(t/60)+":"+String(t%60).padStart(2,"0"));if(!t)finalizar("Tiempo agotado")}
setInterval(reloj,200);
function vigente(){if(!ronda)return false;if(!tiempo()){finalizar("Tiempo agotado");return false}return true}
function tablero(msg){
 statusEl.innerHTML=niveles[nivel]+" · <time></time>";screenEl.innerHTML="<h1>Tu turno</h1><p></p><div id='board'></div><footer></footer>";screenEl.querySelector("p").textContent=msg+" Tu ficha: "+ronda.yo;
 const grid=screenEl.querySelector("#board");const [tile,mark]=colores[perfil.skin];grid.style.setProperty("--tile",tile);grid.style.setProperty("--mark",mark);
 ronda.tab.forEach((s,i)=>{const b=boton(s,()=>{if(!vigente())return;if(ronda.libre){ronda.libre=false;mover(i,true)}else reto(i)});b.disabled=!!s;b.setAttribute("aria-label","Casilla "+(i+1)+" "+s);grid.append(b)});screenEl.querySelector("footer").append(boton("Abandonar partida",()=>finalizar("Abandono")))
}
function reto(obj){
 let pool=nombres.filter(n=>!perfil.logros.includes(n));if(!pool.length)pool=nombres;
 let nuevos=pool.filter(n=>!ronda.usados.includes(n));if(!nuevos.length){ronda.usados=[];nuevos=pool}
 const nombre=azar(nuevos);ronda.usados.push(nombre);
 const lista=banco[nombre].niveles[nivel],clave=nombre+"-"+nivel;
 let vistos=perfil.vistos[clave]||[],libres=lista.filter(q=>!vistos.includes(q.texto));
 if(!libres.length){vistos=[];libres=lista}
 const q=azar(libres);perfil.vistos[clave]=[...vistos,q.texto];guardar();
 const item={nombre,q,estado:"Tiempo agotado",desde:Date.now(),entrada:""};ronda.registro.push(item);
 pop.innerHTML="<small>"+(obj==="inicio"?"RETO DE APERTURA":obj==="empate"?"DESEMPATE":"CASILLA "+(obj+1))+" · <time></time></small><h2></h2><p></p><form></form>";
 pop.querySelector("h2").textContent=nombre;pop.querySelector("p").textContent=(obj==="inicio"?"Acierta para elegir X u O.\n":"")+q.texto+"\nTolerancia absoluta ±0.001.";
 const form=pop.querySelector("form");q.campos.forEach(c=>{const label=document.createElement("label");label.textContent=c+" ";let e=document.createElement("input");e.inputMode="decimal";e.required=true;label.append(e);form.append(label)});
 const validar=boton("Validar respuesta",()=>{},true);validar.type="submit";form.append(validar);
 function enviar(omitir){if(!vigente())return;const raw=Array.from(form.querySelectorAll("input"),x=>x.value.trim());const nums=raw.map(x=>Number(x.replace(",",".")));if(!omitir&&raw.some((x,i)=>!x||!Number.isFinite(nums[i]))){form.querySelector("output").textContent=" Escribe números válidos.";return}
 const ok=!omitir&&nums.every((v,i)=>Math.abs(v-q.valores[i])<=.001000001);item.entrada=omitir?"Turno cedido":raw.join(" / ");item.estado=ok?"Acierto":"Sin acierto";item.hasta=Date.now();if(ok&&!perfil.logros.includes(nombre)){perfil.logros.push(nombre);guardar()}pop.close();
 if(obj==="empate")return finalizar(ok?"Victoria":"Derrota");
 if(obj==="inicio"&&ok){pop.innerHTML="<h2>Elige tu ficha</h2><time></time><p></p>";for(const f of ["X","O"])pop.append(boton(f,()=>{if(!vigente())return;ronda.yo=f;ronda.libre=true;pop.close();tablero("Elige tu primera casilla.")}));pop.showModal()}else mover(obj,ok)}
 form.onsubmit=e=>{e.preventDefault();enviar(false)};form.append(document.createElement("output"));pop.append(boton("Ceder turno",()=>enviar(true)));pop.showModal();reloj()
}
pop.oncancel=e=>{if(ronda)e.preventDefault()};
function gana(tab,f){return lineas.some(l=>[...l].every(i=>tab[i]===f))}
function mover(i,ok){
 const {tab,yo}=ronda,cpu=yo==="X"?"O":"X";if(ok)tab[i]=yo;if(gana(tab,yo))return finalizar("Victoria");
 let libres=tab.map((s,i)=>s?-1:i).filter(i=>i>=0);
 if(libres.length){let puesto;for(const f of [cpu,yo]){const opciones=libres.filter(j=>{const copia=[...tab];copia[j]=f;return gana(copia,f)});if(opciones.length){puesto=azar(opciones);break}}tab[puesto??azar(libres)]=cpu}
 if(gana(tab,cpu))return finalizar("Derrota");tablero(ok?"Elige una casilla libre.":"Cediste el turno. Elige una casilla libre.");if(tab.every(Boolean))reto("empate")
}
function finalizar(resultado){
 const r=ronda;ronda=null;pop.close();if(resultado==="Victoria"){perfil.victorias++;perfil.racha=perfil.rachaAnterior+1;if(nivel===2&&Date.now()-r.inicio<=480000)perfil.oro=true}guardar();statusEl.textContent="Racha · "+perfil.racha;screenEl.innerHTML="<h1></h1><nav></nav><h2>Revisión de la partida</h2>";screenEl.querySelector("h1").textContent=resultado;screenEl.querySelector("nav").append(boton("Volver al inicio",inicio,true));for(const item of r.registro){const p=document.createElement("p");p.textContent=item.nombre+" · "+item.estado+" · "+Math.round(((item.hasta||Date.now())-item.desde)/1000)+" s\n"+item.q.texto+"\nTu respuesta: "+(item.entrada||"Sin respuesta")+"\n"+item.q.revision+"\nReferencia: "+item.q.valores.map(x=>x.toFixed(5)).join(" / ");screenEl.append(p)}
}
fetch("retos.json").then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{banco=data;nombres=Object.keys(data);inicio()}).catch(()=>screenEl.textContent="No se pudo cargar el banco de retos. Recarga la página.");
