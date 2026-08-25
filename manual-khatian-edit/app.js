```javascript
(function () {

  "use strict";

  /* =====================================================
     HELPERS
  ===================================================== */

  function get(id) {
    return document.getElementById(id);
  }


  function value(id) {
    const el = get(id);
    return el ? String(el.value || "") : "";
  }


  function setValue(id, val) {
    const el = get(id);

    if (!el) {
      return;
    }

    el.value =
      val === null || val === undefined
        ? ""
        : String(val);
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
          value(field);

      });


    updateQR();
  }


  /* =====================================================
     QR
  ===================================================== */

  function updateQR() {

    const box = get("qrcode");
    const input = get("qrUrl");

    if (!box || !input) {
      return;
    }

    box.innerHTML = "";

    const url =
      input.value.trim();

    if (!url) {
      box.style.display = "none";
      return;
    }

    box.style.display = "block";

    if (
      typeof QRCode === "undefined"
    ) {
      return;
    }

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

    } catch (err) {

      console.error(
        "QR Error:",
        err
      );

    }

  }


  /* =====================================================
     URL ID
  ===================================================== */

  function getId() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    return (
      params.get("id") ||
      params.get("record_id") ||
      params.get("khatian_id")
    );

  }


  /* =====================================================
     FIELD EVENTS
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


  fieldIds.forEach(function (id) {

    const el = get(id);

    if (!el) {
      return;
    }

    el.addEventListener(
      "input",
      updatePreview
    );

    el.addEventListener(
      "change",
      updatePreview
    );

  });


  /* =====================================================
     BUTTONS
  ===================================================== */

  const updateBtn =
    get("updateBtn");

  if (updateBtn) {

    updateBtn.addEventListener(
      "click",
      function () {

        updatePreview();

      }
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

            setValue(
              id,
              ""
            );

          }
        );


        /*
         * পুরোনো default values
         */

        setValue(
          "pageText",
          "পৃষ্ঠা নং: ১ এর ১"
        );


        setValue(
          "division",
          "চট্টগ্রাম"
        );


        setValue(
          "district",
          "নোয়াখালী"
        );


        setValue(
          "upazila",
          "বেগমগঞ্জ"
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
     STATUS
  ===================================================== */

  function showStatus(text) {

    let box =
      get("auto-fill-status");

    if (!box) {

      box =
        document.createElement(
          "div"
        );

      box.id =
        "auto-fill-status";

      box.style.marginTop =
        "8px";

      box.style.fontSize =
        "13px";

      box.style.fontWeight =
        "700";

      const head =
        document.querySelector(
          ".controls-head"
        );

      if (head) {
        head.appendChild(box);
      }

    }

    if (box) {
      box.textContent = text;
    }

  }


  /* =====================================================
     LOAD CONFIG
  ===================================================== */

  function loadScript(src) {

    return new Promise(
      function (resolve, reject) {

        const script =
          document.createElement(
            "script"
          );

        script.src =
          src;

        script.onload =
          resolve;

        script.onerror =
          function () {

            reject(
              new Error(
                "Cannot load " + src
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
     SUPABASE
  ===================================================== */

  async function getSupabase() {

    /*
     * Supabase library
     */

    if (!window.supabase) {

      await loadScript(
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
      );

    }


    /*
     * config.js
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
        "Supabase config পাওয়া যায়নি"
      );

    }


    return window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_ANON_KEY
    );

  }


  /* =====================================================
     AUTO FILL FROM land_records
  ===================================================== */

  async function autoFill() {

    const id =
      getId();

    /*
     * id না থাকলে normal manual mode
     */

    if (!id) {
      return;
    }


    showStatus(
      "খতিয়ানের তথ্য লোড হচ্ছে..."
    );


    try {

      const client =
        await getSupabase();


      const dbId =
        /^\d+$/.test(id)
          ? Number(id)
          : id;


      const result =
        await client
          .from("land_records")
          .select("*")
          .eq("id", dbId)
          .maybeSingle();


      if (result.error) {

        console.error(
          "Supabase:",
          result.error
        );

        showStatus(
          "খতিয়ানের তথ্য লোড করা যায়নি"
        );

        return;

      }


      if (!result.data) {

        showStatus(
          "এই ID-এর খতিয়ান পাওয়া যায়নি: " +
          id
        );

        return;

      }


      const row =
        result.data;


      /* -----------------------------------------------
         Database → Existing Form
      ----------------------------------------------- */


      if (
        row.khatian !== null &&
        row.khatian !== undefined
      ) {

        setValue(
          "titleText",
          "আর এস (জোনাল) খতিয়ান নং- " +
          row.khatian
        );

      }


      setValue(
        "owner",
        row.owner
      );


      setValue(
        "dag",
        row.dag_no
      );


      setValue(
        "revisionNo",
        row.survey
      );


      setValue(
        "mouza",
        row.mouza
      );


      setValue(
        "upazila",
        row.upazila
      );


      setValue(
        "district",
        row.district
      );


      setValue(
        "division",
        row.division
      );


      setValue(
        "printDate",
        row.record_date
      );


      /*
       * QR
       */

      setValue(
        "qrUrl",
        window.location.href
      );


      /*
       * Refresh preview
       */

      updatePreview();


      showStatus(
        "✓ খতিয়ানের তথ্য অটোফিল হয়েছে"
      );


      console.log(
        "Khatian loaded:",
        row
      );

    }

    catch (error) {

      console.error(
        "AutoFill error:",
        error
      );

      showStatus(
        "AutoFill চালু করা যায়নি"
      );

    }

  }


  /* =====================================================
     INITIAL
  ===================================================== */

  updatePreview();


  /*
   * Page সম্পূর্ণ load হওয়ার পরে
   * AutoFill চালু।
   */

  window.addEventListener(
    "load",
    function () {

      autoFill();

    }
  );


})();
```
