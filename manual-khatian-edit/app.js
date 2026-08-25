(function () {

  "use strict";


  /*
   * =========================================================
   * CONFIG
   * =========================================================
   */

  const cfg = window.APP_CONFIG || {};


  const SUPABASE_URL =
    cfg.SUPABASE_URL || "";


  const SUPABASE_ANON_KEY =
    cfg.SUPABASE_ANON_KEY || "";


  /*
   * =========================================================
   * FIELD LIST
   * =========================================================
   */

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


  /*
   * =========================================================
   * SUPABASE CLIENT
   * =========================================================
   */

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


  /*
   * =========================================================
   * GET RECORD ID
   *
   * Admin থেকে URL হবে:
   *
   * manual-khatian-edit/index.html?id=123
   * =========================================================
   */

  const params =
    new URLSearchParams(
      window.location.search
    );


  const recordId =
    params.get("id");


  /*
   * =========================================================
   * SET PREVIEW OUTPUT
   * =========================================================
   */

  function setOutputs(id) {

    const input =
      document.getElementById(id);


    if (!input) {
      return;
    }


    document
      .querySelectorAll(
        '[data-out="' + id + '"]'
      )
      .forEach(
        function (el) {

          el.textContent =
            input.value;

        }
      );

  }


  /*
   * =========================================================
   * UPDATE QR
   * =========================================================
   */

  function updateQR() {

    const box =
      document.getElementById("qrcode");


    const input =
      document.getElementById("qrUrl");


    if (!box || !input) {
      return;
    }


    box.innerHTML = "";


    const url =
      input.value.trim();


    if (!url) {

      box.style.display =
        "none";

      return;
    }


    box.style.display =
      "block";


    if (
      typeof QRCode ===
      "undefined"
    ) {

      console.warn(
        "QRCode library পাওয়া যায়নি।"
      );

      return;
    }


    new QRCode(
      box,
      {
        text: url,

        width: 92,

        height: 92,

        correctLevel:
          QRCode.CorrectLevel.M
      }
    );

  }


  /*
   * =========================================================
   * UPDATE PREVIEW
   * =========================================================
   */

  function updatePreview() {

    fieldIds.forEach(
      setOutputs
    );


    updateQR();

  }


  /*
   * =========================================================
   * SET INPUT VALUE
   * =========================================================
   */

  function setValue(
    id,
    value
  ) {

    const input =
      document.getElementById(id);


    if (!input) {
      return;
    }


    /*
     * null / undefined হলে
     * field খালি থাকবে।
     */

    if (
      value === null ||
      value === undefined
    ) {

      return;

    }


    input.value =
      String(value);

  }


  /*
   * =========================================================
   * PUBLIC KHATIAN URL
   *
   * Admin-এর getRecordUrl()-এর সমতুল্য।
   *
   * উদাহরণ:
   *
   * https://example.com/index.html?id=123
   * =========================================================
   */

  function getPublicRecordUrl(
    id
  ) {

    const currentPath =
      window.location.pathname;


    /*
     * manual-khatian-edit/index.html
     * অংশ বাদ দিয়ে মূল website-এর
     * index.html তৈরি করা হচ্ছে।
     */

    let publicPath =
      currentPath.replace(
        /manual-khatian-edit\/index\.html$/i,
        "index.html"
      );


    /*
     * যদি কোনো কারণে replace না হয়,
     * তাহলে fallback হিসেবে
     * directory ধরে index.html তৈরি করা হবে।
     */

    if (
      publicPath ===
      currentPath
    ) {

      publicPath =
        currentPath
          .replace(
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


  /*
   * =========================================================
   * AUTO FILL FROM ADMIN RECORD
   * =========================================================
   */

  async function loadAdminRecord() {

    /*
     * URL-এ ID না থাকলে কিছুই করব না।
     *
     * ফলে সরাসরি manual page খুললেও
     * আগের মতো manually কাজ করা যাবে।
     */

    if (!recordId) {

      updatePreview();

      return;

    }


    /*
     * Supabase config না থাকলে
     * manual editor কাজ চালিয়ে যাবে।
     */

    if (!client) {

      console.warn(
        "Supabase config পাওয়া যায়নি। Manual mode চালু থাকবে।"
      );

      updatePreview();

      return;

    }


    try {

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
          "খতিয়ানের তথ্য লোড করা যায়নি:",
          error
        );


        alert(
          "এই খতিয়ানের তথ্য লোড করা যায়নি।\n\n" +
          error.message
        );


        /*
         * Error হলেও manual editor
         * বন্ধ হবে না।
         */

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


      /*
       * =====================================================
       * ADMIN DATA → MANUAL KHATIAN
       * =====================================================
       *
       * Admin:
       * khatian
       * owner
       * dag_no
       * mouza
       * record_date
       *
       * এগুলো শুধু অটো ফিল হবে।
       *
       * বাকি field untouched থাকবে।
       */


      /*
       * ১. খতিয়ান
       *
       * Admin-এর khatian →
       * Manual editor-এর titleText
       */

      if (
        data.khatian !== null &&
        data.khatian !== undefined &&
        String(data.khatian).trim() !== ""
      ) {

        setValue(
          "titleText",
          "খতিয়ান নং- " +
          String(data.khatian).trim()
        );

      }


      /*
       * ২. মালিক
       */

      if (
        data.owner !== null &&
        data.owner !== undefined
      ) {

        setValue(
          "owner",
          data.owner
        );

      }


      /*
       * ৩. দাগ নং
       *
       * Admin field = dag_no
       * Manual field = dag
       */

      if (
        data.dag_no !== null &&
        data.dag_no !== undefined
      ) {

        setValue(
          "dag",
          data.dag_no
        );

      }


      /*
       * ৪. মৌজা
       */

      if (
        data.mouza !== null &&
        data.mouza !== undefined
      ) {

        setValue(
          "mouza",
          data.mouza
        );

      }


      /*
       * ৫. তারিখ
       *
       * Admin record_date →
       * Manual printDate
       */

      if (
        data.record_date !== null &&
        data.record_date !== undefined
      ) {

        setValue(
          "printDate",
          data.record_date
        );

      }


      /*
       * ৬. QR URL
       *
       * Admin-এর "খতিয়ান দেখুন"
       * URL একই ID দিয়ে তৈরি হবে।
       */

      const publicUrl =
        getPublicRecordUrl(
          data.id
        );


      setValue(
        "qrUrl",
        publicUrl
      );


      /*
       * সব অটো ফিল হওয়ার পর
       * preview update
       */

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


  /*
   * =========================================================
   * INPUT EVENTS
   * =========================================================
   */

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


  /*
   * QR input
   */

  const qrUrl =
    document.getElementById(
      "qrUrl"
    );


  if (qrUrl) {

    qrUrl.addEventListener(
      "input",
      updateQR
    );

  }


  /*
   * =========================================================
   * UPDATE BUTTON
   * =========================================================
   */

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


  /*
   * =========================================================
   * PRINT / PDF
   * =========================================================
   */

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


  /*
   * =========================================================
   * RESET
   * =========================================================
   */

  const resetBtn =
    document.getElementById(
      "resetBtn"
    );


  if (resetBtn) {

    resetBtn.addEventListener(
      "click",
      function () {

        fieldIds.forEach(
          function (id) {

            const input =
              document.getElementById(id);


            if (input) {

              input.value =
                "";

            }

          }
        );


        if (qrUrl) {

          qrUrl.value =
            "";

        }


        updatePreview();

      }
    );

  }


  /*
   * =========================================================
   * INITIAL LOAD
   * =========================================================
   *
   * প্রথমে existing/manual values render হবে,
   * তারপর Admin record load হবে।
   */

  updatePreview();


  loadAdminRecord();


})();
