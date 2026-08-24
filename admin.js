(function(){
  const cfg=window.APP_CONFIG||{};
  const valid=cfg.SUPABASE_URL&&!cfg.SUPABASE_URL.includes('PASTE_')&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_ANON_KEY.includes('PASTE_');
  const loginCard=document.getElementById('login-card'), editor=document.getElementById('editor-card');
  const lm=document.getElementById('login-msg'), sm=document.getElementById('save-msg');
  function msg(el,t,ok){el.textContent=t;el.className='msg '+(ok?'ok':'err');}
  if(!valid||!window.supabase){msg(lm,'config.js-এ Supabase URL এবং anon key বসানো হয়নি।',false);document.getElementById('login').disabled=true;return;}
  const client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
  const fields=['khatian','owner','dag_no','survey','mouza','upazila','district','division','record_date'];
  function fill(d){fields.forEach(k=>document.getElementById('f_'+k).value=d?.[k]??'');}
  async function load(){const {data,error}=await client.from('land_records').select('*').eq('id',1).maybeSingle();if(error){msg(sm,error.message,false);return;}fill(data);}
  async function enter(session){if(!session)return;loginCard.style.display='none';editor.style.display='block';await load();}
  client.auth.getSession().then(({data})=>enter(data.session));
  document.getElementById('login').onclick=async()=>{lm.className='msg';const email=document.getElementById('email').value.trim(),password=document.getElementById('password').value;const {data,error}=await client.auth.signInWithPassword({email,password});if(error){msg(lm,error.message,false);return;}await enter(data.session);};
  document.getElementById('save').onclick=async()=>{sm.className='msg';const row={id:1};fields.forEach(k=>row[k]=document.getElementById('f_'+k).value.trim());const {error}=await client.from('land_records').upsert(row);if(error)msg(sm,error.message,false);else msg(sm,'তথ্য সফলভাবে আপডেট হয়েছে। এখন হোম পেজ রিফ্রেশ করলে নতুন তথ্য দেখা যাবে।',true);};
  document.getElementById('logout').onclick=async()=>{await client.auth.signOut();location.reload();};
})();
