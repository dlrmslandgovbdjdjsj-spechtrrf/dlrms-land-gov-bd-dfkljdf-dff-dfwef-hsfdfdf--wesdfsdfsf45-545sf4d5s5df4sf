(function () {
  const cfg = window.APP_CONFIG || {};

  const valid =
    cfg.SUPABASE_URL &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes('PASTE_') &&
    !cfg.SUPABASE_ANON_KEY.includes('PASTE_');

  const fallback = {
    khatian: '৩০২',
    owner: 'দঃ আবদুল খালেক',
    dag_no: '৪৯৬৯',
    survey: 'আর এস',
    mouza: 'আলাদিনগর',
    upazila: 'বেগমগঞ্জ',
    district: 'নোয়াখালী',
    division: 'চট্টগ্রাম',
    record_date: '২৪ আগস্ট ২০২৬'
  };


  // =====================================================
  // ওয়েবসাইটে তথ্য দেখানো
  // =====================================================

  function paint(data) {

    Object.keys(fallback).forEach(function (key) {

      const element =
        document.getElementById(key);

      if (!element) return;

      if (
        data &&
        data[key] !== null &&
        data[key] !== undefined
      ) {
        element.textContent = data[key];
      } else {
        element.textContent = fallback[key];
      }

    });
  }


  // =====================================================
  // Supabase config না থাকলে
  // =====================================================

  if (!valid || !window.supabase) {

    paint(fallback);

    return;
  }


  // =====================================================
  // Supabase connection
  // =====================================================

  const client =
    window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_ANON_KEY
    );


  // =====================================================
  // URL থেকে ID নেওয়া
  //
  // যেমন:
  //
  // index.html?id=1
  // index.html?id=2
  // index.html?id=3
  //
  // =====================================================

  const params =
    new URLSearchParams(window.location.search);

  const id =
    params.get('id');


  // =====================================================
  // যদি URL-এ কোনো ID না থাকে
  //
  // তাহলে প্রথম/default record দেখাবে
  // =====================================================

  if (!id) {

    client
      .from('land_records')
      .select('*')
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(function (result) {

        const data = result.data;
        const error = result.error;

        if (error || !data) {
          paint(fallback);
        } else {
          paint(data);
        }

      });

    return;
  }


  // =====================================================
  // URL-এ ID থাকলে সেই ID-এর record দেখাবে
  //
  // ?id=1 → ID 1
  // ?id=2 → ID 2
  // ?id=3 → ID 3
  // =====================================================

  const numericId =
    Number(id);


  // ভুল ID হলে fallback
  if (!Number.isInteger(numericId) || numericId <= 0) {

    paint(fallback);

    return;
  }


  client
    .from('land_records')
    .select('*')
    .eq('id', numericId)
    .maybeSingle()
    .then(function (result) {

      const data = result.data;
      const error = result.error;

      if (error || !data) {

        paint(fallback);

      } else {

        paint(data);

      }

    });

})();
