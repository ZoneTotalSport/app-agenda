// ==========================================
// AGENDA SCOLAIRE EPS — Zone Total Sport
// ==========================================

// --- DATA ---
var holidays = {
  '01-01':{name:"Nouvel An",icon:"🎉",off:true},'02-14':{name:"St-Valentin",icon:"❤️"},'03-17':{name:"St-Patrick",icon:"☘️"},
  '04-01':{name:"Poisson d'avril",icon:"🐟"},'04-22':{name:"Jour de la Terre",icon:"🌍"},'06-24':{name:"St-Jean-Baptiste",icon:"⚜️",off:true},
  '07-01':{name:"Fête du Canada",icon:"🇨🇦",off:true},'10-31':{name:"Halloween",icon:"🎃"},'11-11':{name:"Jour du Souvenir",icon:"🌺"},
  '12-25':{name:"Noël",icon:"🎄",off:true},
  '2025-04-20':{name:"Pâques",icon:"🐰",off:true},'2025-04-21':{name:"Lundi de Pâques",icon:"🐰",off:true},
  '2025-10-13':{name:"Action de grâce",icon:"🦃",off:true},
  '2026-04-05':{name:"Pâques",icon:"🐰",off:true},'2026-04-06':{name:"Lundi de Pâques",icon:"🐰",off:true}
};

function generateGroups(){
  var g=[{id:'libre',name:'Libre',color:'#555'},{id:'autre',name:'Autre...',color:'#888'}];
  var colors={0:'#FF924C',1:'#FF595E',2:'#8AC926',3:'#6A4C93',4:'#1982C4',5:'#FFCA3A',6:'#FF1744'};
  for(var grade=0;grade<=6;grade++){
    for(var i=1;i<=4;i++){
      var num=grade+'0'+i; var dn=grade===0?'00'+i:num;
      g.push({id:dn,name:'Gr. '+dn,color:colors[grade]||'#ccc'});
    }
    for(var i=1;i<=4;i++){
      var num=grade+'1'+i; var dn=grade===0?'01'+i:num;
      g.push({id:dn,name:'Gr. '+dn,color:colors[grade]||'#ccc'});
    }
  }
  return g;
}

var groups=generateGroups();
var periodsPerDay=parseInt(localStorage.getItem('agenda_periods')||'5');
var nav=0;
var clickedDate=null;
var events=JSON.parse(localStorage.getItem('agenda_events')||'{}');
var weeklyData=JSON.parse(localStorage.getItem('agenda_weekly')||'{}');
var currentHebdoKey=null;
var currentHebdoDayIndex=null;

// --- TABS ---
function switchTab(name){
  document.querySelectorAll('.view-section').forEach(function(s){s.classList.remove('view-active');});
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('tab-active');});
  document.getElementById('view-'+name).classList.add('view-active');
  document.querySelector('[data-tab="'+name+'"]').classList.add('tab-active');
  if(name==='hebdo') renderHebdo();
}

// --- INIT ---
document.getElementById('periodsCount').value=periodsPerDay;
var gNotes=localStorage.getItem('agenda_global_notes');
if(gNotes) document.getElementById('globalNotes').value=gNotes;

