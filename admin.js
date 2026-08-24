(function () {
  const cfg = window.APP_CONFIG || {};

  const valid =
    cfg.SUPABASE_URL &&
    !cfg.SUPABASE_URL.includes('PASTE_') &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_ANON_KEY.includes('PASTE_');

  const ADMIN_EMAIL = 'dlrms.land.gov.bd.jdjsj@gmail.com';

  const loginCard = document.getElementById('login-card');
  const editor = document.getElementById('editor-card');

  const loginMsg = document.getElementById('login-msg');
  const saveMsg = document.getElementById('save-msg');
  const tableBody = document.getElementById('history-body');

  const fields = [
    'khatian',
    'owner',
    'dag_no',
    'survey',
    'mouza',
    'upazila',
    'district',
    'division',
    'record_date'
  ];

  function msg(el, text, ok) {
    el.textContent = text;
    el.className = 'msg ' + (ok ? 'ok' : 'err');
  }

  // Supabase configuration check
  if (!valid || !window.supabase) {
    msg(
      loginMsg,
      'config.js-এ Supabase URL এবং publishable key ঠিকভাবে বসানো হয়নি।',
      false
    );

    document.getElementById('login').disabled = true;
    return;
  }

  const client = window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY
  );

  // =====================================================
  // সব পুরোনো + নতুন রেকর্ড দেখাবে
  // =====================================================
  async function loadHistory() {
    const { data, error } = await client
      .from('land_records')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      msg(saveMsg, error.message, false);
      return;
    }

    tableBody.innerHTML = '';

    (data || []).forEach(function (r) {
      const tr = document.createElement('tr');

      const values = [
        r.id,
        r.khatian,
        r.owner,
        r.dag_no,
        r.survey,
        r.mouza,
        r.record_date
      ];

      values.forEach(function (value) {
        const td = document.createElement('td');
        td.textContent = value ?? '';
        tr.appendChild(td);
      });

      tableBody.appendChild(tr);
    });

    const count = (data || []).length;

    const countEl = document.getElementById('history-count');

    if (countEl) {
      countEl.textContent = 'মোট ' + count + 'টি রেকর্ড';
    }
  }

  // =====================================================
  // Login
  // =====================================================
  async function enter(session) {
    if (!session) return;

    const email = (session.user.email || '').toLowerCase();

    if (email !== ADMIN_EMAIL.toLowerCase()) {
      await client.auth.signOut();

      msg(
        loginMsg,
        'এই ইমেইলটি অ্যাডমিন হিসেবে অনুমোদিত নয়।',
        false
      );

      return;
    }

    loginCard.style.display = 'none';
    editor.style.display = 'block';

    await loadHistory();
  }

  client.auth.getSession().then(function (result) {
    enter(result.data.session);
  });

  document.getElementById('login').onclick = async function () {
    loginMsg.className = 'msg';

    const email = document
      .getElementById('email')
      .value
      .trim();

    const password =
      document.getElementById('password').value;

    const { data, error } =
      await client.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (error) {
      msg(loginMsg, error.message, false);
      return;
    }

    await enter(data.session);
  };

  // =====================================================
  // SAVE = নতুন রেকর্ড তৈরি করবে
  // UPDATE করবে না
  // =====================================================
  document.getElementById('save').onclick = async function () {

    saveMsg.className = 'msg';

    const row = {};

    // সব ঘর থেকে নতুন তথ্য নেওয়া
    for (const field of fields) {

      const input =
        document.getElementById('f_' + field);

      const value = input.value.trim();

      if (!value) {
        msg(
          saveMsg,
          'সবগুলো ঘর পূরণ করুন।',
          false
        );

        return;
      }

      row[field] = value;
    }

    // -----------------------------------------------------
    // সবচেয়ে গুরুত্বপূর্ণ:
    // এখানে UPDATE নেই।
    // এখানে শুধুমাত্র INSERT।
    //
    // তাই প্রতিবার Save চাপলে নতুন ROW তৈরি হবে।
    // পুরোনো ROW পরিবর্তন হবে না।
    // -----------------------------------------------------

    const { data, error } = await client
      .from('land_records')
      .insert([row])
      .select()
      .single();

    if (error) {
      msg(saveMsg, error.message, false);
      return;
    }

    console.log('নতুন রেকর্ড তৈরি হয়েছে:', data);

    // Form খালি করা
    fields.forEach(function (field) {
      document.getElementById('f_' + field).value = '';
    });

    msg(
      saveMsg,
      '✅ নতুন রেকর্ড সফলভাবে তৈরি হয়েছে। পুরোনো রেকর্ড অপরিবর্তিত আছে।',
      true
    );

    // নতুন + পুরোনো সব রেকর্ড আবার দেখানো
    await loadHistory();
  };

  // =====================================================
  // Logout
  // =====================================================
  document.getElementById('logout').onclick =
    async function () {

      await client.auth.signOut();

      location.reload();
    };

})();
