```javascript
(function () {

  "use strict";


  /* =====================================================
     BASIC HELPERS
  ===================================================== */

  function get(id) {
    return document.getElementById(id);
  }


  function getValue(id) {
    const el = get(id);

    if (!el) {
      return "";
    }

    return String(el.value || "");
  }


  function setValue(id, value) {
    const el = get(id);

    if (!el) {
      return;
    }

    el.value =
      value === null ||
      value === undefined
        ? ""
        : String(value);
  }


  /* =====================================================
     PREVIEW
  ===================================================== */

  function updatePreview() {

    document
      .querySelectorAll("[data-out]")
      .forEach(function (el) {

        const field =
          el.getAttribute("data-out");

        if (!field) {
          return;
        }

        el.textContent =
          getValue(field);

      });


    updateQR();
  }


  /* =====================================================
     QR
  ===================================================== */

  function updateQR() {

    const box =
      get("qrcode");

    const input =
      get("qrUrl");

    if (!box || !input) {
      return;
    }

    box.innerHTML = "";

    const url =
      String(input.value || "").trim();

    if (
      !url ||
      typeof QRCode === "undefined"
    ) {

      if (!url) {
        box.style.display = "none";
      }

      return;
    }


    box.style.display = "block";


    try {

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

    } catch (error) {

      console.error(
        "QR Code error:",
        error
      );

    }

  }


  /* =====================================================
     GET RECORD ID

     Admin থেকে PDF ক্লিক করার সময় সাধারণত
     ?id=123 আসে।

     নিরাপত্তার জন্য আরও কয়েকটি common parameter
     গ্রহণ করা হচ্ছে।
  ===================================================== */

  function getRecordId() {

    const params =
      new URLSearchParams(
        window.location.search
      );


    const possibleKeys = [
      "id",
      "record_id",
      "khatian_id"
    ];


    for (
      let i = 0;
      i < possibleKeys.length;
      i++
    ) {

      const value =
        params.get(
          possibleKeys[i]
        );

      if (
        value !== null &&
        value !== ""
      ) {

        return value.trim();

      }

    }


    return null;
  }


  /* =====================================================
     LOAD CONFIG.JS
  ===================================================== */

  function loadScript(src) {

    return new Promise(
      function (resolve, reject) {

        const script =
          document.createElement("script");

        script.src = src;

        script.onload =
          function () {
            resolve();
          };

        script.onerror =
          function () {
            reject(
              new Error(
                "Script load failed: " + src
              )
            );
          };

        document.head.appendChild(
          script
        );

      }
    );

  }


  /* =====================================================
     ENSURE SUPABASE + CONFIG
  ===================================================== */

  async function prepareSupabase() {

    /*
     * Supabase library আগে থেকে না থাকলে
     * নিজে লোড করবে।
     */

    if (!window.supabase) {

      await loadScript(
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
      );

    }


    /*
     * config.js আগে থেকে না থাকলে
     * root folder থেকে আনার চেষ্টা।
     *
     * Structure:
     *
     * /
     * ├── config.js
     * └── khatian/
     *     ├── index.html
     *     ├── style.css
     *     └── app.js
     *
     * তাই ../config.js
     */

    if (
      !window.APP_CONFIG ||
      !window.APP_CONFIG.SUPABASE_URL ||
      !window.APP_CONFIG.SUPABASE_ANON_KEY
    ) {

      try {

        await loadScript(
          "../config.js"
        );

      } catch (error) {

        /*
         * Fallback:
         * config.js একই folder-এ থাকলে।
         */

        await loadScript(
          "./config.js"
        );

      }

    }


    const cfg =
      window.APP_CONFIG || {};


    if (
      !cfg.SUPABASE_URL ||
      !cfg.SUPABASE_ANON_KEY
    ) {

      throw new Error(
        "Supabase configuration পাওয়া যায়নি।"
      );

    }


    if (!window.supabase) {

      throw new Error(
        "Supabase library পাওয়া যায়নি।"
      );

    }


    return window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_ANON_KEY
    );

  }


  /* =====================================================
     AUTO FILL
  ===================================================== */

  async function autoFillFromAdminPDF() {

    const recordId =
      getRecordId();


    /*
     * URL-এ ID না থাকলে এটা
     * normal manual mode থাকবে।
     */

    if (!recordId) {

      updatePreview();

      return;

    }


    try {

      const client =
        await prepareSupabase();


      const dbId =
        /^\d+$/.test(recordId)
          ? Number(recordId)
          : recordId;


      /*
       * land_records থেকে ID অনুযায়ী
       * মূল খতিয়ানের তথ্য আনা।
       */

      const result =
        await client
          .from("land_records")
          .select(
            [
              "id",
              "khatian",
              "owner",
              "dag_no",
              "survey",
              "mouza",
              "upazila",
              "district",
              "division",
              "record_date"
            ].join(",")
          )
          .eq(
            "id",
            dbId
          )
          .maybeSingle();


      if (result.error) {

        console.error(
          "AutoFill Supabase error:",
          result.error
        );

        return;

      }


      if (!result.data) {

        console.warn(
          "খতিয়ানের রেকর্ড পাওয়া যায়নি। ID:",
          recordId
        );

        return;

      }


      const record =
        result.data;


      /* =================================================
         DATABASE → EDITOR
      ================================================= */


      /*
       * খতিয়ান
       */

      setValue(
        "titleText",
        record.khatian
          ? "আর এস (জোনাল) খতিয়ান নং- " +
            record.khatian
          : ""
      );


      /*
       * মালিক
       */

      setValue(
        "owner",
        record.owner
      );


      /*
       * দাগ
       */

      setValue(
        "dag",
        record.dag_no
      );


      /*
       * সার্ভে
       * তোমার বর্তমান HTML-এ আলাদা survey field নেই,
       * তাই revisionNo-তে রাখা হচ্ছে।
       */

      setValue(
        "revisionNo",
        record.survey
      );


      /*
       * মৌজা
       */

      setValue(
        "mouza",
        record.mouza
      );


      /*
       * উপজেলা
       */

      setValue(
        "upazila",
        record.upazila
      );


      /*
       * জেলা
       */

      setValue(
        "district",
        record.district
      );


      /*
       * বিভাগ
       */

      setValue(
        "division",
        record.division
      );


      /*
       * তারিখ
       */

      setValue(
        "printDate",
        record.record_date
      );


      /*
       * পৃষ্ঠা তথ্য
       * যদি আগে খালি থাকে।
       */

      if (
        !getValue("pageText").trim()
      ) {

        setValue(
          "pageText",
          "পৃষ্ঠা নং: ১ এর ১"
        );

      }


      /*
       * মুদ্রণ
       * যদি আগে খালি থাকে।
       */

      if (
        !getValue("printing").trim()
      ) {

        setValue(
          "printing",
          "সেটেলমেন্ট প্রেস, ঢাকা"
        );

      }


      /*
       * QR URL
       *
       * Admin-এর "খতিয়ানের PDF" page-এর
       * current URL-টাই QR-এ যাবে।
       */

      setValue(
        "qrUrl",
        window.location.href
      );


      /*
       * সব ডাটা preview-তে পাঠানো।
       */

      updatePreview();


      console.log(
        "Khatian AutoFill successful:",
        record
      );

    }


    catch (error) {

      console.error(
        "Khatian AutoFill failed:",
        error
      );

    }

  }


  /* =====================================================
     LIVE PREVIEW
  ===================================================== */

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
    "printDate",
    "qrUrl"

  ];


  fieldIds.forEach(
    function (id) {

      const input =
        get(id);

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
     BUTTONS
  ===================================================== */


  const updateBtn =
    get("updateBtn");


  if (updateBtn) {

    updateBtn.addEventListener(
      "click",
      updatePreview
    );

  }


  const printBtn =
    get("printBtn");


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


  const resetBtn =
    get("resetBtn");


  if (resetBtn) {

    resetBtn.addEventListener(
      "click",
      function () {

        fieldIds.forEach(
          function (id) {

            const input =
              get(id);

            if (input) {
              input.value = "";
            }

          }
        );


        /*
         * আপনার আগের default values
         */

        setValue(
          "pageText",
          "পৃষ্ঠা নং: ১ এর ১"
        );


        setValue(
          "printing",
          "সেটেলমেন্ট প্রেস, ঢাকা"
        );


        updatePreview();

      }
    );

  }


  /* =====================================================
     INITIAL
  ===================================================== */

  updatePreview();


  /*
   * Admin → খতিয়ানের PDF → AutoFill
   */

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      function () {

        autoFillFromAdminPDF();

      },
      { once: true }
    );

  } else {

    autoFillFromAdminPDF();

  }


})();
```