// --- CALENDAR ---
function loadCalendar(){
  var dt=new Date();
  if(nav!==0) dt.setMonth(new Date().getMonth()+nav);
  var month=dt.getMonth(), year=dt.getFullYear();
  var daysInMonth=new Date(year,month+1,0).getDate();
  var paddingDays=new Date(year,month,1).getDay();
  var mStr=dt.toLocaleDateString('fr-FR',{month:'long'})+' '+year;
  document.getElementById('monthDisplay').innerText=mStr.toUpperCase();
  var cal=document.getElementById('calendarBody');
  cal.innerHTML='';
  for(var p=0;p<paddingDays;p++){
    var e=document.createElement('div'); e.className='cal-cell empty'; cal.appendChild(e);
  }
  var todayStr=new Date().toISOString().split('T')[0];
  for(var i=1;i<=daysInMonth;i++){
    var ds=year+'-'+String(month+1).padStart(2,'0')+'-'+String(i).padStart(2,'0');
    var dObj=new Date(ds+'T12:00:00');
    var dow=dObj.getDay();
    var isWE=(dow===0||dow===6);
    var cell=document.createElement('div');
    cell.className='cal-cell'+(isWE?' weekend':'')+(ds===todayStr?' today':'');
    var numDiv=document.createElement('div'); numDiv.className='cal-num'; numDiv.textContent=i;
    cell.appendChild(numDiv);
    // Holiday
    var md=String(month+1).padStart(2,'0')+'-'+String(i).padStart(2,'0');
    var hol=holidays[md]||holidays[ds];
    if(hol){
      var hDiv=document.createElement('div'); hDiv.className='cal-holiday';
      hDiv.innerHTML='<div class="cal-holiday-icon">'+hol.icon+'</div><div class="cal-holiday-name">'+hol.name+'</div>';
      cell.appendChild(hDiv);
    }
    // Event data
    var ev=events[ds];
    if(ev){
      if(ev.note&&!isWE){
        var nDiv=document.createElement('div'); nDiv.className='cal-note'; nDiv.textContent=ev.note;
        cell.appendChild(nDiv);
      }
      if(isWE&&ev.weekendNote){
        var wDiv=document.createElement('div'); wDiv.className='cal-weekend-note'; wDiv.textContent=ev.weekendNote;
        cell.appendChild(wDiv);
      }
      if(!isWE&&ev.periods){
        var dotsDiv=document.createElement('div'); dotsDiv.className='cal-dots';
        ev.periods.forEach(function(pp){
          if(pp.groupId&&pp.groupId!=='libre'){
            var dot=document.createElement('div'); dot.className='cal-dot';
            var grp=groups.find(function(g){return g.id===pp.groupId;});
            dot.style.backgroundColor=grp?grp.color:'#ccc';
            dotsDiv.appendChild(dot);
          }
        });
        cell.appendChild(dotsDiv);
      }
    }
    (function(dateStr,weekend){
      cell.addEventListener('click',function(){
        if(weekend) openWeekendModal(dateStr); else openModal(dateStr);
      });
    })(ds,isWE);
    cal.appendChild(cell);
  }
}

function navMonth(dir){ nav+=dir; loadCalendar(); }
function changePeriodCount(){ periodsPerDay=parseInt(document.getElementById('periodsCount').value); localStorage.setItem('agenda_periods',periodsPerDay); loadCalendar(); }
function saveGlobalNotes(){ localStorage.setItem('agenda_global_notes',document.getElementById('globalNotes').value); }

// --- MODAL DAY ---
function openModal(ds){
  clickedDate=ds;
  var dObj=new Date(ds+'T12:00:00');
  document.getElementById('modalDateTitle').innerText=dObj.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
  var ev=events[clickedDate]||{note:'',periods:[]};
  document.getElementById('dayNote').value=ev.note||'';
  var pc=document.getElementById('periodsContainer'); pc.innerHTML='';
  for(var i=1;i<=periodsPerDay;i++){
    var pData=ev.periods?ev.periods.find(function(p){return p.id===i;}):null;
    var gId=pData?pData.groupId:'libre';
    var customG=pData?pData.customGroup:'';
    var act=pData?pData.activity:'';
    var row=document.createElement('div'); row.className='period-row';
    var lbl=document.createElement('div'); lbl.className='period-label'; lbl.textContent='P'+i;
    var sel=document.createElement('select'); sel.id='group-p'+i;
    groups.forEach(function(g){
      var opt=document.createElement('option'); opt.value=g.id; opt.textContent=g.name;
      if(g.id===gId) opt.selected=true; sel.appendChild(opt);
    });
    var custIn=document.createElement('input'); custIn.type='text'; custIn.id='custom-group-p'+i;
    custIn.placeholder='Nom...'; custIn.value=customG; custIn.style.display=gId==='autre'?'block':'none';
    var actIn=document.createElement('input'); actIn.type='text'; actIn.id='act-p'+i;
    actIn.placeholder='Activité...'; actIn.value=act;
    sel.addEventListener('change',function(ci){return function(e){
      ci.style.display=e.target.value==='autre'?'block':'none';
      colorPeriodRow(e.target.closest('.period-row'),e.target.value);
    };}(custIn));
    row.appendChild(lbl); row.appendChild(sel); row.appendChild(custIn); row.appendChild(actIn);
    pc.appendChild(row);
    colorPeriodRow(row,gId);
  }
  document.getElementById('dayModal').classList.add('open');
}

