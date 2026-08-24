(function () {
  const cfg = window.APP_CONFIG || {};
  const valid = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_URL.includes('PASTE_') && !cfg.SUPABASE_ANON_KEY.includes('PASTE_');
  const fallback = {
    khatian: '৩০২', owner: 'দঃ আবদুল খালেক', dag_no: '৪৯৬৯', survey: 'আর এস',
    mouza: 'আলাদিনগর', upazila: 'বেগমগঞ্জ', district: 'নোয়াখালী', division: 'চট্টগ্রাম', record_date: '২৪ আগস্ট ২০২৬'
  };
  function paint(d) {
    Object.keys(fallback).forEach(k => {
      const el = document.getElementById(k);
      if (el) el.textContent = d && d[k] != null ? d[k] : fallback[k];
    });
  }
  if (!valid || !window.supabase) { paint(fallback); return; }
  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  client.from('land_records').select('*').eq('id', 1).maybeSingle().then(({data, error}) => {
    if (error || !data) paint(fallback); else paint(data);
  });
})();
