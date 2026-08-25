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
     BASIC HELPERS
  ===================================================== */

  function getValue(id) {

    const input =
      document.getElementById(id);

    if (!input) {
      return "";
    }

    return String(
      input.value || ""
    );

  }


  function setValue(id, value) {

    const input =
      document.getElementById(id);

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
     PREVIEW OUTPUT
  ===================================================== */

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


  /* =====================================================
     QR
  ===================================================== */

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
        "QR Code Error:",
        error
      );

    }

  }


  /* =====================================================
     PREVIEW
  ===================================================== */

  function updatePreview() {

    fieldIds.forEach(
      setOutputs
    );

    updateQR();

  }


  /* =====================================================
     LIVE INPUT
  ===================================================== */

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
     QR INPUT
  ===================================================== */

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


  /* =====================================================
     UPDATE BUTTON
  ===================================================== */

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
     PRINT BUTTON
  ===================================================== */

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
     RESET BUTTON
  ===================================================== */

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


  /* =====================================================
     GET ID FROM URL
  ===================================================== */

  function getRecordId() {

    const params =
      new URLSearchParams(
        window.location.search
      );


    /*
      Admin → খতিয়ানের PDF
      সাধারণত ?id=123

      fallback হিসেবে
      record_id / khatian_id-ও নেওয়া হবে।
    */

    return (
      params.get("id") ||
      params.get("record_id") ||
      params.get("khatian_id")
    );

  }


  /* =====================================================
     STATUS BOX
  ===================================================== */

  function showAutoFillStatus(
    message,
    success
  ) {

    let status =
      document.getElementById(
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


      const head =
        document.querySelector(
          ".controls-head"
        );


      if (head) {

        head.appendChild(
          status
        );

      }

    }


    if (!status) {
      return;
    }


    status.textContent =
      message;


    status.style.color =
      success
        ? "#087f3d"
        : "#b3261e";

  }


  /* =====================================================
     SUPABASE AUTO-FILL
  ===================================================== */

  async function autoFill() {

    const recordId =
      getRecordId();


    /*
      ID না থাকলে manual editor
      আগের মতোই চলবে।
    */

    if (!recordId) {
      return;
    }


    /*
      Config check
    */

    const cfg =
      window.APP_CONFIG || {};


    if (
      !cfg.SUPABASE_URL ||
      !cfg.SUPABASE_ANON_KEY
    ) {

      showAutoFillStatus(
        "Supabase configuration পাওয়া যায়নি।",
        false
      );

      console.error(
        "APP_CONFIG missing:",
        cfg
      );

      return;

    }


    /*
      Supabase library check
    */

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== "function"
    ) {

      showAutoFillStatus(
        "Supabase library লোড হয়নি।",
        false
      );

      console.error(
        "Supabase library missing."
      );

      return;

    }


    showAutoFillStatus(
      "খতিয়ানের তথ্য লোড হচ্ছে...",
      true
    );


    try {

      const client =
        window.supabase.createClient(
          cfg.SUPABASE_URL,
          cfg.SUPABASE_ANON_KEY
        );


      const dbId =
        /^\d+$/.test(
          String(recordId)
        )
          ? Number(recordId)
          : recordId;


      /*
        land_records থেকে ID অনুযায়ী record
      */

      const {
        data,
        error
      } =
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


      /* -----------------------------------------------
         DATABASE ERROR
      ------------------------------------------------ */

      if (error) {

        console.error(
          "Supabase AutoFill Error:",
          error
        );


        showAutoFillStatus(
          "খতিয়ানের তথ্য লোড করা যায়নি।",
          false
        );


        return;

      }


      /* -----------------------------------------------
         RECORD NOT FOUND
      ------------------------------------------------ */

      if (!data) {

        console.warn(
          "No land record found for ID:",
          dbId
        );


        showAutoFillStatus(
          "এই ID-এর কোনো খতিয়ান পাওয়া যায়নি: " +
          recordId,
          false
        );


        return;

      }


      /*
        ================================================
        DATABASE → EXISTING FORM
        ================================================
      */


      /* খতিয়ান */

      setValue(
        "titleText",
        data.khatian
          ? "আর এস (জোনাল) খতিয়ান নং- " +
            data.khatian
          : ""
      );


      /* মালিক */

      setValue(
        "owner",
        data.owner
      );


      /* দাগ */

      setValue(
        "dag",
        data.dag_no
      );


      /*
       * Survey
       *
       * তোমার বর্তমান form-এ survey নামে field নেই।
       * তাই existing "রেঃ সা. নং" field-এ রাখা হচ্ছে।
       */

      setValue(
        "revisionNo",
        data.survey
      );


      /* মৌজা */

      setValue(
        "mouza",
        data.mouza
      );


      /* উপজেলা */

      setValue(
        "upazila",
        data.upazila
      );


      /* জেলা */

      setValue(
        "district",
        data.district
      );


      /* বিভাগ */

      setValue(
        "division",
        data.division
      );


      /* তারিখ */

      setValue(
        "printDate",
        data.record_date
      );


      /*
       * QR URL
       *
       * বর্তমান PDF editor page-এর URL
       * automatically QR-এর input-এ বসবে।
       */

      setValue(
        "qrUrl",
        window.location.href
      );


      /*
       * Preview update
       */

      updatePreview();


      showAutoFillStatus(
        "✓ খতিয়ানের তথ্য অটোফিল হয়েছে। ID: " +
        recordId,
        true
      );


      console.log(
        "Khatian AutoFill:",
        data
      );

    }


    catch (error) {

      console.error(
        "AutoFill Exception:",
        error
      );


      showAutoFillStatus(
        "অটোফিল করতে সমস্যা হয়েছে।",
        false
      );

    }

  }


  /* =====================================================
     INITIAL PREVIEW
  ===================================================== */

  updatePreview();


  /* =====================================================
     START AUTO-FILL
  ===================================================== */

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
