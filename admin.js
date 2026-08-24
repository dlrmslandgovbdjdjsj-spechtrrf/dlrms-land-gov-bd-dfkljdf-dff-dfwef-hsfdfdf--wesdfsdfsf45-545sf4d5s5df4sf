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


  // =====================================================
  // Message
  // =====================================================

  function msg(el, text, ok) {

    if (!el) return;

    el.textContent = text;

    el.className =
      'msg ' + (ok ? 'ok' : 'err');
  }


  // =====================================================
  // Supabase configuration
  // =====================================================

  if (!valid || !window.supabase) {

    msg(
      loginMsg,
      'config.js-এ Supabase URL এবং publishable key ঠিকভাবে বসানো হয়নি।',
      false
    );

    const loginButton =
      document.getElementById('login');

    if (loginButton) {
      loginButton.disabled = true;
    }

    return;
  }


  const client =
    window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_ANON_KEY
    );


  // =====================================================
  // Record URL তৈরি
  // =====================================================

  function getRecordUrl(id) {

    const baseUrl =
      window.location.origin +
      window.location.pathname
        .replace('admin.html', 'index.html');

    return (
      baseUrl +
      '?id=' +
      encodeURIComponent(id)
    );
  }


  // =====================================================
  // সব Record দেখানো
  // =====================================================

  async function loadHistory() {

    const { data, error } =
      await client
        .from('land_records')
        .select('*')
        .order('id', {
          ascending: false
        });


    if (error) {

      msg(
        saveMsg,
        error.message,
        false
      );

      return;
    }


    tableBody.innerHTML = '';


    (data || []).forEach(function (record) {

      const tr =
        document.createElement('tr');


      // ID
      const idTd =
        document.createElement('td');

      idTd.textContent =
        record.id ?? '';

      tr.appendChild(idTd);


      // সাধারণ তথ্য
      const values = [
        record.khatian,
        record.owner,
        record.dag_no,
        record.survey,
        record.mouza,
        record.record_date
      ];


      values.forEach(function (value) {

        const td =
          document.createElement('td');

        td.textContent =
          value ?? '';

        tr.appendChild(td);

      });


      // =================================================
      // URL
      // =================================================

      const urlTd =
        document.createElement('td');

      urlTd.className =
        'url-cell';


      const url =
        getRecordUrl(record.id);


      const urlLink =
        document.createElement('a');

      urlLink.href = url;

      urlLink.target = '_blank';

      urlLink.rel = 'noopener';

      urlLink.textContent =
        'খতিয়ান দেখুন';


      urlTd.appendChild(urlLink);

      tr.appendChild(urlTd);


      // =================================================
      // DELETE BUTTON
      // =================================================

      const actionTd =
        document.createElement('td');

      const deleteButton =
        document.createElement('button');


      deleteButton.type =
        'button';

      deleteButton.textContent =
        'ডিলেট';


      deleteButton.style.background =
        '#d93025';

      deleteButton.style.color =
        '#fff';

      deleteButton.style.border =
        '0';

      deleteButton.style.borderRadius =
        '6px';

      deleteButton.style.padding =
        '8px 14px';

      deleteButton.style.fontWeight =
        '700';

      deleteButton.style.cursor =
        'pointer';


      // =================================================
      // Delete click
      // =================================================

      deleteButton.onclick =
        async function () {

          const confirmed =
            confirm(
              'আপনি কি নিশ্চিতভাবে এই খতিয়ানটি ডিলেট করতে চান?\n\n' +
              'খতিয়ান নং: ' +
              (record.khatian ?? '') +
              '\nমালিক: ' +
              (record.owner ?? '') +
              '\n\nডিলেট করলে এটি আর ফিরে পাওয়া যাবে না।'
            );


          if (!confirmed) {
            return;
          }


          deleteButton.disabled =
            true;

          deleteButton.textContent =
            'ডিলেট হচ্ছে...';


          // =================================================
          // Database থেকে DELETE
          // =================================================

          const { error: deleteError } =
            await client
              .from('land_records')
              .delete()
              .eq('id', record.id);


          if (deleteError) {

            alert(
              'ডিলেট করা যায়নি:\n\n' +
              deleteError.message
            );

            deleteButton.disabled =
              false;

            deleteButton.textContent =
              'ডিলেট';

            return;
          }


          // সফলভাবে ডিলেট
          alert(
            '✅ খতিয়ানটি সফলভাবে ডিলেট করা হয়েছে।'
          );


          // তালিকা আবার লোড
          await loadHistory();

        };


      actionTd.appendChild(
        deleteButton
      );

      tr.appendChild(actionTd);


      tableBody.appendChild(tr);

    });


    // =================================================
    // মোট Record
    // =================================================

    const count =
      (data || []).length;


    const countEl =
      document.getElementById(
        'history-count'
      );


    if (countEl) {

      countEl.textContent =
        'মোট ' +
        count +
        'টি রেকর্ড';

    }

  }


  // =====================================================
  // Login session
  // =====================================================

  async function enter(session) {

    if (!session) return;


    const email =
      (
        session.user.email || ''
      ).toLowerCase();


    if (
      email !==
      ADMIN_EMAIL.toLowerCase()
    ) {

      await client.auth.signOut();


      msg(
        loginMsg,
        'এই ইমেইলটি অ্যাডমিন হিসেবে অনুমোদিত নয়।',
        false
      );


      return;
    }


    loginCard.style.display =
      'none';

    editor.style.display =
      'block';


    await loadHistory();

  }


  // =====================================================
  // Existing session check
  // =====================================================

  client.auth
    .getSession()
    .then(function (result) {

      enter(
        result.data.session
      );

    });


  // =====================================================
  // Login
  // =====================================================

  document.getElementById('login').onclick =
    async function () {

      loginMsg.className =
        'msg';


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
        await client.auth
          .signInWithPassword({
            email: email,
            password: password
          });


      if (error) {

        msg(
          loginMsg,
          error.message,
          false
        );

        return;
      }


      await enter(
        data.session
      );

    };


  // =====================================================
  // নতুন Record button
  // =====================================================

  if (newRecordButton) {

    newRecordButton.onclick =
      function () {

        newRecordForm.style.display =
          'block';


        recordUrlBox.style.display =
          'none';


        saveMsg.className =
          'msg';


        fields.forEach(
          function (field) {

            const input =
              document.getElementById(
                'f_' + field
              );


            if (input) {
              input.value = '';
            }

          }
        );


        const firstInput =
          document.getElementById(
            'f_khatian'
          );


        if (firstInput) {
          firstInput.focus();
        }

      };

  }


  // =====================================================
  // Cancel
  // =====================================================

  if (cancelNewButton) {

    cancelNewButton.onclick =
      function () {

        newRecordForm.style.display =
          'none';


        recordUrlBox.style.display =
          'none';


        saveMsg.className =
          'msg';


        fields.forEach(
          function (field) {

            const input =
              document.getElementById(
                'f_' + field
              );


            if (input) {
              input.value = '';
            }

          }
        );

      };

  }


  // =====================================================
  // নতুন Record তৈরি
  // =====================================================

  document.getElementById('save').onclick =
    async function () {

      saveMsg.className =
        'msg';


      const row = {};


      for (const field of fields) {

        const input =
          document.getElementById(
            'f_' + field
          );


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


        row[field] =
          value;

      }


      // INSERT
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


      const newId =
        data.id;


      const recordUrl =
        getRecordUrl(newId);


      recordUrlLink.href =
        recordUrl;


      recordUrlLink.textContent =
        recordUrl;


      recordUrlBox.style.display =
        'block';


      msg(
        saveMsg,
        '✅ নতুন খতিয়ান সফলভাবে সংযুক্ত হয়েছে। ID: ' +
        newId,
        true
      );


      // Form খালি
      fields.forEach(
        function (field) {

          const input =
            document.getElementById(
              'f_' + field
            );


          if (input) {
            input.value = '';
          }

        }
      );


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
