import {boundary} from './poland.mjs';
import {svgNode} from './charts.mjs';
import {fmt,groups} from './explorer.mjs';
// Exact PSE names only; unknown names intentionally remain unmapped.
export const locations=[
 {name:'Turów',names:['Turów'],lat:50.94583,lon:14.91472,source:'https://en.wikipedia.org/wiki/Tur%C3%B3w_Power_Station'},
 {name:'Bełchatów',names:['Bełchatów'],lat:51.26626,lon:19.32684,source:'https://www.wikidata.org/wiki/Q1546242'},
 {name:'Opole',names:['Opole'],lat:50.75182,lon:17.88196,source:'https://www.gem.wiki/Opole_power_station'},
 {name:'Kozienice',names:['Kozienice 1','Kozienice 2'],lat:51.66528,lon:21.46444,source:'https://www.wikidata.org/wiki/Q1786153'},
 {name:'Żarnowiec',names:['Żarnowiec'],lat:54.72222,lon:18.08222,source:'https://www.wikidata.org/wiki/Q1727941'}
];
export function drawMap(data,host,list,note,onSelect){
 host.replaceChildren();list.replaceChildren();if(!data){note.textContent='Mapa czeka na dane wybranego dnia.';return;}
 const all=groups(data.units),mapped=locations.map(site=>({...site,plants:all.filter(g=>site.names.includes(g.plant))})).filter(s=>s.plants.length);
 const count=mapped.reduce((sum,s)=>sum+s.plants.length,0);note.textContent=`Przypisano lokalizacje dla ${count} z ${all.length} pozycji raportu. Mapa nie jest pełnym wykazem instalacji w Polsce.`;
 const xy=([lon,lat])=>[30+(lon-14)*43,30+(55-lat)*69];
 const svg=svgNode('svg',{viewBox:'0 0 500 465',role:'group','aria-label':'Mapa elektrowni w Polsce'});
 for(const ring of boundary)svg.append(svgNode('path',{d:ring.map((p,i)=>(i?'L':'M')+xy(p).join(',')).join(' ')+'Z',fill:'#edf2e8',stroke:'#bdcbb9','stroke-width':1.5}));
 const max=Math.max(1,...mapped.map(s=>s.plants.reduce((v,p)=>v+p.energy,0)));
 for(const site of mapped){const energy=site.plants.reduce((v,p)=>v+p.energy,0),[cx,cy]=xy([site.lon,site.lat]);const mark=svgNode('g');const title=svgNode('title',{},site.name+': '+fmt(energy/1000)+' GWh');mark.append(title,svgNode('circle',{cx,cy,r:energy>0?Math.sqrt(energy/max)*23:3,fill:energy>0?'#3e765a':'white','fill-opacity':.75,stroke:'#254c39','stroke-width':2}));svg.append(mark,svgNode('text',{x:cx,y:cy-29,'text-anchor':'middle'},site.name));
 for(const plant of site.plants){const button=document.createElement('button');button.textContent=plant.plant+' · '+fmt(plant.energy/1000)+' GWh';button.addEventListener('click',()=>onSelect(plant));list.append(button);}
 mark.style.cursor='pointer';mark.setAttribute('tabindex','0');mark.setAttribute('role','button');mark.setAttribute('aria-label','Otwórz '+site.name);const activate=()=>{if(site.plants.length===1)onSelect(site.plants[0]);else {const choices=[...list.querySelectorAll('button')];choices.find(b=>b.textContent.startsWith(site.plants[0].plant+' ·'))?.focus();}};mark.addEventListener('click',activate);mark.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
 }
 host.append(svg);
}
