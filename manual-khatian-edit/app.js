(function () {

  "use strict";


  /* =====================================================
     CONFIG
  ====================================================== */

  const cfg =
    window.APP_CONFIG || {};


  const SUPABASE_URL =
    cfg.SUPABASE_URL || "";


  const SUPABASE_ANON_KEY =
    cfg.SUPABASE_ANON_KEY || "";


  /* =====================================================
     SUPABASE
  ====================================================== */

  let client = null;


  if (
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    window.supabase
  ) {

    client =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );

  }


  /* =====================================================
     GET ID FROM URL
     
     Example:
     manual-khatian-edit/index.html?id=25
  ====================================================== */

  const params =
    new URLSearchParams(
      window.location.search
    );


  const recordId =
    params.get("id");


  /* =====================================================
     ALL FIELD IDS
  ====================================================== */

  const fieldIds = [

    "titleText",
    "pageText",

    "division",
    "district",
    "upazila",
    "mouza",

    "jlNo",
    "revisionNo",

    "owner",
    "share",
    "revenue",
    "dag",

    "agri",
    "nonAgri",

    "dagTotalAcre",
    "dagTotalPercent",

    "khatianShare",

    "shareLandAcre",
    "shareLandPercent",

    "totalLand",

    "remarks",

    "printing",
    "printDate"

  ];


  /* =====================================================
     UPDATE PREVIEW TEXT
  ====================================================== */

  function setOutputs(id) {


    const input =
      document.getElementById(id);


    if (!input) {

      return;

    }


    const value =
      input.value;


    document
      .querySelectorAll(
        '[data-out="' +
        id +
        '"]'
      )
      .forEach(
        function (element) {

          element.textContent =
            value;

        }
      );

  }


  /* =====================================================
     UPDATE QR
  ====================================================== */

  function updateQR() {


    const qrBox =
      document.getElementById(
        "qrcode"
      );


    const qrInput =
      document.getElementById(
        "qrUrl"
      );


    if (
      !qrBox ||
      !qrInput
    ) {

      return;

    }


    qrBox.innerHTML = "";


    const url =
      qrInput.value.trim();


    if (!url) {

      qrBox.style.display =
        "none";

      return;

    }


    qrBox.style.display =
      "block";


    if (
      typeof QRCode ===
      "undefined"
    ) {

      console.error(
        "QRCode library পাওয়া যায়নি।"
      );

      return;

    }


    new QRCode(
      qrBox,
      {

        text: url,

        width: 92,

        height: 92,

        correctLevel:
          QRCode.CorrectLevel.M

      }
    );

  }


  /* =====================================================
     UPDATE EVERYTHING
  ====================================================== */

  function updatePreview() {


    fieldIds.forEach(
      function (id) {

        setOutputs(id);

      }
    );


    updateQR();

  }


  /* =====================================================
     SET INPUT VALUE
  ====================================================== */

  function setValue(
    id,
    value
  ) {


    const input =
      document.getElementById(id);


    if (!input) {

      return;

    }


    if (
      value === null ||
      value === undefined
    ) {

      return;

    }


    input.value =
      String(value);

  }


  /* =====================================================
     CREATE SAME PUBLIC URL AS ADMIN
     
     Admin uses:
     
     window.location.origin +
     admin path → index.html +
     ?id=record.id
  ====================================================== */

  function getPublicRecordUrl(id) {


    let publicPath =
      window.location.pathname;


    /*
     * Example:
     
     /manual-khatian-edit/index.html

     becomes:

     /index.html
    */

    publicPath =
      publicPath.replace(
        /manual-khatian-edit\/index\.html$/i,
        "index.html"
      );


    /*
     * Fallback
    */

    if (
      publicPath ===
      window.location.pathname
    ) {


      publicPath =
        publicPath.replace(
          /\/manual-khatian-edit\/?$/i,
          "/"
        );


      if (
        !publicPath.endsWith("/")
      ) {

        publicPath += "/";

      }


      publicPath +=
        "index.html";

    }


    return (

      window.location.origin +

      publicPath +

      "?id=" +

      encodeURIComponent(id)

    );

  }


  /* =====================================================
     LOAD ADMIN RECORD
  ====================================================== */

  async function loadAdminRecord() {


    /*
     * ID না থাকলে manual mode
    */

    if (!recordId) {

      updatePreview();

      return;

    }


    /*
     * Supabase config না থাকলে
     * manual editor চালু থাকবে।
    */

    if (!client) {

      console.error(
        "Supabase config পাওয়া যায়নি।"
      );


      updatePreview();

      return;

    }


    try {


      /* ===============================================
         GET RECORD
      ================================================ */

      const result =
        await client
          .from("land_records")
          .select(
            "id,khatian,owner,dag_no,mouza,record_date"
          )
          .eq(
            "id",
            recordId
          )
          .single();


      const data =
        result.data;


      const error =
        result.error;


      if (error) {


        console.error(
          "Record load error:",
          error
        );


        alert(
          "খতিয়ানের তথ্য লোড করা যায়নি।\n\n" +
          error.message
        );


        updatePreview();

        return;

      }


      if (!data) {


        alert(
          "এই ID-এর কোনো খতিয়ান পাওয়া যায়নি।"
        );


        updatePreview();

        return;

      }


      /* ===============================================
         1. KHATIAN
         
         Admin:
         khatian

         Manual:
         titleText
      ================================================ */

      if (
        data.khatian !== null &&
        data.khatian !== undefined &&
        String(data.khatian).trim() !== ""
      ) {


        setValue(
          "titleText",

          "খতিয়ান নং- " +
          String(
            data.khatian
          ).trim()

        );

      }


      /* ===============================================
         2. OWNER
      ================================================ */

      if (
        data.owner !== null &&
        data.owner !== undefined
      ) {


        setValue(
          "owner",
          data.owner
        );

      }


      /* ===============================================
         3. DAG
         
         Admin:
         dag_no

         Manual:
         dag
      ================================================ */

      if (
        data.dag_no !== null &&
        data.dag_no !== undefined
      ) {


        setValue(
          "dag",
          data.dag_no
        );

      }


      /* ===============================================
         4. MOUZA
      ================================================ */

      if (
        data.mouza !== null &&
        data.mouza !== undefined
      ) {


        setValue(
          "mouza",
          data.mouza
        );

      }


      /* ===============================================
         5. DATE
         
         Admin:
         record_date

         Manual:
         printDate
      ================================================ */

      if (
        data.record_date !== null &&
        data.record_date !== undefined
      ) {


        setValue(
          "printDate",
          data.record_date
        );

      }


      /* ===============================================
         6. QR URL
         
         EXACT SAME RECORD ID
         
         as Admin "খতিয়ান দেখুন"
      ================================================ */

      const publicUrl =
        getPublicRecordUrl(
          data.id
        );


      setValue(
        "qrUrl",
        publicUrl
      );


      /* ===============================================
         UPDATE PREVIEW
      ================================================ */

      updatePreview();


    } catch (error) {


      console.error(
        "Unexpected error:",
        error
      );


      alert(
        "খতিয়ানের তথ্য লোড করার সময় সমস্যা হয়েছে।\n\n" +
        error.message
      );


      updatePreview();

    }

  }


  /* =====================================================
     INPUT EVENTS
  ====================================================== */

  fieldIds.forEach(
    function (id) {


      const input =
        document.getElementById(id);


      if (!input) {

        return;

      }


      input.addEventListener(
        "input",
        updatePreview
      );

    }
  );


  /* =====================================================
     QR INPUT EVENT
  ====================================================== */

  const qrInput =
    document.getElementById(
      "qrUrl"
    );


  if (qrInput) {


    qrInput.addEventListener(
      "input",
      updateQR
    );

  }


  /* =====================================================
     UPDATE BUTTON
  ====================================================== */

  const updateBtn =
    document.getElementById(
      "updateBtn"
    );


  if (updateBtn) {


    updateBtn.addEventListener(
      "click",
      updatePreview
    );

  }


  /* =====================================================
     PRINT / PDF
  ====================================================== */

  const printBtn =
    document.getElementById(
      "printBtn"
    );


  if (printBtn) {


    printBtn.addEventListener(
      "click",
      function () {


        updatePreview();


        setTimeout(
          function () {

            window.print();

          },
          100
        );

      }
    );

  }


  /* =====================================================
     RESET
  ====================================================== */

  const resetBtn =
    document.getElementById(
      "resetBtn"
    );


  if (resetBtn) {


    resetBtn.addEventListener(
      "click",
      function () {


        /*
         * সব editable field খালি
        */

        fieldIds.forEach(
          function (id) {


            const input =
              document.getElementById(
                id
              );


            if (input) {

              input.value = "";

            }

          }
        );


        /*
         * QR-ও খালি
        */

        if (qrInput) {

          qrInput.value = "";

        }


        updatePreview();

      }
    );

  }


  /* =====================================================
     INITIAL
  ====================================================== */

  updatePreview();


  /*
   * URL-এ ID থাকলে
   * Admin data load হবে।
  */

  loadAdminRecord();


})();
