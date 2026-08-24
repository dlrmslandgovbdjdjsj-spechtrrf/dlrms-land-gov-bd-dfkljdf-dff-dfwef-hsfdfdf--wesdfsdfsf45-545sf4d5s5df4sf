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

  const newRecordButton =
    document.getElementById('new-record');

  const newRecordForm =
    document.getElementById('new-record-form');

  const cancelNewButton =
    document.getElementById('cancel-new');

  const recordUrlBox =
    document.getElementById('record-url');

  const recordUrlLink =
    document.getElementById('record-url-link');


  // =====================================================
  // যে ফিল্ডগুলো Supabase-এ যাবে
  // =====================================================

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
  // Message দেখানোর function
  // =====================================================

  function msg(element, text, success) {

    if (!element) return;

    element.textContent = text;

    element.className =
      'msg ' + (success ? 'ok' : 'err');
  }


  // =====================================================
  // Supabase configuration check
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


  // =====================================================
  // Supabase client
  // =====================================================

  const client =
    window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_ANON_KEY
    );


  // =====================================================
  // প্রতিটি রেকর্ডের আলাদা URL তৈরি
  //
  // যেমন:
  // ID 1 → index.html?id=1
  // ID 2 → index.html?id=2
  // ID 3 → index.html?id=3
  // =====================================================

  function makeRecordUrl(id) {

    const currentUrl =
      new URL(window.location.href);

    currentUrl.pathname =
      currentUrl.pathname.replace(
        /admin\.html$/i,
        'index.html'
      );

    currentUrl.search = '';

    currentUrl.hash = '';

    currentUrl.searchParams.set(
      'id',
      id
    );

    return currentUrl.toString();
  }


  // =====================================================
  // সব খতিয়ানের তালিকা দেখানো
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


    if (!tableBody) return;

    tableBody.innerHTML = '';


    (data || []).forEach(function (record) {

      const tr =
        document.createElement('tr');


      // -------------------------------
      // ID
      // -------------------------------

      const idTd =
        document.createElement('td');

      idTd.textContent =
        record.id ?? '';

      tr.appendChild(idTd);


      // -------------------------------
      // সাধারণ তথ্য
      // -------------------------------

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


      // -------------------------------
      // URL
      // -------------------------------

      const urlTd =
        document.createElement('td');

      urlTd.className =
        'url-cell';


      const link =
        document.createElement('a');

      const url =
        makeRecordUrl(record.id);

      link.href = url;

      link.textContent =
        'দেখুন';

      link.target = '_blank';

      link.rel = 'noopener';


      urlTd.appendChild(link);

      tr.appendChild(urlTd);


      tableBody.appendChild(tr);

    });


    // -------------------------------
    // মোট রেকর্ড
    // -------------------------------

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
      (session.user.email || '')
        .toLowerCase();


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
  // আগে থেকেই Login করা থাকলে
  // =====================================================

  client.auth
    .getSession()
    .then(function (result) {

      enter(
        result.data.session
      );

    });


  // =====================================================
  // Login button
  // =====================================================

  const loginButton =
    document.getElementById('login');


  if (loginButton) {

    loginButton.onclick =
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

  }


  // =====================================================
  // "নতুন সংযুক্ত করুন" button
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


        // Form খালি করা

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


        // প্রথম ঘরে cursor

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
  // Cancel button
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
  // নতুন খতিয়ান তৈরি
  //
  // খুব গুরুত্বপূর্ণ:
  //
  // এখানে UPDATE নেই।
  //
  // শুধু INSERT আছে।
  //
  // তাই প্রতিবার নতুন ID হবে।
  // =====================================================

  const saveButton =
    document.getElementById('save');


  if (saveButton) {

    saveButton.onclick =
      async function () {

        saveMsg.className =
          'msg';


        const row = {};


        // -----------------------------------------------
        // Form থেকে তথ্য নেওয়া
        // -----------------------------------------------

        for (const field of fields) {

          const input =
            document.getElementById(
              'f_' + field
            );


          if (!input) continue;


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


        // -----------------------------------------------
        // নতুন Record INSERT
        // -----------------------------------------------

        const { data, error } =
          await client
            .from('land_records')
            .insert([row])
            .select()
            .single();


        // -----------------------------------------------
        // Error
        // -----------------------------------------------

        if (error) {

          msg(
            saveMsg,
            error.message,
            false
          );

          return;
        }


        // -----------------------------------------------
        // নতুন ID
        // -----------------------------------------------

        const newId =
          data.id;


        // -----------------------------------------------
        // নতুন Record-এর URL
        // -----------------------------------------------

        const recordUrl =
          makeRecordUrl(newId);


        // URL box দেখানো

        if (recordUrlBox) {

          recordUrlBox.style.display =
            'block';

        }


        if (recordUrlLink) {

          recordUrlLink.href =
            recordUrl;

          recordUrlLink.textContent =
            recordUrl;

        }


        // -----------------------------------------------
        // Success message
        // -----------------------------------------------

        msg(
          saveMsg,
          '✅ নতুন খতিয়ান সফলভাবে সংযুক্ত হয়েছে। ID: ' +
          newId,
          true
        );


        // -----------------------------------------------
        // Form খালি
        // -----------------------------------------------

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


        // -----------------------------------------------
        // তালিকা Refresh
        // -----------------------------------------------

        await loadHistory();

      };

  }


  // =====================================================
  // Logout
  // =====================================================

  const logoutButton =
    document.getElementById('logout');


  if (logoutButton) {

    logoutButton.onclick =
      async function () {

        await client.auth.signOut();

        location.reload();

      };

  }

})();
