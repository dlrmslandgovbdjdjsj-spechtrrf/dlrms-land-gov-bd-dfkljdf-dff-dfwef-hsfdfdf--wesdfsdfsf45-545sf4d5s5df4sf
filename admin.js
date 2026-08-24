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

  const newRecordButton = document.getElementById('new-record');
  const newRecordForm = document.getElementById('new-record-form');
  const cancelNewButton = document.getElementById('cancel-new');

  const recordUrlBox = document.getElementById('record-url');
  const recordUrlLink = document.getElementById('record-url-link');

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
    if (!el) return;

    el.textContent = text;
    el.className = 'msg ' + (ok ? 'ok' : 'err');
  }

  // =====================================================
  // Supabase check
  // =====================================================

  if (!valid || !window.supabase) {
    msg(
      loginMsg,
      'config.js-এ Supabase URL এবং publishable key ঠিকভাবে বসানো হয়নি।',
      false
    );

    const loginButton = document.getElementById('login');

    if (loginButton) {
      loginButton.disabled = true;
    }

    return;
  }

  const client = window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY
  );


  // =====================================================
  // প্রতিটি খতিয়ানের URL তৈরি
  // =====================================================

  function makeRecordUrl(id) {

    const url = new URL(
      'index.html',
      window.location.href
    );

    url.searchParams.set('id', id);

    return url.href;
  }


  // =====================================================
  // সব খতিয়ানের তালিকা + URL
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

    (data || []).forEach(function (record) {

      const tr = document.createElement('tr');

      // -------------------------
      // ID
      // -------------------------

      const idTd = document.createElement('td');
      idTd.textContent = record.id;
      tr.appendChild(idTd);


      // -------------------------
      // অন্যান্য তথ্য
      // -------------------------

      const values = [
        record.khatian,
        record.owner,
        record.dag_no,
        record.survey,
        record.mouza,
        record.record_date
      ];

      values.forEach(function (value) {

        const td = document.createElement('td');

        td.textContent = value ?? '';

        tr.appendChild(td);
      });


      // -------------------------
      // URL
      // -------------------------

      const urlTd = document.createElement('td');

      const url = makeRecordUrl(record.id);

      const link = document.createElement('a');

      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      link.textContent = 'খতিয়ান দেখুন';

      link.style.color = '#075db5';
      link.style.fontWeight = '700';

      urlTd.appendChild(link);

      tr.appendChild(urlTd);


      tableBody.appendChild(tr);
    });


    // মোট রেকর্ড

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

    const email =
      (session.user.email || '').toLowerCase();

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


  // =====================================================
  // Login button
  // =====================================================

  document.getElementById('login').onclick =
    async function () {

      loginMsg.className = 'msg';

      const email =
        document
          .getElementById('email')
          .value
          .trim();

      const password =
        document
          .getElementById('password')
          .value;

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
  // নতুন সংযুক্ত করুন
  // =====================================================

  if (newRecordButton) {

    newRecordButton.onclick = function () {

      newRecordForm.style.display = 'block';

      recordUrlBox.style.display = 'none';

      saveMsg.className = 'msg';

      fields.forEach(function (field) {

        const input =
          document.getElementById('f_' + field);

        if (input) {
          input.value = '';
        }
      });

      const firstInput =
        document.getElementById('f_khatian');

      if (firstInput) {
        firstInput.focus();
      }
    };
  }


  // =====================================================
  // Cancel
  // =====================================================

  if (cancelNewButton) {

    cancelNewButton.onclick = function () {

      newRecordForm.style.display = 'none';

      recordUrlBox.style.display = 'none';

      saveMsg.className = 'msg';

      fields.forEach(function (field) {

        const input =
          document.getElementById('f_' + field);

        if (input) {
          input.value = '';
        }
      });
    };
  }


  // =====================================================
  // নতুন খতিয়ান INSERT
  // =====================================================

  document.getElementById('save').onclick =
    async function () {

      saveMsg.className = 'msg';

      const row = {};

      for (const field of fields) {

        const input =
          document.getElementById('f_' + field);

        const value =
          input.value.trim();

        if (!value) {

          msg(
            saveMsg,
            'সবগুলো ঘর পূরণ করুন।',
            false
          );

          input.focus();

          return;
        }

        row[field] = value;
      }


      // =================================================
      // শুধু INSERT
      // =================================================

      const { data, error } =
        await client
          .from('land_records')
          .insert([row])
          .select()
          .single();


      if (error) {

        msg(
          saveMsg,
          error.message,
          false
        );

        return;
      }


      // =================================================
      // নতুন ID
      // =================================================

      const newId = data.id;


      // =================================================
      // নতুন খতিয়ানের URL
      // =================================================

      const recordUrl = makeRecordUrl(newId);


      recordUrlLink.href = recordUrl;

      recordUrlLink.textContent = recordUrl;

      recordUrlBox.style.display = 'block';


      // =================================================
      // সফল বার্তা
      // =================================================

      msg(
        saveMsg,
        '✅ নতুন খতিয়ান সফলভাবে সংযুক্ত হয়েছে। ID: ' + newId,
        true
      );


      // =================================================
      // Form খালি
      // =================================================

      fields.forEach(function (field) {

        const input =
          document.getElementById('f_' + field);

        if (input) {
          input.value = '';
        }
      });


      // =================================================
      // তালিকা আবার লোড
      // =================================================

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
