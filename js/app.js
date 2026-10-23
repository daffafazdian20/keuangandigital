/* Keuangan Digital — logika aplikasi (SPA). Komunikasi server lewat post() di api.js */
/* Keuangan Digital — klien SPA. Kontrak server: boot() & api(aksi,param) → {success,data,message} */
const $=s=>document.querySelector(s),E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const Rp=n=>(n<0?'-':'')+'Rp '+Math.abs(Math.round(+n||0)).toLocaleString('id-ID');
const uid=()=>(crypto.randomUUID?crypto.randomUUID():Date.now()+''+Math.random()).replace(/\W/g,'');
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Jakarta'});
const BL=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const bl=m=>BL[+m.slice(5,7)-1]+' '+m.slice(0,4),bs=m=>BL[+m.slice(5,7)-1].slice(0,3);
const fd=d=>d?(+d.slice(8,10))+' '+bs(d)+' '+d.slice(0,4):'';
const addM=(m,n)=>{const d=new Date(+m.slice(0,4),+m.slice(5,7)-1+n,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
const ld=m=>m+'-'+String(new Date(+m.slice(0,4),+m.slice(5,7),0).getDate()).padStart(2,'0');
const mr=m=>[m+'-01',m+'-31'];
const nextD=(d,u)=>{const x=new Date(d+'T00:00:00Z');if(u==='Mingguan')x.setUTCDate(x.getUTCDate()+7);else if(u==='Tahunan')x.setUTCFullYear(x.getUTCFullYear()+1);else if(/^Custom:/.test(u))x.setUTCDate(x.getUTCDate()+(+u.split(':')[1]||30));else{const dd=x.getUTCDate();x.setUTCDate(1);x.setUTCMonth(x.getUTCMonth()+1);x.setUTCDate(Math.min(dd,new Date(Date.UTC(x.getUTCFullYear(),x.getUTCMonth()+1,0)).getUTCDate()))}return x.toISOString().slice(0,10)};

/* ===== State ===== */
let D,U,C={},cur='dash',M=today().slice(0,7),AF,T={},CH={},pend=0,dirty=0,Q=Promise.resolve(),IDM={},TQ,ver=0,RV={},H='',st,buf=[],it;
let F={q:'',j:'',w:'',k:'',a:M+'-01',b:ld(M)},R={a:M+'-01',b:today(),w:''};
const PAL=['#0F766E','#10B981','#5EEAD4','#64748B','#CBD5E1','#94A3B8'];
const act=c=>D[c].filter(x=>x.Aktif==='Ya'),nm=(c,id)=>(D[c].find(x=>x.ID===id)||{}).Nama||'—';
const tot=(j,a,b,fn)=>D.tx.reduce((s,x)=>s+(x.Jenis===j&&x.Tanggal>=a&&x.Tanggal<=b&&(!fn||fn(x))?+x.Nominal:0),0);
const bud=m=>D.budget.filter(x=>String(x.Bulan).slice(0,7)===m); // tahan jika Sheets mengubah 'YYYY-MM' jadi tanggal
const spent=(k,m)=>tot('Pengeluaran',...mr(m),x=>x.Kategori===k);
const saved=id=>D.tx.reduce((s,x)=>s+(x.Jenis==='Setoran Tabungan'&&x.Target===id?+x.Nominal:0),0);
function bal(){const b={};D.dompet.forEach(w=>b[w.ID]=+w.SaldoAwal||0);D.tx.forEach(t=>{const n=+t.Nominal,a=t.Dompet,c=t.DompetTujuan;if(t.Jenis==='Pemasukan')b[a]=(b[a]||0)+n;else if(t.Jenis==='Pengeluaran'||t.Jenis==='Setoran Tabungan')b[a]=(b[a]||0)-n;else if(t.Jenis==='Transfer'){b[a]=(b[a]||0)-n;b[c]=(b[c]||0)+n}});return b}
const sv=()=>{clearTimeout(st);st=setTimeout(()=>{try{localStorage.setItem('kd2',JSON.stringify({u:U,c:C,d:D,h:H}))}catch(e){}},400)};
function toast(m,k){const t=document.createElement('div');t.className='t '+(k||'');t.textContent=m;$('#toast').appendChild(t);setTimeout(()=>t.remove(),3200)}

/* ===== Server: antrean berurutan (hindari tabrakan), UI optimistis, gagal → muat ulang data server ===== */
const call=post; // post() ada di js/api.js (fetch ke GAS + token Google)
const fix=p=>{p=JSON.parse(JSON.stringify(p));for(const k in p){if(IDM[p[k]])p[k]=IDM[p[k]];else if(k==='ID'&&String(p[k])[0]==='~')delete p.ID}return p};
function push(a,p,ok){pend++;H='';sv();buf.push({a,p,ok});clearTimeout(push.t);push.t=setTimeout(flush,120)} // H='' → boot berikutnya wajib ambil data penuh
function flush(){if(!buf.length)return;const b=[],c=new Set();
  while(buf.length){const o=buf[0];if(Object.values(o.p).some(v=>typeof v==='string'&&v[0]==='~'&&c.has(v)))break; // bergantung pada ID sementara dalam batch yang sama → kirim di batch berikutnya
    if(String(o.p.ID||'')[0]==='~')c.add(o.p.ID);b.push(buf.shift())}
  Q=Q.then(async()=>{try{const r=await call('batch',{ops:b.map(o=>({a:o.a,p:fix(o.p)}))});if(!r.success)throw Error(r.message);
      r.data.forEach((x,i)=>{if(x.success)b[i].ok&&b[i].ok(x.data);else{dirty=1;toast(x.message||'Gagal menyimpan','e')}})}
    catch(e){dirty=1;toast(e.message||'Gagal menyimpan','e')}
    pend-=b.length;if(!pend&&dirty){dirty=0;load()}});
  if(buf.length)flush()}
function adopt(t,r){IDM[t]=r;Object.values(D).forEach(a=>a.forEach(x=>{for(const k in x)if(x[k]===t)x[k]=r}));sv();render()}
function put(c,o,a,msg){const nw=!o.ID;if(nw)o.ID='~'+uid();const i=D[c].findIndex(x=>x.ID===o.ID),t=o.ID;i<0?D[c].push(o):D[c][i]=o;sv();render();toast(msg,'ok');push(a,{...o},d=>{if(nw&&d&&d.ID)adopt(t,d.ID)})}

/* ===== Mulai, akses, tema ===== */
async function load(){$('#denied').hidden=1;if(!D)$('#boot').hidden=0;
  try{const r=await post('boot',{h:H,em:U&&U.email});
    if(!r.success){if(r.code===401)return;if(r.code!==403){if(!D)deny('Terjadi Kesalahan',E(r.message||r.why||'Gagal memuat data'));else toast(r.message||r.why||'Gagal memuat data','e');return}D=null;try{localStorage.removeItem('kd2')}catch(e){}return deny('Akses Ditolak (403)',(r.email?'<b>'+E(r.email)+'</b><br>':'')+E(r.why||''))}
    if(pend)return;if(r.same){H=r.h;if($('#app').hidden)start();return}apply(r.data,r.h)}catch(e){if(!D)deny('Terjadi Kesalahan',E(e.message))}}
function deny(t,m){$('#boot').hidden=1;$('#app').hidden=1;$('#denied').hidden=0;$('#denied h1').textContent=t;$('#dm').innerHTML=m}
function apply(d,h){U=d.user;C=d.cfg||{};D={dompet:d.dompet,kategori:d.kategori,tx:d.tx,budget:d.budget,target:d.target,tagihan:d.tagihan,pengguna:d.pengguna||[]};H=h||'';ver++;sv();start()}
function theme(){const r=document.documentElement.style,n=C.namaApp||'Keuangan Digital';r.setProperty('--pr',C.warnaUtama||'#0F766E');r.setProperty('--ac',C.warnaAksen||'#10B981');document.title=n;$('#bn').textContent=n;$('#ub').innerHTML='<b>'+E(U.nama)+'</b>'+E(U.email)+' · '+E(U.peran)+'<br><button class="btn s" style="margin-top:.5rem" onclick="logout()">Keluar</button>'}
function start(){$('#boot').hidden=1;$('#denied').hidden=1;$('#login').hidden=1;$('#app').hidden=0;if(!$('#s-dash'))$('#view').innerHTML=Object.keys(PG).map(k=>`<section class="sec" id="s-${k}"></section>`).join('');theme();go(cur==='set'&&U.peran!=='Admin'?'dash':cur,1);idle()}

/* ===== Navigasi SPA (0 ms, tanpa ubah URL) ===== */
const PG={dash:['Dashboard','bi-grid-1x2',vDash],tx:['Transaksi','bi-receipt',vTx],dom:['Dompet','bi-wallet2',vDom],bud:['Budget','bi-pie-chart',vBud],tab:['Tabungan','bi-piggy-bank',vTab],tag:['Tagihan','bi-bell',vTag],lap:['Laporan','bi-graph-up-arrow',vLap],set:['Pengaturan','bi-gear',vSet]};
function go(k,keep){if(k==='set'&&U.peran!=='Admin')return;cur=k;document.body.classList.remove('nv');document.querySelectorAll('.sec').forEach(s=>s.classList.toggle('on',s.id==='s-'+k));paint();if(!keep)scrollTo(0,0)}
function render(){if(!D)return;ver++;paint();idle()}
function paint(){if(!D)return;$('#nav').innerHTML=Object.keys(PG).filter(k=>k!=='set'||U.peran==='Admin').map(k=>`<button class="${cur===k?'on':''}" onclick="go('${k}')" aria-label="${PG[k][0]}"><i class="bi ${PG[k][1]}"></i><span>${PG[k][0]}</span></button>`).join('');$('#ttl').textContent=PG[cur][0];if(RV[cur]!==ver){AF=null;$('#s-'+cur).innerHTML=PG[cur][2]();RV[cur]=ver;AF&&AF()}}
function idle(){clearTimeout(it);it=setTimeout(()=>(window.requestIdleCallback||setTimeout)(()=>{if(!D)return;['tx','dom','bud','tab','tag'].concat(U.peran==='Admin'?['set']:[]).forEach(k=>{if(k!==cur&&RV[k]!==ver){AF=null;$('#s-'+k).innerHTML=PG[k][2]();RV[k]=ver;AF&&AF();AF=null}})}),250)} // pra-render menu lain di waktu senggang

/* ===== Komponen ===== */
const hd=(t,s,a)=>`<div class="ch np" style="flex-wrap:wrap"><div><h2>${t}</h2><div class="sb">${s||''}</div></div><div class="act">${a||''}</div></div>`;
const mn=()=>`<div class="mn np"><button onclick="M=addM(M,-1);render()" aria-label="Bulan sebelumnya"><i class="bi bi-chevron-left"></i></button><b>${bl(M)}</b><button onclick="M=addM(M,1);render()" aria-label="Bulan berikutnya"><i class="bi bi-chevron-right"></i></button></div>`;
const pb=p=>`<div class="bar"><i class="${p>=100?'bad':p>=80?'warn':''}" style="width:${Math.min(100,p)}%"></i></div>`;
const pg=p=>`<div class="bar"><i style="width:${Math.min(100,p)}%"></i></div>`;
const em=t=>`<div class="empty">${t}</div>`,so=(a,v)=>a.map(o=>`<option value="${E(o[0])}"${o[0]==v?' selected':''}>${E(o[1])}</option>`).join('');
const jb=x=>x.Jenis==='Pemasukan'?'<span class="bd ok">Masuk</span>':x.Jenis==='Pengeluaran'?'<span class="bd bad">Keluar</span>':x.Jenis==='Transfer'?'<span class="bd info">Transfer</span>':'<span class="bd warn">Tabungan</span>';
const amt=x=>x.Jenis==='Pemasukan'?`<span class="tok">+${Rp(x.Nominal)}</span>`:x.Jenis==='Pengeluaran'?`<span class="tbad">-${Rp(x.Nominal)}</span>`:Rp(x.Nominal);
const dsc=x=>x.Jenis==='Transfer'?nm('dompet',x.Dompet)+' → '+nm('dompet',x.DompetTujuan):x.Jenis==='Setoran Tabungan'?'Setoran: '+nm('target',x.Target):nm('kategori',x.Kategori);
const srt=a=>[...a].sort((x,y)=>y.Tanggal.localeCompare(x.Tanggal)||String(y.DibuatPada||'~').localeCompare(String(x.DibuatPada||'~')));
const kc=(l,v,s,c)=>`<div class="cd c4"><h3>${l}</h3><div class="kpi ${c||''}">${v}</div><div class="sb">${s||''}</div></div>`;
function chart(id,c){const el=document.getElementById(id);if(!el||!window.Chart)return;CH[id]&&CH[id].destroy();CH[id]=new Chart(el,c)}
function donut(id,lg,a,b,fn){const m={};D.tx.forEach(x=>{if(x.Jenis==='Pengeluaran'&&x.Tanggal>=a&&x.Tanggal<=b&&(!fn||fn(x))){const k=nm('kategori',x.Kategori);m[k]=(m[k]||0)+ +x.Nominal}});
  const d=Object.entries(m).sort((x,y)=>y[1]-x[1]),t=d.slice(0,5),r=d.slice(5).reduce((s,x)=>s+x[1],0);if(r)t.push(['Lainnya',r]);const S=t.reduce((s,x)=>s+x[1],0)||1;
  chart(id,{type:'doughnut',data:{labels:t.map(x=>x[0]),datasets:[{data:t.map(x=>x[1]),backgroundColor:PAL,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',animation:false,plugins:{legend:{display:false}}}});
  $('#'+lg).innerHTML=t.length?t.map((x,i)=>`<div class="li"><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:8px;background:${PAL[i]}"></i>${E(x[0])}</span><b class="num">${Rp(x[1])} · ${Math.round(x[1]/S*100)}%</b></div>`).join(''):em('Belum ada pengeluaran.')}
const trow=(x,ed)=>`<tr><td>${fd(x.Tanggal)}</td><td>${jb(x)}</td><td>${E(dsc(x))}<small>${E(x.Catatan||'')}</small></td><td>${E(nm('dompet',x.Dompet))}</td><td class="r">${amt(x)}</td>${ed?`<td class="r"><button class="ib" onclick="txModal('${x.ID}')" aria-label="Ubah"><i class="bi bi-pencil"></i></button>${U.peran==='Admin'?`<button class="ib" onclick="txDel('${x.ID}')" aria-label="Hapus"><i class="bi bi-trash"></i></button>`:''}</td>`:''}</tr>`;

/* ===== Modal ===== */
function modal(t,b,f){$('#mod').innerHTML=`<div class="mc" role="dialog" aria-modal="true"><div class="mh"><h2>${t}</h2><button class="ib" onclick="cm()" aria-label="Tutup"><i class="bi bi-x-lg"></i></button></div><div class="mb">${b}</div><div class="mf">${f}</div></div>`;$('#mod').hidden=false}
const cm=()=>{$('#mod').hidden=true;$('#mod').innerHTML=''};
function ask(m,f){modal('Konfirmasi','<p>'+m+'</p>','<button class="btn" onclick="cm()">Batal</button><button class="btn p" id="ya">Ya, lanjutkan</button>');$('#ya').onclick=()=>{cm();f()}}
/* fm: field = [kunci,label,tipe,opsi,wajib,awalanRp,harus>0] */
function fm(t,fs,v,ok,btn){
  modal(t,fs.map(f=>{const id='f_'+f[0],x=v[f[0]]==null?'':v[f[0]];let c=f[2]==='select'?`<select id="${id}">${so(f[3],x)}</select>`:`<input id="${id}" type="${f[2]||'text'}" value="${E(x)}"${f[2]==='number'?' min="0" inputmode="numeric"':''}>`;if(f[5])c=`<div class="rp"><span>Rp</span>${c}</div>`;return`<label class="f"><span>${f[1]}${f[4]?' *':''}</span>${c}<small class="tbad" id="e_${f[0]}"></small></label>`}).join(''),'<button class="btn" onclick="cm()">Batal</button><button class="btn p" id="fs">'+(btn||'Simpan')+'</button>');
  $('#fs').onclick=()=>{const o={...v};let bad=0;fs.forEach(f=>{const x=$('#f_'+f[0]).value.trim(),e=$('#e_'+f[0]);e.textContent='';if((f[4]&&!x)||(f[6]&&!(+x>0))){e.textContent=f[6]&&x?'Harus lebih dari 0':'Wajib diisi';bad=1}o[f[0]]=f[2]==='number'?(x===''?'':+x):x});if(!bad){cm();ok(o)}};
  setTimeout(()=>{const i=$('#mod input,#mod select');i&&i.focus()},30)}

/* ===== Dashboard ===== */
function vDash(){
  const [a,b]=mr(M),i=tot('Pemasukan',a,b),o=tot('Pengeluaran',a,b),n=i-o,B=bal(),W=act('dompet');
  const bg=bud(M).filter(x=>+x.Nominal>0).map(x=>({k:x.Kategori,p:+x.Nominal,s:spent(x.Kategori,M)})).sort((x,y)=>y.s/y.p-x.s/x.p).slice(0,4);
  const tb=D.tagihan.filter(x=>x.Status==='Belum').sort((x,y)=>x.JatuhTempo<y.JatuhTempo?-1:1).slice(0,4);
  AF=()=>{const ms=[0,1,2,3,4,5].map(k=>addM(M,k-5));
    chart('c1',{type:'bar',data:{labels:ms.map(bs),datasets:[{label:'Pemasukan',data:ms.map(m=>tot('Pemasukan',...mr(m))),backgroundColor:'#10B981',borderRadius:4},{label:'Pengeluaran',data:ms.map(m=>tot('Pengeluaran',...mr(m))),backgroundColor:'#64748B',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:c=>c.dataset.label+': '+Rp(c.raw)}}},scales:{y:{ticks:{callback:v=>v>=1e6?v/1e6+' jt':v}}}}});
    donut('c2','lg2',a,b)};
  return hd('Ringkasan Keuangan','Halo, '+E(U.nama)+'. Arus kas '+bl(M)+'.',mn())+`<div class="g">${kc('Pemasukan bulan ini',Rp(i),'Total uang masuk')}${kc('Pengeluaran bulan ini',Rp(o),'Total uang keluar')}${kc('Selisih (net surplus)',Rp(n),(i?(n/i*100).toFixed(1):'0.0')+'% savings rate',n<0?'tbad':'tok')}
  <div class="cd c8"><div class="ch"><h3>Arus kas 6 bulan</h3></div><div class="cv"><canvas id="c1" aria-label="Grafik arus kas"></canvas></div></div>
  <div class="cd c4"><div class="ch"><h3>Pengeluaran per kategori</h3></div><div class="cv" style="height:170px"><canvas id="c2" aria-label="Donut kategori"></canvas></div><div id="lg2"></div></div>
  <div class="cd c6"><div class="ch"><h3>Dompet & rekening</h3><span class="ln" onclick="go('dom')">Kelola</span></div>${W.map(w=>`<div class="li"><span>${E(w.Nama)}<small>${E(w.Tipe)}</small></span><b class="num">${Rp(B[w.ID])}</b></div>`).join('')||em('Belum ada dompet.')}<div class="ft"><b>Total likuiditas</b><b class="num">${Rp(W.reduce((s,w)=>s+(B[w.ID]||0),0))}</b></div></div>
  <div class="cd c6"><div class="ch"><h3>Budget bulan ini</h3><span class="ln" onclick="go('bud')">Atur</span></div>${bg.map(x=>{const p=Math.round(x.s/x.p*100);return`<div class="bi2"><div class="li"><span>${E(nm('kategori',x.k))}</span><small>${Rp(x.s)} / ${Rp(x.p)} (${p}%)</small></div>${pb(p)}</div>`}).join('')||em('Belum ada budget bulan ini.')}</div>
  <div class="cd c6"><div class="ch"><h3>Target tabungan</h3><span class="ln" onclick="go('tab')">Detail</span></div>${D.target.slice(0,3).map(x=>{const p=Math.round(saved(x.ID)/x.Nominal*100);return`<div class="bi2"><div class="li"><span>${E(x.Nama)}</span><small>${Rp(saved(x.ID))} / ${Rp(x.Nominal)} (${p}%)</small></div>${pg(p)}</div>`}).join('')||em('Belum ada target.')}</div>
  <div class="cd c6"><div class="ch"><h3>Tagihan mendatang</h3><span class="ln" onclick="go('tag')">Semua</span></div>${tb.map(t=>{const s=bst(t);return`<div class="li"><span>${E(t.Nama)}<small>Jatuh tempo ${fd(t.JatuhTempo)}</small></span><span><b class="num">${Rp(t.Nominal)}</b> <span class="bd ${s[1]}">${s[0]}</span></span></div>`}).join('')||em('Tidak ada tagihan.')}</div>
  <div class="cd c12"><div class="ch"><h3>Transaksi terbaru</h3><span class="ln" onclick="go('tx')">Semua</span></div><div class="tw">${D.tx.length?`<table><tbody>${srt(D.tx).slice(0,5).map(x=>trow(x)).join('')}</tbody></table>`:em('Belum ada transaksi.')}</div></div></div>`}

/* ===== Transaksi ===== */
function vTx(){AF=txl;
  return hd('Daftar Transaksi','Cari dan filter semua transaksi.','<button class="btn p" onclick="txModal()"><i class="bi bi-plus-lg"></i> Tambah</button>')+`<div class="cd"><div class="fl np"><input placeholder="Cari catatan atau kategori…" value="${E(F.q)}" oninput="F.q=this.value;clearTimeout(TQ);TQ=setTimeout(txl,120)" aria-label="Cari">
  <select onchange="F.j=this.value;txl()" aria-label="Jenis">${so([['','Semua jenis'],['Pemasukan','Pemasukan'],['Pengeluaran','Pengeluaran'],['Transfer','Transfer'],['Setoran Tabungan','Tabungan']],F.j)}</select>
  <select onchange="F.w=this.value;txl()" aria-label="Dompet">${so([['','Semua dompet']].concat(D.dompet.map(w=>[w.ID,w.Nama])),F.w)}</select>
  <select onchange="F.k=this.value;txl()" aria-label="Kategori">${so([['','Semua kategori']].concat(D.kategori.map(k=>[k.ID,k.Nama])),F.k)}</select>
  <input type="date" value="${F.a}" onchange="F.a=this.value;txl()" aria-label="Dari"><input type="date" value="${F.b}" onchange="F.b=this.value;txl()" aria-label="Sampai"></div><div class="tw" id="txl"></div></div>`}
function txl(){const el=$('#txl');if(!el)return;const q=F.q.toLowerCase(),L=srt(D.tx.filter(x=>x.Tanggal>=F.a&&x.Tanggal<=F.b&&(!F.j||x.Jenis===F.j)&&(!F.w||x.Dompet===F.w||x.DompetTujuan===F.w)&&(!F.k||x.Kategori===F.k)&&(!q||((x.Catatan||'')+' '+nm('kategori',x.Kategori)).toLowerCase().includes(q))));
  el.innerHTML=L.length?`<table><thead><tr><th>Tanggal</th><th>Jenis</th><th>Kategori / catatan</th><th>Dompet</th><th class="r">Nominal</th><th></th></tr></thead><tbody>${L.slice(0,200).map(x=>trow(x,1)).join('')}</tbody></table>${L.length>200?em('Menampilkan 200 dari '+L.length+'. Persempit filter.'):''}`:em('Tidak ada transaksi pada filter ini.')}
function txDel(id){ask('Hapus transaksi ini? Data hanya ditandai terhapus (soft delete).',()=>{D.tx=D.tx.filter(x=>x.ID!==id);sv();render();toast('Transaksi dihapus','ok');push('delTx',{ID:id})})}
function txModal(id,j,tg){const e=id&&D.tx.find(x=>x.ID===id);T=e?{...e}:{Jenis:j||'Pengeluaran',Tanggal:today(),Nominal:'',Dompet:(act('dompet')[0]||{}).ID||'',DompetTujuan:'',Kategori:'',Target:tg||'',Catatan:'',_new:1};tm();setTimeout(()=>{const i=$('#tn');i&&i.focus()},30)}
function tm(er){er=er||{};const J=T.Jenis,B=bal(),W=[['','— Pilih —']].concat(act('dompet').map(w=>[w.ID,w.Nama+' (Saldo '+Rp(B[w.ID])+')'])),e=k=>er[k]?`<small class="tbad">${er[k]}</small>`:'';
  modal(T._new?'Catat Transaksi Baru':'Ubah Transaksi',`<div class="seg">${[['Pemasukan','Masuk'],['Pengeluaran','Keluar'],['Transfer','Transfer'],['Setoran Tabungan','Tabungan']].map(j=>`<button type="button" class="${J===j[0]?'on':''}" onclick="T.Jenis='${j[0]}';T.Kategori='';tm()">${j[1]}</button>`).join('')}</div>
  <label class="f"><span>Nominal *</span><div class="rp"><span>Rp</span><input id="tn" type="number" min="0" inputmode="numeric" value="${E(T.Nominal)}" oninput="T.Nominal=this.value"></div>${e('n')}</label>
  <div class="row2"><label class="f"><span>Tanggal</span><input type="date" value="${E(T.Tanggal)}" onchange="T.Tanggal=this.value"></label><label class="f"><span>${J==='Transfer'?'Dari dompet':'Dompet'} *</span><select onchange="T.Dompet=this.value">${so(W,T.Dompet)}</select>${e('d')}</label></div>
  ${J==='Transfer'?`<label class="f"><span>Ke dompet *</span><select onchange="T.DompetTujuan=this.value">${so(W,T.DompetTujuan)}</select>${e('t')}</label>`:''}
  ${J==='Pemasukan'||J==='Pengeluaran'?`<label class="f"><span>Kategori *</span><select onchange="T.Kategori=this.value">${so([['','— Pilih —']].concat(act('kategori').filter(k=>k.Jenis===J).map(k=>[k.ID,k.Nama])),T.Kategori)}</select>${e('k')}</label>`:''}
  ${J==='Setoran Tabungan'?`<label class="f"><span>Target tabungan *</span><select onchange="T.Target=this.value">${so([['','— Pilih —']].concat(D.target.map(x=>[x.ID,x.Nama])),T.Target)}</select>${e('g')}</label>`:''}
  <label class="f"><span>Catatan (opsional)</span><input value="${E(T.Catatan)}" oninput="T.Catatan=this.value" placeholder="mis. Belanja mingguan"></label><small class="sb">Dicatat oleh ${E(U.nama)} (${E(U.peran)})</small>`,
  `<button class="btn" onclick="cm()">Batal</button>${T._new?'<button class="btn" onclick="txSave(1)">Simpan & Tambah Lagi</button>':''}<button class="btn p" onclick="txSave(0)">Simpan</button>`)}
function txSave(more){const J=T.Jenis,e={};
  if(!(+T.Nominal>0))e.n='Nominal harus lebih dari 0';if(!T.Dompet)e.d='Pilih dompet';if((J==='Pemasukan'||J==='Pengeluaran')&&!T.Kategori)e.k='Pilih kategori';
  if(J==='Transfer'&&(!T.DompetTujuan||T.DompetTujuan===T.Dompet))e.t='Pilih dompet tujuan yang berbeda';if(J==='Setoran Tabungan'&&!T.Target)e.g='Pilih target';
  if(Object.keys(e).length)return tm(e);
  const o={...T};delete o._new;o.Nominal=+o.Nominal;if(J!=='Transfer')o.DompetTujuan='';if(J==='Transfer'||J==='Setoran Tabungan')o.Kategori='';if(J!=='Setoran Tabungan')o.Target='';
  if(!o.ID){o.DibuatOleh=U.email;o.Dihapus='Tidak'}put('tx',o,'saveTx','Transaksi disimpan');more?txModal(null,J):cm()}

/* ===== Dompet ===== */
function vDom(){const B=bal(),A=act('dompet'),I=D.dompet.filter(w=>w.Aktif!=='Ya');
  return hd('Dompet & Rekening','Total saldo '+Rp(A.reduce((s,w)=>s+(B[w.ID]||0),0))+' · '+A.length+' akun aktif','<button class="btn p" onclick="dpForm()"><i class="bi bi-plus-lg"></i> Tambah Dompet</button>')+
  `<div class="wg">${A.map(w=>`<div class="cd"><div class="ch"><b>${E(w.Nama)}</b><span class="bd info">${E(w.Tipe)}</span></div><div class="kpi" style="font-size:1.5rem;line-height:2rem">${Rp(B[w.ID])}</div><div class="sb">Saldo awal ${Rp(w.SaldoAwal)}</div><div class="act" style="justify-content:flex-start;margin-top:.75rem"><button class="btn s" onclick="F.w='${w.ID}';ver++;go('tx')">Mutasi</button><button class="btn s" onclick="dpForm('${w.ID}')">Ubah</button><button class="btn s d" onclick="dpOff('${w.ID}',0)">Nonaktifkan</button></div></div>`).join('')||em('Belum ada dompet aktif.')}</div>
  ${I.length?`<div class="cd" style="margin-top:1.5rem"><h3>Dompet nonaktif</h3>${I.map(w=>`<div class="li"><span>${E(w.Nama)}<small>Sisa ${Rp(B[w.ID])}</small></span><button class="btn s" onclick="dpOff('${w.ID}',1)">Aktifkan</button></div>`).join('')}</div>`:''}<p class="mt">Dompet yang punya transaksi tidak dihapus permanen, hanya dinonaktifkan.</p>`}
function dpForm(id){const w=id?{...D.dompet.find(x=>x.ID===id)}:{Tipe:'Rekening',SaldoAwal:0,Aktif:'Ya'};
  fm(id?'Ubah Dompet':'Tambah Dompet',[['Nama','Nama dompet','text',0,1],['Tipe','Tipe','select',['Rekening','E-Wallet','Tunai','Lainnya'].map(x=>[x,x])],['SaldoAwal','Saldo awal','number',0,1,1]],w,o=>put('dompet',o,'saveDompet','Dompet disimpan'))}
const dpOff=(id,on)=>put('dompet',{...D.dompet.find(x=>x.ID===id),Aktif:on?'Ya':'Tidak'},'saveDompet',on?'Dompet diaktifkan':'Dompet dinonaktifkan');

/* ===== Budget ===== */
function vBud(){const r=act('kategori').filter(k=>k.Jenis==='Pengeluaran').map(k=>{const b=bud(M).find(x=>x.Kategori===k.ID),p=b?+b.Nominal:0,s=spent(k.ID,M);return{k,p,s,c:p?Math.round(s/p*100):0}}),P=r.reduce((a,x)=>a+x.p,0),S=r.reduce((a,x)=>a+x.s,0);
  return hd('Pengawasan Budget','Bar berubah warna di 80% dan 100%.',mn())+`<div class="g">${kc('Total pagu',Rp(P))}${kc('Terpakai',Rp(S),P?Math.round(S/P*100)+'% dari pagu':'—')}${kc('Sisa anggaran',Rp(P-S),'',P-S<0?'tbad':'tok')}
  <div class="cd c12"><div class="tw"><table><thead><tr><th>Kategori</th><th class="r">Pagu</th><th class="r">Realisasi</th><th>Progres</th><th>Status</th><th></th></tr></thead><tbody>${r.map(x=>`<tr><td>${E(x.k.Nama)}</td><td class="r">${Rp(x.p)}</td><td class="r">${Rp(x.s)}</td><td style="min-width:130px">${x.p?pb(x.c):'—'}</td><td>${!x.p?'<span class="bd">Belum diatur</span>':x.c>=100?`<span class="bd bad">${x.c>100?'Melebihi':'Penuh'} ${x.c}%</span>`:x.c>=80?`<span class="bd warn">Waspada ${x.c}%</span>`:`<span class="bd ok">Aman ${x.c}%</span>`}</td><td class="r"><button class="btn s" onclick="bdForm('${x.k.ID}')">Atur</button></td></tr>`).join('')}</tbody></table></div></div></div>`}
function bdForm(k){const b=bud(M).find(x=>x.Kategori===k);fm('Anggaran: '+E(nm('kategori',k))+' ('+bl(M)+')',[['Nominal','Nominal anggaran bulanan','number',0,1,1]],{Nominal:b?b.Nominal:''},o=>put('budget',b?{...b,Nominal:o.Nominal}:{Bulan:M,Kategori:k,Nominal:o.Nominal},'saveBudget','Budget disimpan'))}

/* ===== Tabungan ===== */
function vTab(){const tc=D.target.reduce((s,x)=>s+saved(x.ID),0),tt=D.target.reduce((s,x)=>s+ +x.Nominal,0);
  return hd('Target Tabungan','Terkumpul '+Rp(tc)+' dari '+Rp(tt),'<button class="btn" onclick="tbForm()">Tambah Target</button><button class="btn p" onclick="txModal(null,\'Setoran Tabungan\')">Setor Tabungan</button>')+
  `<div class="wg">${D.target.map(x=>{const c=saved(x.ID),p=Math.round(c/x.Nominal*100),mo=Math.max(1,(+x.Tanggal.slice(0,4)-+today().slice(0,4))*12+(+x.Tanggal.slice(5,7)-+today().slice(5,7)));return`<div class="cd"><div class="ch"><b>${E(x.Nama)}</b><span class="bd ${p>=100?'ok':'info'}">${p>=100?'Tercapai':'Berjalan'}</span></div><div class="kpi" style="font-size:1.5rem;line-height:2rem">${Rp(c)}</div>${pg(p)}<div class="li"><small>${p}% dari ${Rp(x.Nominal)}</small><small>Tenggat ${fd(x.Tanggal)}</small></div>${p<100?`<div class="sb">Saran setoran ≈ ${Rp((x.Nominal-c)/mo)} / bulan</div>`:''}<div class="act" style="justify-content:flex-start;margin-top:.75rem"><button class="btn s" onclick="txModal(null,'Setoran Tabungan','${x.ID}')">Setor</button><button class="btn s" onclick="tbForm('${x.ID}')">Ubah</button></div></div>`}).join('')||em('Belum ada target tabungan.')}</div>`}
function tbForm(id){const t=id?{...D.target.find(x=>x.ID===id)}:{Status:'Aktif',Tanggal:addM(M,12)+'-01'};fm(id?'Ubah Target':'Target Baru',[['Nama','Nama target','text',0,1],['Nominal','Nominal target','number',0,1,1,1],['Tanggal','Tanggal target','date',0,1]],t,o=>put('target',o,'saveTarget','Target disimpan'))}

/* ===== Tagihan ===== */
function bst(t){if(t.Status==='Lunas')return['Lunas','ok'];const d=Math.round((new Date(t.JatuhTempo)-new Date(today()))/864e5);return d<0?['Terlambat','bad']:d<=3?['Segera','warn']:['Mendatang','info']}
function vTag(){const O=D.tagihan.filter(x=>x.Status==='Belum'),L=[...D.tagihan].sort((x,y)=>(x.Status==='Lunas')-(y.Status==='Lunas')||(x.JatuhTempo<y.JatuhTempo?-1:1)).slice(0,60);
  return hd('Tagihan & Pengingat',O.length+' belum lunas · total '+Rp(O.reduce((s,x)=>s+ +x.Nominal,0)),'<button class="btn p" onclick="tgForm()"><i class="bi bi-plus-lg"></i> Tambah Tagihan</button>')+
  `<div class="cd"><div class="tw">${L.length?`<table><thead><tr><th>Tagihan</th><th>Jatuh tempo</th><th>Ulang</th><th class="r">Nominal</th><th>Status</th><th></th></tr></thead><tbody>${L.map(t=>{const s=bst(t);return`<tr><td>${E(t.Nama)}<small>${E(nm('kategori',t.Kategori))}</small></td><td>${fd(t.JatuhTempo)}</td><td>${E(String(t.Ulang).replace('Custom:','Tiap '))}</td><td class="r">${Rp(t.Nominal)}</td><td><span class="bd ${s[1]}">${s[0]}</span></td><td class="r">${t.Status==='Belum'?`<button class="btn s p" onclick="payForm('${t.ID}')">Tandai Lunas</button> `:''}<button class="ib" onclick="tgForm('${t.ID}')" aria-label="Ubah"><i class="bi bi-pencil"></i></button></td></tr>`}).join('')}</tbody></table>`:em('Belum ada tagihan.')}</div></div>`}
function tgForm(id){const t=id?{...D.tagihan.find(x=>x.ID===id)}:{Ulang:'Bulanan',Pengingat:'7|3|1',JatuhTempo:today(),Kategori:'',Saluran:'Email',Status:'Belum'},cu=/^Custom:/.test(t.Ulang);
  t.Hari=cu?t.Ulang.split(':')[1]:'';if(cu)t.Ulang='Sekali';t.PengTxt=String(t.Pengingat).replace(/\|/g,',');
  fm(id?'Ubah Tagihan':'Tagihan Baru',[['Nama','Nama tagihan','text',0,1],['Nominal','Nominal','number',0,1,1,1],['Kategori','Kategori pengeluaran','select',[['','— Pilih —']].concat(act('kategori').filter(k=>k.Jenis==='Pengeluaran').map(k=>[k.ID,k.Nama])),1],['JatuhTempo','Jatuh tempo berikutnya','date',0,1],['Ulang','Pengulangan','select',['Sekali','Mingguan','Bulanan','Tahunan'].map(x=>[x,x])],['Hari','Atau ulangi setiap N hari (opsional)','number'],['PengTxt','Pengingat H-berapa (pisah koma)','text']],t,o=>{
    if(+o.Hari>0)o.Ulang='Custom:'+(+o.Hari);o.Pengingat=String(o.PengTxt).split(',').map(s=>s.trim()).filter(s=>/^\d+$/.test(s)).join('|')||'7|3|1';delete o.Hari;delete o.PengTxt;put('tagihan',o,'saveTagihan','Tagihan disimpan')})}
function payForm(id){const t=D.tagihan.find(x=>x.ID===id),B=bal();
  fm('Pelunasan: '+E(t.Nama),[['Dompet','Sumber dompet','select',act('dompet').map(w=>[w.ID,w.Nama+' (Saldo '+Rp(B[w.ID])+')']),1],['Tanggal','Tanggal pembayaran','date',0,1],['buat','Catat sebagai pengeluaran?','select',[['Ya','Ya, buat transaksi otomatis'],['Tidak','Tidak']]]],{Dompet:(act('dompet')[0]||{}).ID,Tanggal:today(),buat:'Ya'},o=>pay(id,o.Tanggal,o.Dompet,o.buat==='Ya'),'Tandai Lunas')}
function pay(id,Tanggal,Dompet,buatTx){const t=D.tagihan.find(x=>x.ID===id);let tx=null,nx=null;
  if(buatTx){tx={ID:'~'+uid(),Tanggal,Jenis:'Pengeluaran',Nominal:+t.Nominal,Dompet,DompetTujuan:'',Kategori:t.Kategori,Target:'',Catatan:'Pelunasan '+t.Nama,DibuatOleh:U.email,Dihapus:'Tidak'};D.tx.push(tx)}
  t.Status='Lunas';if(t.Ulang!=='Sekali'){nx={...t,ID:'~'+uid(),JatuhTempo:nextD(t.JatuhTempo,t.Ulang),Status:'Belum'};D.tagihan.push(nx)}
  sv();render();toast('Tagihan lunas'+(nx?' · jadwal berikutnya dibuat':''),'ok');
  push('payTagihan',{ID:id,buatTx,Tanggal,Dompet},d=>{tx&&d.tx&&adopt(tx.ID,d.tx.ID);nx&&d.tagihan&&d.tagihan[1]&&adopt(nx.ID,d.tagihan[1].ID)})}

/* ===== Laporan ===== */
const lap=()=>D.tx.filter(x=>x.Tanggal>=R.a&&x.Tanggal<=R.b&&(!R.w||x.Dompet===R.w||x.DompetTujuan===R.w)).sort((x,y)=>x.Tanggal<y.Tanggal?-1:1);
function pre(p){const n=today(),m=n.slice(0,7);if(p==='ini'){R.a=m+'-01';R.b=n}else if(p==='lalu'){const q=addM(m,-1);R.a=q+'-01';R.b=ld(q)}else{R.a=n.slice(0,4)+'-01-01';R.b=n}render()}
function vLap(){const L=lap(),fn=x=>!R.w||x.Dompet===R.w,i=L.filter(x=>x.Jenis==='Pemasukan').reduce((s,x)=>s+ +x.Nominal,0),o=L.filter(x=>x.Jenis==='Pengeluaran').reduce((s,x)=>s+ +x.Nominal,0),n=i-o;
  const ms=[];for(let m=R.a.slice(0,7);m<=R.b.slice(0,7)&&ms.length<24;m=addM(m,1))ms.push(m);const mt=ms.map(m=>[m,tot('Pemasukan',...mr(m),fn),tot('Pengeluaran',...mr(m),fn)]);
  AF=()=>{chart('c3',{type:'line',data:{labels:ms.map(m=>bs(m)+' '+m.slice(2,4)),datasets:[{label:'Pemasukan',data:mt.map(x=>x[1]),borderColor:'#10B981',backgroundColor:'#10B981',tension:.3},{label:'Pengeluaran',data:mt.map(x=>x[2]),borderColor:'#64748B',backgroundColor:'#64748B',tension:.3}]},options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{position:'bottom'}},scales:{y:{ticks:{callback:v=>v>=1e6?v/1e6+' jt':v}}}}});donut('c4','lg4',R.a,R.b,fn)};
  return hd('Laporan Keuangan','Periode '+fd(R.a)+' s/d '+fd(R.b),'<button class="btn" onclick="window.print()"><i class="bi bi-printer"></i> Cetak / PDF</button><button class="btn p" id="xb" onclick="xl()"><i class="bi bi-file-earmark-excel"></i> Ekspor Excel</button>')+
  `<div class="pr"><h2>${E(C.namaApp||'Keuangan Digital')} — Laporan ${fd(R.a)} s/d ${fd(R.b)}</h2></div>
  <div class="chips np"><button class="btn s" onclick="pre('ini')">Bulan Ini</button><button class="btn s" onclick="pre('lalu')">Bulan Lalu</button><button class="btn s" onclick="pre('thn')">Tahun Ini</button><input type="date" value="${R.a}" onchange="R.a=this.value;render()" aria-label="Dari"><input type="date" value="${R.b}" onchange="R.b=this.value;render()" aria-label="Sampai"><select onchange="R.w=this.value;render()" aria-label="Dompet" style="width:auto">${so([['','Semua dompet']].concat(D.dompet.map(w=>[w.ID,w.Nama])),R.w)}</select></div>
  <div class="g">${kc('Total pemasukan',Rp(i),L.filter(x=>x.Jenis==='Pemasukan').length+' transaksi')}${kc('Total pengeluaran',Rp(o),L.filter(x=>x.Jenis==='Pengeluaran').length+' transaksi')}${kc('Surplus bersih',Rp(n),'Rasio tabungan '+(i?(n/i*100).toFixed(1):'0.0')+'%',n<0?'tbad':'tok')}
  <div class="cd c8"><div class="ch"><h3>Tren bulanan</h3></div><div class="cv"><canvas id="c3" aria-label="Tren"></canvas></div></div><div class="cd c4"><div class="ch"><h3>Per kategori</h3></div><div class="cv" style="height:170px"><canvas id="c4" aria-label="Donut"></canvas></div><div id="lg4"></div></div>
  <div class="cd c12"><div class="ch"><h3>Rekap bulanan</h3></div><div class="tw"><table><thead><tr><th>Bulan</th><th class="r">Masuk</th><th class="r">Keluar</th><th class="r">Surplus</th><th class="r">Rasio</th></tr></thead><tbody>${mt.map(x=>`<tr><td>${bl(x[0])}</td><td class="r">${Rp(x[1])}</td><td class="r">${Rp(x[2])}</td><td class="r ${x[1]-x[2]<0?'tbad':''}">${Rp(x[1]-x[2])}</td><td class="r">${x[1]?((x[1]-x[2])/x[1]*100).toFixed(1)+'%':'—'}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="cd c12"><div class="ch"><h3>Rincian transaksi (${L.length})</h3></div><div class="tw">${L.length?`<table><thead><tr><th>Tanggal</th><th>Jenis</th><th>Kategori / catatan</th><th>Dompet</th><th class="r">Nominal</th></tr></thead><tbody>${L.slice(0,300).map(x=>trow(x)).join('')}</tbody></table>${L.length>300?em('Layar menampilkan 300 baris pertama; file Excel memuat semuanya.'):''}`:em('Tidak ada transaksi pada periode ini.')}</div></div></div>`}
async function xl(){const b=$('#xb');b.disabled=true;
  try{const r=await call('exportXlsx',{a:R.a,b:R.b,d:R.w});if(!r.success)throw Error(r.message);const s=atob(r.data),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);
    const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([u],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));l.download='Laporan_'+R.a+'_'+R.b+'.xlsx';document.body.appendChild(l);l.click();l.remove()}
  catch(e){toast(e.message,'e')}b.disabled=false}

/* ===== Pengaturan (Admin) ===== */
function vSet(){return hd('Pengaturan Aplikasi','Identitas, warna, pengingat, dan pengguna. Hanya Admin.','<button class="btn p" onclick="saveCfg()"><i class="bi bi-check2"></i> Simpan Pengaturan</button>')+
  `<div class="g"><div class="cd c6"><h3>Identitas & warna</h3><label class="f"><span>Nama aplikasi *</span><input id="sn" value="${E(C.namaApp)}"></label>
  <div class="row2"><label class="f"><span>Warna utama</span><input id="sp" type="color" value="${E(C.warnaUtama||'#0F766E')}"></label><label class="f"><span>Warna aksen</span><input id="sa" type="color" value="${E(C.warnaAksen||'#10B981')}"></label></div>
  <button class="btn s" onclick="$('#sp').value='#0F766E';$('#sa').value='#10B981'">Kembalikan ke Bawaan</button></div>
  <div class="cd c6"><h3>Pengingat tagihan</h3><label class="f"><span>Email penerima</span><input id="se" type="email" value="${E(C.emailPengingat)}"></label>
  <label class="f"><span>Jam kirim harian (WIB)</span><select id="sj">${so([...Array(24)].map((_,i)=>[i,String(i).padStart(2,'0')+':00']),+C.jamPengingat)}</select></label><div class="sb">Pemicu Apps Script bisa bergeser beberapa menit.</div></div>
  <div class="cd c12"><div class="ch"><h3>Pengguna & hak akses</h3><button class="btn s" onclick="usForm()"><i class="bi bi-person-plus"></i> Tambah</button></div><div class="tw"><table><thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Status</th><th></th></tr></thead><tbody>${D.pengguna.map(u=>`<tr><td>${E(u.Nama)}</td><td>${E(u.Email)}</td><td><span class="bd ${u.Peran==='Admin'?'info':''}">${E(u.Peran)}</span></td><td><span class="bd ${u.Aktif==='Ya'?'ok':'bad'}">${u.Aktif==='Ya'?'Aktif':'Nonaktif'}</span></td><td class="r">${String(u.Email).toLowerCase()===U.email.toLowerCase()?'<small>Akun Anda</small>':`<button class="btn s" onclick="usForm('${u.ID}')">Ubah</button> <button class="btn s ${u.Aktif==='Ya'?'d':''}" onclick="usOff('${u.ID}')">${u.Aktif==='Ya'?'Nonaktifkan':'Aktifkan'}</button>`}</td></tr>`).join('')}</tbody></table></div><p class="mt">Peran diperiksa di server; akun di luar daftar ini ditolak (403). Beri juga akses edit Spreadsheet ke pengguna baru bila deploy memakai "User accessing".</p></div></div>`}
function saveCfg(){const c={namaApp:$('#sn').value.trim(),warnaUtama:$('#sp').value,warnaAksen:$('#sa').value,emailPengingat:$('#se').value.trim(),jamPengingat:$('#sj').value};if(!c.namaApp)return toast('Nama aplikasi wajib diisi','e');C={...C,...c};sv();theme();toast('Pengaturan disimpan','ok');push('saveCfg',c)}
function usForm(id){const u=id?{...D.pengguna.find(x=>x.ID===id)}:{Peran:'Anggota',Aktif:'Ya'};
  fm(id?'Ubah Pengguna':'Tambah Pengguna',[['Nama','Nama lengkap','text',0,1],['Email','Akun Google (Gmail)','email',0,1],['Peran','Peran','select',[['Anggota','Anggota — catat & ubah data'],['Admin','Admin — akses penuh']]]],u,o=>{o.Email=o.Email.toLowerCase();if(D.pengguna.some(x=>String(x.Email).toLowerCase()===o.Email&&x.ID!==o.ID))return toast('Email sudah terdaftar','e');put('pengguna',o,'saveUser','Pengguna disimpan')})}
function usOff(id){const u=D.pengguna.find(x=>x.ID===id),f=()=>put('pengguna',{...u,Aktif:u.Aktif==='Ya'?'Tidak':'Ya'},'saveUser','Status pengguna diubah');u.Aktif==='Ya'?ask('Nonaktifkan <b>'+E(u.Nama)+'</b>? Ia tidak bisa masuk, riwayat transaksinya tetap aman.',f):f()}

/* ===== Init: tampilkan cache lokal seketika, segarkan dari server di belakang layar ===== */
document.addEventListener('keydown',e=>{if(e.key==='Escape')cm()});
$('#mod').onmousedown=e=>{if(e.target.id==='mod')cm()};
addEventListener('beforeunload',e=>{if(pend){e.preventDefault();e.returnValue=''}});
(function(){let c;try{c=JSON.parse(localStorage.getItem('kd2'))}catch(e){}
  if(c&&c.d&&c.u&&getTok()){U=c.u;C=c.c||{};D=c.d;H=c.h||'';start()} // cache lokal: tampil instan
  if(getTok())load(); // boot langsung berangkat, tidak menunggu Google Sign-In
  authReady(()=>{google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:onCred,auto_select:true,cancel_on_tap_outside:false});
    if(!getTok()&&!Auth.res)showLogin();
    setInterval(()=>{if(Auth.tok&&Auth.exp-Date.now()<600000)try{google.accounts.id.prompt()}catch(e){}},300000)}); // perbarui token sebelum kedaluwarsa
})();
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{})); // cache aset statis → buka ulang instan
