/* Login Google (GIS) + fetch ke GAS. Token Google dikirim di body tiap request dan diverifikasi server. */
const Auth={tok:null,exp:0,res:null};
const jwtExp=t=>{try{return JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).exp*1000}catch(e){return 0}};
function setTok(t){Auth.tok=t;Auth.exp=jwtExp(t||'');try{t?localStorage.setItem('kd_tok',t):localStorage.removeItem('kd_tok')}catch(e){}}
function getTok(){if(!Auth.tok){try{Auth.tok=localStorage.getItem('kd_tok')}catch(e){}Auth.exp=jwtExp(Auth.tok||'')}return Auth.exp>Date.now()+60000?Auth.tok:null}
let _w=null;
function waitTok(){if(!_w)_w=new Promise(res=>{Auth.res=res;try{google.accounts.id.prompt()}catch(e){}setTimeout(()=>{if(Auth.res){Auth.res(null);Auth.res=null}_w=null},8000)});return _w}
function onCred(r){setTok(r.credential);$('#login').hidden=true;if(Auth.res){Auth.res(Auth.tok);Auth.res=null;_w=null}else if($('#app').hidden)load()}
// POST text/plain (tanpa preflight CORS). Mengembalikan {success,data,message,code}
async function post(action,data){
  const tok=getTok()||await waitTok();
  if(!tok){onAuthFail();return{success:false,code:401,message:'Sesi login berakhir. Silakan masuk lagi.'}}
  try{const r=await fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,data,token:tok})});
    const j=await r.json();if(j.code===401)onAuthFail(j.message||j.why);return j}
  catch(e){return{success:false,message:'Gagal terhubung ke server: '+e.message}}}
function onAuthFail(m){setTok(null);showLogin(m)}
function showLogin(m){$('#boot').hidden=true;$('#app').hidden=true;$('#denied').hidden=true;$('#login').hidden=false;
  $('#lm').textContent=/ISI_/.test(GOOGLE_CLIENT_ID)?'Isi GOOGLE_CLIENT_ID di js/config.js terlebih dahulu.':(m||'Masuk dengan akun Google yang terdaftar.');
  try{google.accounts.id.renderButton($('#gbtn'),{theme:'outline',size:'large',text:'signin_with',shape:'pill',locale:'id'});google.accounts.id.prompt()}catch(e){}}
function logout(){try{google.accounts.id.disableAutoSelect()}catch(e){}setTok(null);try{localStorage.removeItem('kd2')}catch(e){}D=null;U=null;H='';RV={};clearTimeout(st);showLogin()}
function authReady(cb,n){n=n||0;if(window.google&&google.accounts&&google.accounts.id)return cb();if(n>200)return deny('Terjadi Kesalahan','Gagal memuat Google Sign-In. Periksa koneksi internet.');setTimeout(()=>authReady(cb,n+1),50)}
