(function () {

  'use strict';


  /* =====================================================
     CONFIG
  ===================================================== */

  const cfg = window.APP_CONFIG || {};

  const SUPABASE_URL =
    cfg.SUPABASE_URL || '';

  const SUPABASE_ANON_KEY =
    cfg.SUPABASE_ANON_KEY || '';


  const hasSupabase =
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    window.supabase;


  /* =====================================================
     ELEMENTS
  ===================================================== */

  const loadStatus =
    document.getElementById('load-status');


  const outputElements =
    document.querySelectorAll('[data-out]');


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


  /* =====================================================
     ALL FORM FIELDS
  ===================================================== */

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


  /* =====================================================
     HELPERS
  ===================================================== */

  function getField(id) {

    return document.getElementById(id);

  }


  function getValue(id) {

    const el =
      getField(id);

    if (!el) {
      return '';
    }

    return String(
      el.value ?? ''
    );

  }


  function setValue(id, value) {

    const el =
      getField(id);

    if (!el) {
      return;
    }

    el.value =
      value == null
        ? ''
        : String(value);

  }


  function cleanValue(value) {

    if (
      value === null ||
      value === undefined
    ) {
      return '';
    }

    return String(value);

  }


  /* =====================================================
     OUTPUT TO PREVIEW
  ===================================================== */

  function updatePreview() {

    outputElements.forEach(function (element) {

      const field =
        element.getAttribute('data-out');

      if (!field) {
        return;
      }

      element.textContent =
        getValue(field);

    });


    updateQr();

  }


  /* =====================================================
     QR CODE
  ===================================================== */

  function updateQr() {

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

    } catch (error) {

      console.error(
        'QR Code Error:',
        error
      );

    }

  }


  /* =====================================================
     URL ID
  ===================================================== */

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


    return id;

  }


  /* =====================================================
     LOAD STATUS
  ===================================================== */

  function setStatus(
    text,
    type
  ) {

    if (!loadStatus) {
      return;
    }


    loadStatus.textContent =
      text;


    loadStatus.className =
      'load-status';


    if (type) {

      loadStatus.classList.add(
        type
      );

    }

  }


  /* =====================================================
     MAP SUPABASE RECORD
     → EDITOR FIELDS
  ===================================================== */

  function fillFromRecord(record) {

    if (!record) {
      return;
    }


    /*
      Database field → editor field

      মূল land_records-এর field ব্যবহার করা হয়েছে।
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
      .forEach(function (databaseField) {

        const editorField =
          mapping[databaseField];


        if (
          Object.prototype.hasOwnProperty.call(
            record,
            databaseField
          )
        ) {

          setValue(
            editorField,
            cleanValue(
              record[databaseField]
            )
          );

        }

      });


    /*
      Title
    */

    if (
      record.khatian !== undefined &&
      record.khatian !== null
    ) {

      setValue(
        'titleText',
        'আর এস (জোনাল) খতিয়ান নং- ' +
        cleanValue(record.khatian)
      );

    }


    /*
      Page information
    */

    if (!getValue('pageText').trim()) {

      setValue(
        'pageText',
        'পৃষ্ঠা নং: ১ এর ১'
      );

    }


    /*
      Default printing
    */

    if (!getValue('printing').trim()) {

      setValue(
        'printing',
        'সেটেলমেন্ট প্রেস, ঢাকা'
      );

    }


    /*
      QR URL

      যদি URL field আগে থেকেই না থাকে,
      বর্তমান record-এর URL তৈরি করা হবে।
    */

    if (!getValue('qrUrl').trim()) {

      setValue(
        'qrUrl',
        window.location.href
      );

    }


    /*
      Preview update
    */

    updatePreview();

  }


  /* =====================================================
     SUPABASE LOAD
  ===================================================== */

  async function loadRecord() {

    const id =
      getRecordId();


    /*
      ID না থাকলে manual mode
    */

    if (!id) {

      setStatus(
        'ম্যানুয়াল মোড — URL-এ কোনো খতিয়ান ID দেওয়া হয়নি।',
        'manual'
      );


      updatePreview();

      return;

    }


    /*
      Config check
    */

    if (!hasSupabase) {

      setStatus(
        'Supabase config পাওয়া যায়নি। config.js পরীক্ষা করুন।',
        'error'
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
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_ANON_KEY
        );


      /*
        ID numeric হলে numeric হিসেবে পাঠানো হবে।
        অন্যথায় string হিসেবে থাকবে।
      */

      const numericId =
        /^\d+$/.test(id)
          ? Number(id)
          : id;


      const result =
        await client
          .from('land_records')
          .select('*')
          .eq('id', numericId)
          .maybeSingle();


      if (result.error) {

        console.error(
          result.error
        );


        setStatus(
          'খতিয়ান লোড করা যায়নি: ' +
          result.error.message,
          'error'
        );


        updatePreview();

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


      fillFromRecord(
        result.data
      );


      setStatus(
        '✓ খতিয়ানের তথ্য সফলভাবে লোড হয়েছে। ID: ' +
        id,
        'success'
      );


    } catch (error) {

      console.error(
        error
      );


      setStatus(
        'তথ্য লোড করতে সমস্যা হয়েছে।',
        'error'
      );


      updatePreview();

    }

  }


  /* =====================================================
     UPDATE BUTTON
  ===================================================== */

  if (updateBtn) {

    updateBtn.addEventListener(
      'click',
      function () {

        updatePreview();

      }
    );

  }


  /* =====================================================
     LIVE PREVIEW
  ===================================================== */

  fields.forEach(function (field) {

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

  });


  /* =====================================================
     PRINT
  ===================================================== */

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


  /* =====================================================
     RESET
  ===================================================== */

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


        /*
          Default values
        */

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


  /* =====================================================
     INITIAL
  ===================================================== */

  updatePreview();


  loadRecord();


})();
