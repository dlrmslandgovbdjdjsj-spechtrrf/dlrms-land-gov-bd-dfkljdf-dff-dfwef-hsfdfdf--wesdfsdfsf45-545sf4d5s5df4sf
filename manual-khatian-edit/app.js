```javascript
(function () {

  "use strict";


  /* =====================================================
     FIELD LIST
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
    "printDate"
  ];


  /* =====================================================
     BASIC
  ===================================================== */

  function getElement(id) {

    return document.getElementById(id);

  }


  function getValue(id) {

    const input =
      getElement(id);

    if (!input) {
      return "";
    }

    return String(
      input.value || ""
    );

  }


  function setValue(id, value) {

    const input =
      getElement(id);

    if (!input) {
      return;
    }

    input.value =
      value === null ||
      value === undefined
        ? ""
        : String(value);

  }


  /* =====================================================
     PREVIEW
  ===================================================== */

  function setOutputs(id) {

    const input =
      getElement(id);

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


  function updatePreview() {

    fieldIds.forEach(
      setOutputs
    );

    updateQR();

  }


  /* =====================================================
     QR
  ===================================================== */

  function updateQR() {

    const box =
      getElement("qrcode");

    const input =
      getElement("qrUrl");

    if (!box || !input) {
      return;
    }


    box.innerHTML =
      "";


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

    } catch (error) {

      console.error(
        "QR Code error:",
        error
      );

    }

  }


  /* =====================================================
     INPUT EVENTS
  ===================================================== */

  fieldIds.forEach(
    function (id) {

      const input =
        getElement(id);


      if (!input) {
        return;
      }


      input.addEventListener(
        "input",
        updatePreview
      );


      input.addEventListener(
        "change",
        updatePreview
      );

    }
  );


  const qrUrl =
    getElement("qrUrl");


  if (qrUrl) {

    qrUrl.addEventListener(
      "input",
      updateQR
    );

  }


  /* =====================================================
     UPDATE BUTTON
  ===================================================== */

  const updateBtn =
    getElement("updateBtn");


  if (updateBtn) {

    updateBtn.addEventListener(
      "click",
      function () {

        updatePreview();

      }
    );

  }


  /* =====================================================
     PRINT BUTTON
  ===================================================== */

  const printBtn =
    getElement("printBtn");


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
     RESET BUTTON
  ===================================================== */

  const resetBtn =
    getElement("resetBtn");


  if (resetBtn) {

    resetBtn.addEventListener(
      "click",
      function () {

        fieldIds.forEach(
          function (id) {

            const input =
              getElement(id);


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


  /* =====================================================
     GET ID FROM ADMIN PDF URL
  ===================================================== */

  function getRecordId() {

    const params =
      new URLSearchParams(
        window.location.search
      );


    /*
     * Admin থেকে যে ID পাঠাবে
     * প্রথমে id নেওয়া হবে।
     *
     * fallback:
     * record_id
     * khatian_id
     */

    return (
      params.get("id") ||
      params.get("record_id") ||
      params.get("khatian_id")
    );

  }


  /* =====================================================
     STATUS
  ===================================================== */

  function setAutoFillStatus(
    text,
    success
  ) {

    let status =
      getElement(
        "auto-fill-status"
      );


    if (!status) {

      status =
        document.createElement(
          "div"
        );

      status.id =
        "auto-fill-status";


      status.style.marginTop =
        "8px";


      status.style.fontSize =
        "13px";


      status.style.fontWeight =
        "700";


      const header =
        document.querySelector(
          ".controls-head"
        );


      if (header) {

        header.appendChild(
          status
        );

      }

    }


    if (!status) {
      return;
    }


    status.textContent =
      text;


    status.style.color =
      success
        ? "#087f3d"
        : "#b3261e";

  }


  /* =====================================================
     AUTO FILL FROM SUPABASE
  ===================================================== */

  async function autoFill() {

    const recordId =
      getRecordId();


    /*
     * ID না থাকলে manual mode।
     * এতে local/manual editor আগের মতোই থাকবে।
     */

    if (!recordId) {

      updatePreview();

      return;

    }


    /*
     * config.js থেকে config।
     * index.html-এ config.js already loaded আছে।
     */

    const cfg =
      window.APP_CONFIG || {};


    if (
      !cfg.SUPABASE_URL ||
      !cfg.SUPABASE_ANON_KEY
    ) {

      setAutoFillStatus(
        "Supabase configuration পাওয়া যায়নি।",
        false
      );


      console.error(
        "APP_CONFIG পাওয়া যায়নি:",
        cfg
      );


      return;

    }


    /*
     * Supabase library check
     */

    if (
      !window.supabase ||
      typeof window.supabase.createClient !==
        "function"
    ) {

      setAutoFillStatus(
        "Supabase library পাওয়া যায়নি।",
        false
      );


      console.error(
        "window.supabase পাওয়া যায়নি।"
      );


      return;

    }


    setAutoFillStatus(
      "খতিয়ানের তথ্য লোড হচ্ছে...",
      true
    );


    try {

      const client =
        window.supabase.createClient(
          cfg.SUPABASE_URL,
          cfg.SUPABASE_ANON_KEY
        );


      /*
       * ID numeric হলে Number হিসেবে query।
       */

      const dbId =
        /^\d+$/.test(
          String(recordId)
        )
          ? Number(recordId)
          : recordId;


      /*
       * মূল land_records table
       */

      const result =
        await client
          .from("land_records")
          .select("*")
          .eq(
            "id",
            dbId
          )
          .maybeSingle();


      /* -----------------------------------------------
         ERROR
      ------------------------------------------------ */

      if (result.error) {

        console.error(
          "Supabase AutoFill error:",
          result.error
        );


        setAutoFillStatus(
          "খতিয়ানের তথ্য লোড করা যায়নি।",
          false
        );


        return;

      }


      /* -----------------------------------------------
         NO RECORD
      ------------------------------------------------ */

      if (!result.data) {

        console.warn(
          "Record পাওয়া যায়নি। ID:",
          dbId
        );


        setAutoFillStatus(
          "এই ID-এর খতিয়ান পাওয়া যায়নি: " +
          recordId,
          false
        );


        return;

      }


      const row =
        result.data;


      /* =================================================
         DATABASE → EXISTING FORM
      ================================================= */


      /*
       * খতিয়ান
       */

      setValue(
        "titleText",
        row.khatian
          ? "আর এস (জোনাল) খতিয়ান নং- " +
            row.khatian
          : ""
      );


      /*
       * মালিক
       */

      setValue(
        "owner",
        row.owner
      );


      /*
       * দাগ
       */

      setValue(
        "dag",
        row.dag_no
      );


      /*
       * সার্ভে
       *
       * তোমার existing HTML-এ আলাদা survey field নেই।
       * তাই revisionNo-তে survey বসছে।
       */

      setValue(
        "revisionNo",
        row.survey
      );


      /*
       * মৌজা
       */

      setValue(
        "mouza",
        row.mouza
      );


      /*
       * উপজেলা
       */

      setValue(
        "upazila",
        row.upazila
      );


      /*
       * জেলা
       */

      setValue(
        "district",
        row.district
      );


      /*
       * বিভাগ
       */

      setValue(
        "division",
        row.division
      );


      /*
       * তারিখ
       */

      setValue(
        "printDate",
        row.record_date
      );


      /*
       * QR URL
       */

      setValue(
        "qrUrl",
        window.location.href
      );


      /*
       * Preview
       */

      updatePreview();


      setAutoFillStatus(
        "✓ খতিয়ানের তথ্য অটোফিল হয়েছে। ID: " +
        recordId,
        true
      );


      console.log(
        "Khatian AutoFill successful:",
        row
      );

    }


    catch (error) {

      console.error(
        "AutoFill exception:",
        error
      );


      setAutoFillStatus(
        "অটোফিল করতে সমস্যা হয়েছে।",
        false
      );

    }

  }


  /* =====================================================
     INITIAL
  ===================================================== */

  updatePreview();


  /*
   * Page সম্পূর্ণ load হওয়ার পর
   * AutoFill চালু।
   */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      function () {

        autoFill();

      },
      {
        once: true
      }
    );

  } else {

    autoFill();

  }


})();
```
