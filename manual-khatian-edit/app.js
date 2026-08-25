(function () {

  'use strict';

  // =====================================================
  // CONFIG
  // =====================================================

  const cfg = window.APP_CONFIG || {};

  const SUPABASE_URL =
    cfg.SUPABASE_URL || '';

  const SUPABASE_ANON_KEY =
    cfg.SUPABASE_ANON_KEY || '';

  const loadStatus =
    document.getElementById('load-status');


  // =====================================================
  // BASIC HELPERS
  // =====================================================

  function getField(id) {
    return document.getElementById(id);
  }


  function getValue(id) {

    const el = getField(id);

    if (!el) {
      return '';
    }

    return String(el.value || '');

  }


  function setValue(id, value) {

    const el = getField(id);

    if (!el) {
      return;
    }

    el.value =
      value === null ||
      value === undefined
        ? ''
        : String(value);

  }


  function clean(value) {

    if (
      value === null ||
      value === undefined
    ) {
      return '';
    }

    return String(value);

  }


  // =====================================================
  // STATUS
  // =====================================================

  function setStatus(text, type) {

    if (!loadStatus) {
      return;
    }

    loadStatus.textContent = text;

    loadStatus.className = 'load-status';

    if (type) {
      loadStatus.classList.add(type);
    }

  }


  // =====================================================
  // PREVIEW
  // =====================================================

  function updatePreview() {

    const outputs =
      document.querySelectorAll('[data-out]');

    outputs.forEach(function (element) {

      const field =
        element.getAttribute('data-out');

      if (!field) {
        return;
      }

      element.textContent =
        getValue(field);

    });

    updateQR();

  }


  // =====================================================
  // QR
  // =====================================================

  function updateQR() {

    const qrContainer =
      document.getElementById('qrcode');

    if (!qrContainer) {
      return;
    }

    qrContainer.innerHTML = '';

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

    } catch (error) {

      console.error(
        'QR Error:',
        error
      );

    }

  }


  // =====================================================
  // URL থেকে ID
  // =====================================================

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


  // =====================================================
  // DATABASE RECORD → FORM
  // =====================================================

  function fillRecord(record) {

    console.log(
      'Supabase record:',
      record
    );


    // ---------------------------------------------------
    // KHATIAN
    // ---------------------------------------------------

    if (
      record.khatian !== null &&
      record.khatian !== undefined
    ) {

      setValue(
        'titleText',
        'আর এস (জোনাল) খতিয়ান নং- ' +
        clean(record.khatian)
      );

    }


    // ---------------------------------------------------
    // OWNER
    // ---------------------------------------------------

    setValue(
      'owner',
      clean(record.owner)
    );


    // ---------------------------------------------------
    // DAG
    // ---------------------------------------------------

    setValue(
      'dag',
      clean(record.dag_no)
    );


    // ---------------------------------------------------
    // SURVEY
    // ---------------------------------------------------

    setValue(
      'revisionNo',
      clean(record.survey)
    );


    // ---------------------------------------------------
    // MOUZA
    // ---------------------------------------------------

    setValue(
      'mouza',
      clean(record.mouza)
    );


    // ---------------------------------------------------
    // UPAZILA
    // ---------------------------------------------------

    setValue(
      'upazila',
      clean(record.upazila)
    );


    // ---------------------------------------------------
    // DISTRICT
    // ---------------------------------------------------

    setValue(
      'district',
      clean(record.district)
    );


    // ---------------------------------------------------
    // DIVISION
    // ---------------------------------------------------

    setValue(
      'division',
      clean(record.division)
    );


    // ---------------------------------------------------
    // DATE
    // ---------------------------------------------------

    setValue(
      'printDate',
      clean(record.record_date)
    );


    // ---------------------------------------------------
    // DEFAULT PAGE
    // ---------------------------------------------------

    if (!getValue('pageText').trim()) {

      setValue(
        'pageText',
        'পৃষ্ঠা নং: ১ এর ১'
      );

    }


    // ---------------------------------------------------
    // DEFAULT PRINTING
    // ---------------------------------------------------

    if (!getValue('printing').trim()) {

      setValue(
        'printing',
        'সেটেলমেন্ট প্রেস, ঢাকা'
      );

    }


    // ---------------------------------------------------
    // QR URL
    // ---------------------------------------------------

    setValue(
      'qrUrl',
      window.location.href
    );


    // ---------------------------------------------------
    // UPDATE SCREEN
    // ---------------------------------------------------

    updatePreview();

  }


  // =====================================================
  // SUPABASE LOAD
  // =====================================================

  async function loadRecord() {

    const id =
      getRecordId();


    // ---------------------------------------------------
    // NO ID
    // ---------------------------------------------------

    if (!id) {

      setStatus(
        'ম্যানুয়াল মোড — URL-এ কোনো খতিয়ান ID নেই।',
        'manual'
      );

      updatePreview();

      return;

    }


    // ---------------------------------------------------
    // CONFIG CHECK
    // ---------------------------------------------------

    if (
      !SUPABASE_URL ||
      !SUPABASE_ANON_KEY
    ) {

      setStatus(
        'Supabase configuration পাওয়া যায়নি।',
        'error'
      );

      console.error(
        'SUPABASE CONFIG MISSING',
        {
          SUPABASE_URL,
          SUPABASE_ANON_KEY
        }
      );

      return;

    }


    // ---------------------------------------------------
    // SUPABASE LIBRARY CHECK
    // ---------------------------------------------------

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== 'function'
    ) {

      setStatus(
        'Supabase library লোড হয়নি।',
        'error'
      );

      console.error(
        'Supabase JS library missing'
      );

      return;

    }


    setStatus(
      'খতিয়ানের তথ্য লোড হচ্ছে...',
      'loading'
    );


    try {

      const client =
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_ANON_KEY
        );


      // -------------------------------------------------
      // ID
      // -------------------------------------------------

      const recordId =
        /^\d+$/.test(id)
          ? Number(id)
          : id;


      console.log(
        'Loading Khatian ID:',
        recordId
      );


      // -------------------------------------------------
      // DATABASE QUERY
      // -------------------------------------------------

      const {
        data,
        error
      } = await client
        .from('land_records')
        .select('*')
        .eq('id', recordId)
        .maybeSingle();


      // -------------------------------------------------
      // ERROR
      // -------------------------------------------------

      if (error) {

        console.error(
          'Supabase error:',
          error
        );

        setStatus(
          'খতিয়ানের তথ্য লোড করা যায়নি: ' +
          error.message,
          'error'
        );

        return;

      }


      // -------------------------------------------------
      // NO RECORD
      // -------------------------------------------------

      if (!data) {

        console.error(
          'No record found for ID:',
          recordId
        );

        setStatus(
          'এই ID-এর কোনো খতিয়ান পাওয়া যায়নি। ID: ' +
          id,
          'error'
        );

        return;

      }


      // -------------------------------------------------
      // AUTOFILL
      // -------------------------------------------------

      fillRecord(data);


      setStatus(
        '✓ খতিয়ানের তথ্য সফলভাবে AutoFill হয়েছে। ID: ' +
        id,
        'success'
      );


    } catch (error) {

      console.error(
        'AutoFill error:',
        error
      );

      setStatus(
        'AutoFill করতে সমস্যা হয়েছে: ' +
        error.message,
        'error'
      );

    }

  }


  // =====================================================
  // FORM FIELDS
  // =====================================================

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


  // =====================================================
  // LIVE PREVIEW
  // =====================================================

  fields.forEach(function (field) {

    const input =
      getField(field);

    if (!input) {
      return;
    }

    input.addEventListener(
      'input',
      updatePreview
    );

  });


  // =====================================================
  // UPDATE BUTTON
  // =====================================================

  const updateBtn =
    document.getElementById('updateBtn');

  if (updateBtn) {

    updateBtn.addEventListener(
      'click',
      updatePreview
    );

  }


  // =====================================================
  // PRINT BUTTON
  // =====================================================

  const printBtn =
    document.getElementById('printBtn');

  if (printBtn) {

    printBtn.addEventListener(
      'click',
      function () {

        updatePreview();

        setTimeout(
          function () {
            window.print();
          },
          200
        );

      }
    );

  }


  // =====================================================
  // RESET
  // =====================================================

  const resetBtn =
    document.getElementById('resetBtn');

  if (resetBtn) {

    resetBtn.addEventListener(
      'click',
      function () {

        const ok =
          window.confirm(
            'সব ঘরের তথ্য খালি করতে চান?'
          );

        if (!ok) {
          return;
        }


        fields.forEach(
          function (field) {
            setValue(field, '');
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


  // =====================================================
  // INITIAL
  // =====================================================

  updatePreview();


  // গুরুত্বপূর্ণ:
  // Supabase/config লোড হওয়ার পর AutoFill চালানো হচ্ছে

  window.addEventListener(
    'load',
    function () {

      loadRecord();

    }
  );

})();
