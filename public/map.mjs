import {boundary} from './poland.mjs';
import {svgNode} from './charts.mjs';
import {fmt,groups} from './explorer.mjs';
// Exact PSE names only; unknown names intentionally remain unmapped.
export const locations=[
 {name:'Turów',names:['Turów'],lat:50.94583,lon:14.91472,source:'https://pl.wikipedia.org/wiki/Elektrownia_Tur%C3%B3w'},
 {name:'Bełchatów',names:['Bełchatów'],lat:51.26626,lon:19.32684,source:'https://pl.wikipedia.org/wiki/Elektrownia_Be%C5%82chat%C3%B3w'},
 {name:'Opole',names:['Opole'],lat:50.75182,lon:17.88196,source:'https://pl.wikipedia.org/wiki/Elektrownia_Opole'},
 {name:'Kozienice',names:['Kozienice 1','Kozienice 2'],lat:51.66528,lon:21.46444,source:'https://pl.wikipedia.org/wiki/Enea_Wytwarzanie'},
 {name:'Żarnowiec',names:['Żarnowiec'],lat:54.72222,lon:18.08222,source:'https://www.wikidata.org/wiki/Q1727941'},
 {name:'Gryfino',names:['Gryfino'],lat:53.20592,lon:14.463452,source:'https://pl.wikipedia.org/wiki/Elektrownia_Dolna_Odra'},
 {name:'Łaziska',names:['Łaziska 3'],lat:50.132778,lon:18.846417,source:'https://pl.wikipedia.org/wiki/Elektrownia_%C5%81aziska'},
 {name:'Połaniec',names:['Połaniec','Połaniec 2-Pasywna'],lat:50.437364,lon:21.337103,source:'https://pl.wikipedia.org/wiki/Enea_Elektrownia_Po%C5%82aniec'},
 {name:'Jaworzno',names:['Jaworzno 2 JWCD','Jaworzno 3'],lat:50.208611,lon:19.206667,source:'https://pl.wikipedia.org/wiki/Elektrownia_Jaworzno'},
 {name:'Płock',names:['Płock'],lat:52.588,lon:19.678,source:'https://www.gem.wiki/Plock_power_station'},
 {name:'Pątnów',names:['Pątnów 2'],lat:52.301111,lon:18.236111,source:'https://pl.wikipedia.org/wiki/Elektrownia_P%C4%85tn%C3%B3w'},
 {name:'Baltic Power',names:['MFW Baltic Power'],lat:55.0501,lon:17.6501,source:'https://www.thewindpower.net/windfarm_en_24033_baltic-power.php'}
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
