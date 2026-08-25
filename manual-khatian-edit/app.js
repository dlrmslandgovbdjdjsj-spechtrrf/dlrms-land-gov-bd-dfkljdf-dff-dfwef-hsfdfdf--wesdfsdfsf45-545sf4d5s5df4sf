```javascript
(function () {

  'use strict';

  /*
   * =========================================================
   * KHATIAN AUTO-FILL APP
   *
   * কাজ:
   * 1. URL থেকে ?id= নেওয়া
   * 2. Supabase থেকে land_records-এর ঐ ID-এর তথ্য আনা
   * 3. তোমার বর্তমান HTML-এর field-গুলোতে AutoFill করা
   * 4. Preview-তে তথ্য দেখানো
   * 5. QR Code তৈরি করা
   * 6. Manual editing চালু রাখা
   * 7. Print / PDF চালু রাখা
   * =========================================================
   */


  /* =========================================================
     ELEMENTS
  ========================================================= */

  const updateBtn =
    document.getElementById('updateBtn');

  const printBtn =
    document.getElementById('printBtn');

  const resetBtn =
    document.getElementById('resetBtn');

  const qrInput =
    document.getElementById('qrUrl');

  const qrContainer =
    document.getElementById('qrcode');


  /* =========================================================
     FIELD LIST
  ========================================================= */

  const fields = [
    'titleText',
    'pageText',
    'division',
    'district',
    'upazila',
    'mouza',
    'jlNo',
    'revisionNo',
    'owner',
    'share',
    'revenue',
    'dag',
    'agri',
    'nonAgri',
    'dagTotalAcre',
    'dagTotalPercent',
    'khatianShare',
    'shareLandAcre',
    'shareLandPercent',
    'totalLand',
    'remarks',
    'printing',
    'printDate',
    'qrUrl'
  ];


  /* =========================================================
     BASIC HELPERS
  ========================================================= */

  function getField(id) {

    return document.getElementById(id);

  }


  function getValue(id) {

    const element =
      getField(id);

    if (!element) {
      return '';
    }

    return String(
      element.value ?? ''
    );

  }


  function setValue(id, value) {

    const element =
      getField(id);

    if (!element) {
      return;
    }

    element.value =
      value === null ||
      value === undefined
        ? ''
        : String(value);

  }


  function safeText(value) {

    if (
      value === null ||
      value === undefined
    ) {
      return '';
    }

    return String(value);

  }


  /* =========================================================
     STATUS
  ========================================================= */

  function createStatusBox() {

    let status =
      document.getElementById(
        'auto-load-status'
      );

    if (status) {
      return status;
    }


    const controlsHead =
      document.querySelector(
        '.controls-head'
      );


    if (!controlsHead) {
      return null;
    }


    status =
      document.createElement('div');

    status.id =
      'auto-load-status';

    status.style.marginTop =
      '10px';

    status.style.padding =
      '8px 12px';

    status.style.borderRadius =
      '6px';

    status.style.fontSize =
      '14px';

    status.style.fontWeight =
      '700';

    status.style.display =
      'inline-block';

    controlsHead.appendChild(
      status
    );

    return status;

  }


  function setStatus(text, type) {

    const status =
      createStatusBox();

    if (!status) {
      return;
    }


    status.textContent =
      text;


    if (type === 'success') {

      status.style.background =
        '#e8f5e9';

      status.style.color =
        '#087f3d';

    }

    else if (type === 'error') {

      status.style.background =
        '#fdecea';

      status.style.color =
        '#b3261e';

    }

    else {

      status.style.background =
        '#f1f3f4';

      status.style.color =
        '#555';

    }

  }


  /* =========================================================
     PREVIEW
  ========================================================= */

  function updatePreview() {

    const outputs =
      document.querySelectorAll(
        '[data-out]'
      );


    outputs.forEach(
      function (element) {

        const field =
          element.getAttribute(
            'data-out'
          );


        if (!field) {
          return;
        }


        element.textContent =
          getValue(field);

      }
    );


    updateQR();

  }


  /* =========================================================
     QR CODE
  ========================================================= */

  function updateQR() {

    if (!qrContainer) {
      return;
    }


    qrContainer.innerHTML =
      '';


    const url =
      getValue('qrUrl').trim();


    if (
      !url ||
      typeof QRCode === 'undefined'
    ) {

      return;

    }


    try {

      new QRCode(
        qrContainer,
        {
          text: url,
          width: 92,
          height: 92,
          correctLevel:
            QRCode.CorrectLevel.M
        }
      );

    }

    catch (error) {

      console.error(
        'QR Code Error:',
        error
      );

    }

  }


  /* =========================================================
     URL থেকে ID
  ========================================================= */

  function getRecordId() {

    const params =
      new URLSearchParams(
        window.location.search
      );


    const id =
      params.get('id');


    if (!id) {
      return null;
    }


    return id.trim();

  }


  /* =========================================================
     DYNAMIC SCRIPT LOADER
  ========================================================= */

  function loadScript(src) {

    return new Promise(
      function (resolve, reject) {

        const existing =
          document.querySelector(
            'script[src="' + src + '"]'
          );


        if (existing) {

          if (
            existing.dataset.loaded ===
            'true'
          ) {

            resolve();

            return;

          }

          existing.addEventListener(
            'load',
            resolve,
            { once: true }
          );

          existing.addEventListener(
            'error',
            reject,
            { once: true }
          );

          return;

        }


        const script =
          document.createElement(
            'script'
          );


        script.src =
          src;

        script.async =
          false;


        script.onload =
          function () {

            script.dataset.loaded =
              'true';

            resolve();

          };


        script.onerror =
          function () {

            reject(
              new Error(
                'Script load failed: ' +
                src
              )
            );

          };


        document.head.appendChild(
          script
        );

      }
    );

  }


  /* =========================================================
     SUPABASE + CONFIG
  ========================================================= */

  async function prepareSupabase() {

    /*
     * Supabase library না থাকলে নিজে লোড করবে।
     */

    if (!window.supabase) {

      await loadScript(
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
      );

    }


    /*
     * APP_CONFIG না থাকলে config.js লোড করবে।
     *
     * তোমার index.html যদি khatian folder-এর ভিতরে থাকে
     * এবং config.js root folder-এ থাকে,
     * তাহলে ../config.js সঠিক।
     */

    if (
      !window.APP_CONFIG ||
      !window.APP_CONFIG.SUPABASE_URL ||
      !window.APP_CONFIG.SUPABASE_ANON_KEY
    ) {

      try {

        await loadScript(
          '../config.js'
        );

      }

      catch (error) {

        /*
         * একই folder-এ config.js থাকলেও চেষ্টা করবে।
         */

        try {

          await loadScript(
            './config.js'
          );

        }

        catch (secondError) {

          throw new Error(
            'config.js পাওয়া যাচ্ছে না।'
          );

        }

      }

    }


    const cfg =
      window.APP_CONFIG || {};


    const url =
      cfg.SUPABASE_URL || '';


    const key =
      cfg.SUPABASE_ANON_KEY || '';


    if (!url || !key) {

      throw new Error(
        'SUPABASE_URL অথবা SUPABASE_ANON_KEY পাওয়া যায়নি।'
      );

    }


    if (!window.supabase) {

      throw new Error(
        'Supabase library লোড হয়নি।'
      );

    }


    return window.supabase.createClient(
      url,
      key
    );

  }


  /* =========================================================
     DATABASE RECORD → HTML FIELD
  ========================================================= */

  function fillRecord(record) {

    if (!record) {
      return;
    }


    /*
     * তোমার বর্তমান land_records table-এর
     * field অনুযায়ী mapping।
     */

    const mapping = {

      khatian:
        'titleText',

      owner:
        'owner',

      dag_no:
        'dag',

      survey:
        'revisionNo',

      mouza:
        'mouza',

      upazila:
        'upazila',

      district:
        'district',

      division:
        'division',

      record_date:
        'printDate'

    };


    Object.keys(mapping)
      .forEach(
        function (databaseField) {

          const htmlField =
            mapping[databaseField];


          if (
            Object.prototype.hasOwnProperty.call(
              record,
              databaseField
            )
          ) {

            setValue(
              htmlField,
              safeText(
                record[databaseField]
              )
            );

          }

        }
      );


    /* =====================================================
       KHATIAN TITLE
    ===================================================== */

    if (
      record.khatian !== null &&
      record.khatian !== undefined
    ) {

      setValue(
        'titleText',
        'আর এস (জোনাল) খতিয়ান নং- ' +
        safeText(record.khatian)
      );

    }


    /* =====================================================
       DEFAULT PAGE
    ===================================================== */

    if (
      !getValue('pageText').trim()
    ) {

      setValue(
        'pageText',
        'পৃষ্ঠা নং: ১ এর ১'
      );

    }


    /* =====================================================
       DEFAULT PRINTING
    ===================================================== */

    if (
      !getValue('printing').trim()
    ) {

      setValue(
        'printing',
        'সেটেলমেন্ট প্রেস, ঢাকা'
      );

    }


    /* =====================================================
       QR URL
    ===================================================== */

    setValue(
      'qrUrl',
      window.location.href
    );


    /* =====================================================
       PREVIEW
    ===================================================== */

    updatePreview();

  }


  /* =========================================================
     LOAD RECORD
  ========================================================= */

  async function loadRecord() {

    const id =
      getRecordId();


    /*
     * ?id= না থাকলে Manual Mode
     */

    if (!id) {

      setStatus(
        'ম্যানুয়াল মোড — URL-এ কোনো খতিয়ান ID নেই।',
        'manual'
      );


      updatePreview();

      return;

    }


    setStatus(
      'খতিয়ানের তথ্য লোড হচ্ছে...',
      'loading'
    );


    try {

      const client =
        await prepareSupabase();


      /*
       * ID numeric হলে Number করা হবে।
       */

      const databaseId =
        /^\d+$/.test(id)
          ? Number(id)
          : id;


      const result =
        await client
          .from('land_records')
          .select('*')
          .eq('id', databaseId)
          .maybeSingle();


      if (result.error) {

        console.error(
          'Supabase Error:',
          result.error
        );


        setStatus(
          'খতিয়ানের তথ্য লোড করা যায়নি: ' +
          result.error.message,
          'error'
        );


        return;

      }


      if (!result.data) {

        setStatus(
          'এই ID-এর কোনো খতিয়ান পাওয়া যায়নি। ID: ' +
          id,
          'error'
        );


        updatePreview();

        return;

      }


      /*
       * Record পাওয়া গেছে।
       */

      fillRecord(
        result.data
      );


      setStatus(
        '✓ খতিয়ানের তথ্য সফলভাবে অটোফিল হয়েছে। ID: ' +
        id,
        'success'
      );

    }

    catch (error) {

      console.error(
        'AutoFill Error:',
        error
      );


      setStatus(
        'অটোফিল চালু করা যায়নি: ' +
        error.message,
        'error'
      );


      updatePreview();

    }

  }


  /* =========================================================
     LIVE PREVIEW
  ========================================================= */

  fields.forEach(
    function (field) {

      const input =
        getField(field);


      if (!input) {
        return;
      }


      input.addEventListener(
        'input',
        function () {

          updatePreview();

        }
      );

    }
  );


  /* =========================================================
     UPDATE BUTTON
  ========================================================= */

  if (updateBtn) {

    updateBtn.addEventListener(
      'click',
      function () {

        updatePreview();

      }
    );

  }


  /* =========================================================
     PRINT BUTTON
  ========================================================= */

  if (printBtn) {

    printBtn.addEventListener(
      'click',
      function () {

        updatePreview();


        setTimeout(
          function () {

            window.print();

          },
          150
        );

      }
    );

  }


  /* =========================================================
     RESET BUTTON
  ========================================================= */

  if (resetBtn) {

    resetBtn.addEventListener(
      'click',
      function () {

        const confirmed =
          window.confirm(
            'সব ঘরের তথ্য খালি করতে চান?'
          );


        if (!confirmed) {
          return;
        }


        fields.forEach(
          function (field) {

            setValue(
              field,
              ''
            );

          }
        );


        setValue(
          'pageText',
          'পৃষ্ঠা নং: ১ এর ১'
        );


        setValue(
          'printing',
          'সেটেলমেন্ট প্রেস, ঢাকা'
        );


        updatePreview();


        setStatus(
          'সব ঘর খালি করা হয়েছে।',
          'manual'
        );

      }
    );

  }


  /* =========================================================
     START
  ========================================================= */

  updatePreview();


  loadRecord();


})();
```
