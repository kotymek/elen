import {boundary} from './poland.mjs';
import {svgNode} from './charts.mjs';
import {fmt,groups} from './explorer.mjs';
// Exact PSE names only; unknown names intentionally remain unmapped.
export const locations=[
 {name:'Baltic Power',names:['MFW Baltic Power'],lat:55.0501,lon:17.6501,source:'https://www.thewindpower.net/windfarm_en_24033_baltic-power.php'},
 {name:'Bełchatów',names:['Bełchatów'],lat:51.26626,lon:19.32684,source:'https://pl.wikipedia.org/wiki/Elektrownia_Be%C5%82chat%C3%B3w'},
 {name:'Gryfino',names:['Gryfino'],lat:53.20592,lon:14.463452,source:'https://pl.wikipedia.org/wiki/Elektrownia_Dolna_Odra'},
 {name:'Jaworzno',names:['Jaworzno 2 JWCD','Jaworzno 3'],lat:50.208611,lon:19.206667,source:'https://pl.wikipedia.org/wiki/Elektrownia_Jaworzno'},
 {name:'Kozienice',names:['Kozienice 1','Kozienice 2'],lat:51.66528,lon:21.46444,source:'https://pl.wikipedia.org/wiki/Enea_Wytwarzanie'},
 {name:'Łagisza',names:['Łagisza'],lat:50.349444,lon:19.1475,source:'https://pl.wikipedia.org/wiki/Elektrownia_%C5%81agisza'},
 {name:'Łaziska',names:['Łaziska 3'],lat:50.132778,lon:18.846417,source:'https://pl.wikipedia.org/wiki/Elektrownia_%C5%81aziska'},
 {name:'Opole',names:['Opole'],lat:50.75182,lon:17.88196,source:'https://pl.wikipedia.org/wiki/Elektrownia_Opole'},
 {name:'Ostrołęka',names:['Ostrołęka B'],lat:53.104167,lon:21.613056,source:'https://pl.wikipedia.org/wiki/Energa_Elektrownie_Ostro%C5%82%C4%99ka'},
 {name:'Pątnów',names:['Pątnów 2'],lat:52.301111,lon:18.236111,source:'https://pl.wikipedia.org/wiki/Elektrownia_P%C4%85tn%C3%B3w'},
 {name:'Płock',names:['Płock'],lat:52.588,lon:19.678,source:'https://www.gem.wiki/Plock_power_station'},
 {name:'Połaniec',names:['Połaniec','Połaniec 2-Pasywna'],lat:50.437364,lon:21.337103,source:'https://pl.wikipedia.org/wiki/Enea_Elektrownia_Po%C5%82aniec'},
 {name:'Rybnik',names:['Rybnik'],lat:50.133083,lon:18.526278,source:'https://pl.wikipedia.org/wiki/Elektrownia_Rybnik'},
 {name:'Siersza',names:['Siersza'],lat:50.206111,lon:19.4625,source:'https://pl.wikipedia.org/wiki/Elektrownia_Siersza'},
 {name:'Skawina',names:['Skawina'],lat:49.975889,lon:19.803889,source:'https://pl.wikipedia.org/wiki/Elektrownia_Skawina'},
 {name:'Turów',names:['Turów'],lat:50.94583,lon:14.91472,source:'https://pl.wikipedia.org/wiki/Elektrownia_Tur%C3%B3w'},
 {name:'EC Chorzów',names:['Chorzów'],lat:50.31,lon:18.97,source:'https://pl.wikipedia.org/wiki/Elektrociep%C5%82ownia_Chorz%C3%B3w'},
 {name:'EC Czechnica',names:['EC Czechnica-2'],lat:51.037778,lon:17.150278,source:'https://pl.wikipedia.org/wiki/Elektrociep%C5%82ownia_Czechnica'},
 {name:'EC Karolin',names:['Karolin 2'],lat:52.433861,lon:16.981778,source:'https://pl.wikipedia.org/wiki/Veolia_Energia_Pozna%C5%84'},
 {name:'EC Katowice',names:['Katowice'],lat:50.285611,lon:19.053528,source:'https://pl.wikipedia.org/wiki/Elektrociep%C5%82ownia_Katowice'},
 {name:'EC Kraków Łęg',names:['Kraków Łęg'],lat:50.052917,lon:20.00525,source:'https://pl.wikipedia.org/wiki/Elektrociep%C5%82ownia_Krak%C3%B3w'},
 {name:'EC Łódź',names:['EC Łódź-4'],lat:51.745556,lon:19.537778,source:'https://pl.wikipedia.org/wiki/Veolia_Energia_%C5%81%C3%B3d%C5%BA'},
 {name:'EC Rzeszów',names:['EC Rzeszów'],lat:50.065,lon:22.029861,source:'https://pl.wikipedia.org/wiki/Elektrociep%C5%82ownia_Rzesz%C3%B3w'},
 {name:'EC Siekierki',names:['EC Siekierki'],lat:52.189722,lon:21.089444,source:'https://pl.wikipedia.org/wiki/Elektrociep%C5%82ownia_Siekierki'},
 {name:'EC Stalowa Wola',names:['EC Stalowa Wola'],lat:50.550439,lon:22.075967,source:'https://pl.wikipedia.org/wiki/Elektrownia_Stalowa_Wola'},
 {name:'EC Włocławek',names:['EC Włocławek'],lat:52.7074,lon:18.9589,source:'https://www.gem.wiki/W%C5%82oc%C5%82awek_power_station'},
 {name:'EC Wrocław',names:['Wrocław'],lat:51.12375,lon:17.025306,source:'https://pl.wikipedia.org/wiki/Elektrociep%C5%82ownia_Wroc%C5%82aw'},
 {name:'EC Wrotków',names:['EC Wrotków'],lat:51.21648,lon:22.55846,source:'https://pl.wikipedia.org/wiki/Elektrociep%C5%82ownia_Lublin-Wrotk%C3%B3w'},
 {name:'EC Zielona Góra',names:['Zielona Góra'],lat:51.950997,lon:15.490412,source:'https://pl.wikipedia.org/wiki/Elektrociep%C5%82ownia_Zielona_G%C3%B3ra'},
 {name:'EC Żerań',names:['EC Żerań 2'],lat:52.294944,lon:20.993139,source:'https://pl.wikipedia.org/wiki/Elektrociep%C5%82ownia_%C5%BBera%C5%84'},
 {name:'Porąbka Żar',names:['Porąbka Żar'],lat:49.787222,lon:19.23,source:'https://pl.wikipedia.org/wiki/Elektrownia_Por%C4%85bka-%C5%BBar'}, 
 {name:'Żarnowiec',names:['Żarnowiec'],lat:54.722222,lon:18.082222,source:'https://pl.wikipedia.org/wiki/Elektrownia_Wodna_%C5%BBarnowiec'},
 {name:'PV Zwartowo',names:['Zwartowo'],lat:54.6971,lon:17.8064,source:'https://www.gem.wiki/Zwartowo_solar_farm'}
];
export function drawMap(data,host,list,note,onSelect){
 host.replaceChildren();list.replaceChildren();if(!data){note.textContent='Mapa czeka na dane wybranego dnia.';return;}
 const all=groups(data.units),mapped=locations.map(site=>({...site,plants:all.filter(g=>site.names.includes(g.plant))})).filter(s=>s.plants.length);
 const count=mapped.reduce((sum,s)=>sum+s.plants.length,0);note.textContent=`Przypisano lokalizacje dla ${count} z ${all.length} pozycji raportu. Mapa nie jest pełnym wykazem instalacji w Polsce.`;
 const xy=([lon,lat])=>[30+(lon-14)*43,30+(55-lat)*69];
 const svg=svgNode('svg',{viewBox:'0 0 500 465',role:'group','aria-label':'Mapa elektrowni w Polsce'});
 for(const ring of boundary)svg.append(svgNode('path',{d:ring.map((p,i)=>(i?'L':'M')+xy(p).join(',')).join(' ')+'Z',fill:'#edf2e8',stroke:'#bdcbb9','stroke-width':1.5}));
 const readout=document.createElement('p');readout.className='map-readout';readout.textContent='Wskaż punkt, aby zobaczyć nazwę i produkcję.';host.append(readout);
 const max=Math.max(1,...mapped.map(s=>s.plants.reduce((v,p)=>v+p.energy,0)));
 for(const site of mapped){const energy=site.plants.reduce((v,p)=>v+p.energy,0),[cx,cy]=xy([site.lon,site.lat]);const mark=svgNode('g');const title=svgNode('title',{},site.name+': '+fmt(energy/1000)+' GWh');mark.append(title,svgNode('circle',{cx,cy,r:energy>0?Math.sqrt(energy/max)*23:3,fill:energy>0?'#3e765a':'white','fill-opacity':.75,stroke:'#254c39','stroke-width':2}));svg.append(mark);
 for(const plant of site.plants){const button=document.createElement('button');button.textContent=plant.plant+' · '+fmt(plant.energy/1000)+' GWh';button.addEventListener('click',()=>onSelect(plant));list.append(button);}
 const identify=()=>{readout.textContent=site.name+' · '+fmt(energy/1000)+' GWh';};mark.addEventListener('pointerenter',identify);mark.addEventListener('focus',identify);
 mark.style.cursor='pointer';mark.setAttribute('tabindex','0');mark.setAttribute('role','button');mark.setAttribute('aria-label','Otwórz '+site.name);const activate=()=>{if(site.plants.length===1)onSelect(site.plants[0]);else {const choices=[...list.querySelectorAll('button')];choices.find(b=>b.textContent.startsWith(site.plants[0].plant+' ·'))?.focus();}};mark.addEventListener('click',activate);mark.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
 }
 host.append(svg);
}