function colorPeriodRow(row,gId){
  var grp=groups.find(function(g){return g.id===gId;});
  if(grp&&gId!=='libre'){
    row.style.borderLeft='4px solid '+grp.color;
    row.style.background='rgba('+hexToRgb(grp.color)+',0.08)';
  } else {
    row.style.borderLeft=''; row.style.background='';
  }
}

function hexToRgb(hex){
  hex=hex.replace('#','');
  if(hex.length===3) hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  var r=parseInt(hex.substring(0,2),16), g=parseInt(hex.substring(2,4),16), b=parseInt(hex.substring(4,6),16);
  return r+','+g+','+b;
}

function openWeekendModal(ds){
  clickedDate=ds;
  var dObj=new Date(ds+'T12:00:00');
  document.getElementById('weekendDateTitle').innerText=dObj.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
  document.getElementById('weekendNote').value=(events[clickedDate]||{}).weekendNote||'';
  document.getElementById('weekendModal').classList.add('open');
}

function closeModal(id){ document.getElementById(id).classList.remove('open'); clickedDate=null; }

function saveDay(){
  if(!clickedDate)return;
  var note=document.getElementById('dayNote').value;
  var pds=[];
  for(var i=1;i<=periodsPerDay;i++){
    var gId=document.getElementById('group-p'+i).value;
    var act=document.getElementById('act-p'+i).value;
    var cust=gId==='autre'?document.getElementById('custom-group-p'+i).value:'';
    if(gId!=='libre'||act.trim()) pds.push({id:i,groupId:gId,customGroup:cust,activity:act});
  }
  if(!note.trim()&&!pds.length) delete events[clickedDate];
  else events[clickedDate]={note:note,periods:pds};
  localStorage.setItem('agenda_events',JSON.stringify(events));
  closeModal('dayModal'); loadCalendar();
}

function saveWeekend(){
  if(!clickedDate)return;
  var txt=document.getElementById('weekendNote').value;
  if(!txt.trim()) delete events[clickedDate];
  else events[clickedDate]={weekendNote:txt};
  localStorage.setItem('agenda_events',JSON.stringify(events));
  closeModal('weekendModal'); loadCalendar();
}

// --- HEBDOMADAIRE ---
var monthNames=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
var hebdoMonthSel=document.getElementById('hebdo-month-select');
var academicStart=2025;
[8,9,10,11,0,1,2,3,4,5].forEach(function(m){
  var y=m>7?academicStart:academicStart+1;
  var opt=document.createElement('option'); opt.value=y+'-'+m;
  opt.textContent=monthNames[m]+' '+y;
  hebdoMonthSel.appendChild(opt);
});

// Init hebdo group select
var hbGroupSel=document.getElementById('hebdo-block-group');
groups.forEach(function(g){
  var opt=document.createElement('option'); opt.value=g.id; opt.textContent=g.name;
  hbGroupSel.appendChild(opt);
});
hbGroupSel.addEventListener('change',function(e){
  document.getElementById('hebdo-custom-wrap').style.display=e.target.value==='autre'?'block':'none';
});

function getMondayOfWeek(year,mIdx,wIdx){
  var first=new Date(year,mIdx,1);
  var dist=(first.getDay()+6)%7;
  var mon=new Date(first); mon.setDate(first.getDate()-dist);
  mon.setDate(mon.getDate()+(wIdx-1)*7);
  return mon;
}

function renderHebdo(){
  var mv=document.getElementById('hebdo-month-select').value;
  var wv=parseInt(document.getElementById('hebdo-week-select').value);
  var parts=mv.split('-').map(Number); var year=parts[0],mIdx=parts[1];
  var key=mv+'-W'+wv;
  currentHebdoKey=key;
  var wd=weeklyData[key]||{days:[[],[],[],[],[]],dayStatus:{},notes:''};
  if(!wd.dayStatus) wd.dayStatus={};
  document.getElementById('hebdoNotes').value=wd.notes||'';
  var grid=document.getElementById('hebdo-grid'); grid.innerHTML='';
  var dayNames=['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
  var monday=getMondayOfWeek(year,mIdx,wv);
  var hdrColors=['#00E5FF','#FFD700','#FF9800','#4CAF50','#FF4081','#D500F9'];
  var hdrCol=hdrColors[mIdx%hdrColors.length];

  for(var i=0;i<5;i++){
    var curDate=new Date(monday);
    curDate.setDate(monday.getDate()+i);
    var dateStr=curDate.toLocaleDateString('fr-FR',{day:'numeric',month:'long'});
    var md2=String(curDate.getMonth()+1).padStart(2,'0')+'-'+String(curDate.getDate()).padStart(2,'0');
    var fd2=curDate.getFullYear()+'-'+md2;
    var hol=holidays[fd2]||holidays[md2];
    var status=wd.dayStatus[i];
    if(!status&&hol&&hol.off) status='conge';
    if(!status) status='normal';
    var isDayOff=status==='conge'||status==='pedago';

    var col=document.createElement('div'); col.className='hebdo-col';
    var hdr=document.createElement('div'); hdr.className='hebdo-day-hdr';
    hdr.style.background='linear-gradient(135deg,'+hdrCol+','+hdrCol+'88)';
    hdr.style.color='#000';
    hdr.innerHTML='<h3>'+dayNames[i]+'</h3><div class="hebdo-date">'+dateStr+'</div>'+
      '<select onchange="updateHebdoDayStatus(\''+key+'\','+i+',this.value)">'+
      '<option value="normal"'+(status==='normal'?' selected':'')+'>Normal</option>'+
      '<option value="conge"'+(status==='conge'?' selected':'')+'>Congé</option>'+
      '<option value="pedago"'+(status==='pedago'?' selected':'')+'>Pédago</option></select>';
    col.appendChild(hdr);

    var acts=document.createElement('div');
    acts.className='hebdo-activities'+(isDayOff?' day-off':'');
    if(hol){
      acts.innerHTML+='<div class="hebdo-holiday-disp"><div class="h-icon">'+hol.icon+'</div><div class="h-name">'+hol.name+'</div></div>';
    }
    if(wd.days[i]){
      wd.days[i].forEach(function(block,bIdx){
        var blk=document.createElement('div'); blk.className='hebdo-block';
        var gName='Libre';
        if(block.groupId==='autre') gName=block.customGroup||'Autre';
        else if(block.groupId!=='libre'){
          var grp=groups.find(function(x){return x.id===block.groupId;});
          if(grp) gName=grp.name;
        }
        blk.innerHTML='<div class="hebdo-block-top"><span class="hebdo-group-badge">'+gName+'</span>'+
          '<span class="hebdo-del" onclick="deleteHebdoBlock(\''+key+'\','+i+','+bIdx+')">&times;</span></div>'+
          '<div class="hebdo-act-text">'+escHtml(block.activity)+'</div>';
        acts.appendChild(blk);
      });
    }
    var addBtn=document.createElement('button'); addBtn.className='hebdo-add-btn'; addBtn.textContent='+ Ajouter';
    (function(k,idx){addBtn.onclick=function(){openAddBlockModal(k,idx);};})(key,i);
    acts.appendChild(addBtn);
    col.appendChild(acts);
    grid.appendChild(col);
  }
}

function saveHebdoNotes(){
  if(!weeklyData[currentHebdoKey]) weeklyData[currentHebdoKey]={days:[[],[],[],[],[]],dayStatus:{},notes:''};
  weeklyData[currentHebdoKey].notes=document.getElementById('hebdoNotes').value;
  localStorage.setItem('agenda_weekly',JSON.stringify(weeklyData));
}

window.updateHebdoDayStatus=function(key,dayIdx,status){
  if(!weeklyData[key]) weeklyData[key]={days:[[],[],[],[],[]],dayStatus:{},notes:''};
  if(!weeklyData[key].dayStatus) weeklyData[key].dayStatus={};
  weeklyData[key].dayStatus[dayIdx]=status;
  localStorage.setItem('agenda_weekly',JSON.stringify(weeklyData));
  renderHebdo();
};

function prevHebdoWeek(){
  var w=parseInt(document.getElementById('hebdo-week-select').value);
  var mi=document.getElementById('hebdo-month-select').selectedIndex;
  if(w>1) document.getElementById('hebdo-week-select').value=w-1;
  else if(mi>0){ document.getElementById('hebdo-month-select').selectedIndex=mi-1; document.getElementById('hebdo-week-select').value=5; }
  renderHebdo();
}
function nextHebdoWeek(){
  var w=parseInt(document.getElementById('hebdo-week-select').value);
  var mi=document.getElementById('hebdo-month-select').selectedIndex;
  var opts=document.getElementById('hebdo-month-select').options.length;
  if(w<5) document.getElementById('hebdo-week-select').value=w+1;
  else if(mi<opts-1){ document.getElementById('hebdo-month-select').selectedIndex=mi+1; document.getElementById('hebdo-week-select').value=1; }
  renderHebdo();
}

function openAddBlockModal(key,dayIdx){
  currentHebdoKey=key; currentHebdoDayIndex=dayIdx;
  document.getElementById('hebdo-block-activity').value='';
  document.getElementById('hebdo-block-custom').value='';
  document.getElementById('hebdo-block-group').value='libre';
  document.getElementById('hebdo-custom-wrap').style.display='none';
  document.getElementById('addBlockModal').classList.add('open');
}

function confirmAddBlock(){
  var gId=document.getElementById('hebdo-block-group').value;
  var act=document.getElementById('hebdo-block-activity').value;
  var cust=gId==='autre'?document.getElementById('hebdo-block-custom').value:'';
  if(!weeklyData[currentHebdoKey]) weeklyData[currentHebdoKey]={days:[[],[],[],[],[]],dayStatus:{},notes:''};
  weeklyData[currentHebdoKey].days[currentHebdoDayIndex].push({groupId:gId,customGroup:cust,activity:act});
  localStorage.setItem('agenda_weekly',JSON.stringify(weeklyData));
  closeModal('addBlockModal'); renderHebdo();
}

window.deleteHebdoBlock=function(key,dayIdx,blockIdx){
  if(confirm('Supprimer ce bloc?')){
    weeklyData[key].days[dayIdx].splice(blockIdx,1);
    localStorage.setItem('agenda_weekly',JSON.stringify(weeklyData));
    renderHebdo();
  }
};

// --- SÉQUENTIEL ---
var seqData={
  c1:{title:"C1: Agir",categories:{
    Connaissances:[
      {text:"Identifier les parties du corps",levels:{1:"apprend",2:"maitrise"}},
      {text:"Situer son corps dans l'espace",levels:{1:"apprend",2:"maitrise"}},
      {text:"Différencier les niveaux (haut, moyen, bas)",levels:{1:"apprend",2:"maitrise"}},
      {text:"Différencier des directions",levels:{1:"apprend",2:"maitrise"}},
      {text:"Reconnaître la vitesse (lent, rapide)",levels:{1:"apprend",2:"maitrise"}}
    ],
    "Savoir-faire":[
      {text:"Marcher, ramper, gambader",levels:{1:"maitrise",2:"reutilise"}},
      {text:"Courir, galoper, sautiller",levels:{1:"apprend",2:"maitrise"}},
      {text:"Sauter à la corde",levels:{2:"apprend",3:"maitrise"}},
      {text:"Lancer et attraper",levels:{1:"apprend",2:"maitrise"}},
      {text:"Dribbler",levels:{2:"apprend",3:"maitrise"}}
    ]
  }},
  c2:{title:"C2: Interagir",categories:{
    Stratégies:[
      {text:"Attaquer le but adverse",levels:{3:"apprend",4:"maitrise"}},
      {text:"Protéger son territoire",levels:{2:"apprend",3:"maitrise"}},
      {text:"Se démarquer",levels:{2:"apprend",3:"maitrise"}}
    ],
    "Savoir-être":[
      {text:"Respecter les règles",levels:{1:"apprend",2:"maitrise"}},
      {text:"Encourager ses partenaires",levels:{1:"apprend",2:"maitrise"}},
      {text:"Accepter la défaite",levels:{3:"apprend",4:"maitrise"}}
    ]
  }},
  c3:{title:"C3: Mode de vie sain",categories:{
    Habitudes:[
      {text:"S'échauffer correctement",levels:{3:"apprend",4:"maitrise"}},
      {text:"S'hydrater",levels:{1:"apprend",2:"maitrise"}},
      {text:"Tenue vestimentaire adéquate",levels:{1:"apprend",2:"maitrise"}}
    ]
  }}
};

var planningSeqData={};
var currentEditingSeqId=null;
var globalSelectedObjectives=new Set();

function renderGlobalObjectives(){
  var cycle=parseInt(document.getElementById('niveau-scolaire').value);
  var html='';
  for(var ck in seqData){
    var comp=seqData[ck];
    for(var cat in comp.categories){
      html+='<div class="seq-obj-col"><h4>'+comp.title+' — '+cat+'</h4>';
      comp.categories[cat].forEach(function(item){
        var l1=cycle, l2=cycle+1;
        var st=item.levels[l1]||item.levels[l2]||'reutilise';
        var dotCls=st==='apprend'?'legend-apprend':st==='maitrise'?'legend-maitrise':'legend-reutilise';
        var chk=globalSelectedObjectives.has(item.text)?'checked':'';
        html+='<label><input type="checkbox" class="global-obj-cb" value="'+escAttr(item.text)+'" '+chk+'>'+
          '<span style="flex:1">'+escHtml(item.text)+'</span><span class="seq-obj-dot '+dotCls+'"></span></label>';
      });
      html+='</div>';
    }
  }
  document.getElementById('tab-contents').innerHTML=html;
  document.querySelectorAll('.global-obj-cb').forEach(function(cb){
    cb.addEventListener('change',function(e){
      if(e.target.checked) globalSelectedObjectives.add(e.target.value);
      else globalSelectedObjectives.delete(e.target.value);
    });
  });
}

function generateGrid(){
  var count=parseInt(document.getElementById('nombre-cours').value)||1;
  var container=document.getElementById('planning-grid-container');
  container.innerHTML='';
  var accentColors=['var(--cyan)','var(--yellow)','var(--orange)','var(--green)','var(--pink)','var(--purple)'];
  for(var i=1;i<=count;i++){
    if(!planningSeqData[i]) planningSeqData[i]={moyenAction:'',date:'',deroulement:'',objectifsSpecifiques:new Set()};
    var c=planningSeqData[i];
    var accent=accentColors[(i-1)%accentColors.length];
    var card=document.createElement('div'); card.className='seq-card';
    card.style.borderTopColor=accent; card.style.borderTopWidth='3px';
    card.innerHTML='<div class="seq-card-header"><span>COURS '+i+'</span><span>'+(c.date||'...')+'</span></div>'+
      '<div class="seq-card-body"><label>Date</label><input type="date" class="grid-date-input" data-id="'+i+'" value="'+c.date+'">'+
      '<label>Titre / Jeu</label><input type="text" class="grid-title-input" data-id="'+i+'" value="'+escAttr(c.moyenAction)+'" placeholder="Ex: Ballon chasseur">'+
      '<button class="seq-edit-btn" onclick="openSeqModal('+i+')">ÉDITER LE COURS</button></div>';
    container.appendChild(card);
  }
  document.querySelectorAll('.grid-date-input').forEach(function(inp){
    inp.addEventListener('input',function(e){ planningSeqData[e.target.dataset.id].date=e.target.value; generateGrid(); });
  });
  document.querySelectorAll('.grid-title-input').forEach(function(inp){
    inp.addEventListener('input',function(e){ planningSeqData[e.target.dataset.id].moyenAction=e.target.value; });
  });
}

window.openSeqModal=function(id){
  currentEditingSeqId=id;
  var d=planningSeqData[id];
  document.getElementById('modal-title').textContent='Édition — Cours '+id;
  document.getElementById('modal-moyen-action').value=d.moyenAction;
  document.getElementById('modal-date').value=d.date;
  document.getElementById('modal-editor').innerHTML=d.deroulement;
  var objList=document.getElementById('modal-objectives-list'); objList.innerHTML='';
  if(!globalSelectedObjectives.size){ objList.innerHTML='<p style="color:var(--red)">Aucun objectif sélectionné.</p>'; }
  else {
    globalSelectedObjectives.forEach(function(txt){
      var chk=d.objectifsSpecifiques.has(txt)?'checked':'';
      objList.innerHTML+='<label><input type="checkbox" class="spec-obj-cb" value="'+escAttr(txt)+'" '+chk+'> '+escHtml(txt)+'</label>';
    });
  }
  document.getElementById('course-modal').classList.add('open');
};

function closeSeqModal(){ document.getElementById('course-modal').classList.remove('open'); generateGrid(); }
function saveSeqData(){
  if(!currentEditingSeqId) return;
  var d=planningSeqData[currentEditingSeqId];
  d.moyenAction=document.getElementById('modal-moyen-action').value;
  d.date=document.getElementById('modal-date').value;
  d.deroulement=document.getElementById('modal-editor').innerHTML;
  d.objectifsSpecifiques.clear();
  document.querySelectorAll('.spec-obj-cb:checked').forEach(function(cb){ d.objectifsSpecifiques.add(cb.value); });
  closeSeqModal();
}

document.getElementById('close-modal').addEventListener('click',closeSeqModal);
document.getElementById('save-modal-btn').addEventListener('click',saveSeqData);
document.getElementById('niveau-scolaire').addEventListener('change',renderGlobalObjectives);
document.getElementById('nombre-cours').addEventListener('input',generateGrid);
document.querySelectorAll('.editor-btn').forEach(function(btn){
  btn.addEventListener('click',function(e){ e.preventDefault(); document.execCommand(btn.dataset.command,false,null); });
});

// --- SAVE / IMPORT / RESET ---
function downloadData(){
  var data={events:events,config:periodsPerDay,notes:document.getElementById('globalNotes').value,weekly:weeklyData};
  var a=document.createElement('a');
  a.href='data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(data));
  a.download='agenda_scolaire_backup.json';
  document.body.appendChild(a); a.click(); a.remove();
}

function importData(input){
  var file=input.files[0]; if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    try {
      var data=JSON.parse(e.target.result);
      if(data.events){events=data.events;localStorage.setItem('agenda_events',JSON.stringify(events));}
      if(data.config){periodsPerDay=data.config;document.getElementById('periodsCount').value=periodsPerDay;localStorage.setItem('agenda_periods',periodsPerDay);}
      if(data.notes){document.getElementById('globalNotes').value=data.notes;localStorage.setItem('agenda_global_notes',data.notes);}
      if(data.weekly){weeklyData=data.weekly;localStorage.setItem('agenda_weekly',JSON.stringify(weeklyData));}
      alert('Importation réussie!'); loadCalendar(); renderHebdo();
    } catch(err){ alert('Erreur lors de l\'importation.'); }
  };
  reader.readAsText(file);
}

function resetAll(){
  if(confirm('Effacer TOUTES les données de l\'agenda?')){
    localStorage.removeItem('agenda_events');localStorage.removeItem('agenda_global_notes');
    localStorage.removeItem('agenda_weekly');localStorage.removeItem('agenda_periods');
    location.reload();
  }
}

// --- UTILS ---
function escHtml(s){ var d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function escAttr(s){ return s.replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

// --- INIT ---
loadCalendar();
renderGlobalObjectives();
generateGrid();
