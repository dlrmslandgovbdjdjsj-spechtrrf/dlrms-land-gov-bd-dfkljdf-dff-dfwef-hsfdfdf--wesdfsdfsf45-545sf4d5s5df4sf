(function () {
  "use strict";

  const cfg = window.APP_CONFIG || {};

  const valid =
    cfg.SUPABASE_URL &&
    !cfg.SUPABASE_URL.includes("PASTE_") &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_ANON_KEY.includes("PASTE_");

  const statusEl =
    document.getElementById("load-status");

  const formFields = [
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


  /* =====================================================
     SUPABASE CHECK
  ===================================================== */

  if (!valid || !window.supabase) {

    setStatus(
      "Supabase configuration পাওয়া যায়নি।",
      false
    );

    return;
  }


  const client =
    window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_ANON_KEY
    );


  /* =====================================================
     URL ID
  ===================================================== */

  const params =
    new URLSearchParams(
      window.location.search
    );

  const idParam =
    params.get("id");


  if (
    !idParam ||
    !/^\d+$/.test(idParam)
  ) {

    setStatus(
      "এই খতিয়ানের কোনো ID পাওয়া যায়নি।",
      false
    );

    return;
  }


  const recordId =
    Number(idParam);


  /* =====================================================
     STATUS
  ===================================================== */

  function setStatus(text, success) {

    if (!statusEl) {
      return;
    }

    statusEl.textContent =
      text;

    statusEl.style.color =
      success
        ? "#087a3d"
        : "#a40000";

  }


  /* =====================================================
     GET INPUT
  ===================================================== */

  function getInput(id) {
    return document.getElementById(id);
  }


  /* =====================================================
     SET INPUT
  ===================================================== */

  function setInput(id, value) {

    const input =
      getInput(id);

    if (!input) {
      return;
    }

    input.value =
      value ?? "";

  }


  /* =====================================================
     PREVIEW UPDATE
  ===================================================== */

  function updatePreview() {

    formFields.forEach(
      function (field) {

        const input =
          getInput(field);

        if (!input) {
          return;
        }

        document
          .querySelectorAll(
            '[data-out="' +
            field +
            '"]'
          )
          .forEach(
            function (element) {

              element.textContent =
                input.value;

            }
          );

      }
    );


    updateQR();

  }


  /* =====================================================
     QR CODE
  ===================================================== */

  function updateQR() {

    const qrContainer =
      document.getElementById(
        "qrcode"
      );

    if (!qrContainer) {
      return;
    }


    qrContainer.innerHTML =
      "";


    const urlInput =
      getInput("qrUrl");


    if (!urlInput) {
      return;
    }


    const url =
      urlInput.value.trim();


    if (
      !url ||
      !window.QRCode
    ) {

      return;

    }


    new QRCode(
      qrContainer,
      {
        text: url,
        width: 105,
        height: 105,
        correctLevel:
          QRCode.CorrectLevel.M
      }
    );

  }


  /* =====================================================
     EXISTING PUBLIC KHATIAN URL
  ===================================================== */

  function getPublicRecordUrl(id) {

    const base =
      window.location.origin +
      window.location.pathname
        .replace(
          "/manual-khatian-edit/index.html",
          "/index.html"
        )
        .replace(
          "/manual-khatian-edit/",
          "/index.html"
        );

    return (
      base +
      "?id=" +
      encodeURIComponent(id)
    );

  }


  /* =====================================================
     LOAD RECORD
  ===================================================== */

  async function loadRecord() {

    setStatus(
      "খতিয়ানের তথ্য লোড হচ্ছে...",
      true
    );


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
          recordId
        )
        .maybeSingle();


    if (error) {

      console.error(
        "Supabase error:",
        error
      );

      setStatus(
        "খতিয়ানের তথ্য লোড করা যাচ্ছে না।",
        false
      );

      return;
    }


    if (!data) {

      setStatus(
        "কোন খতিয়ান পাওয়া যায়নি",
        false
      );

      return;
    }


    /*
      Existing land record data
    */

    setInput(
      "titleText",
      data.khatian
        ? "আর এস (জোনাল) খতিয়ান নং- " +
          data.khatian
        : ""
    );


    setInput(
      "division",
      data.division
    );


    setInput(
      "district",
      data.district
    );


    setInput(
      "upazila",
      data.upazila
    );


    setInput(
      "mouza",
      data.mouza
    );


    setInput(
      "owner",
      data.owner
    );


    setInput(
      "dag",
      data.dag_no
    );


    setInput(
      "printDate",
      data.record_date
    );


    /*
      Existing public record URL
      automatically goes into QR URL.
    */

    const publicUrl =
      getPublicRecordUrl(
        data.id
      );


    setInput(
      "qrUrl",
      publicUrl
    );


    /*
      Other manual fields intentionally
      remain editable/empty.
    */

    setStatus(
      "খতিয়ানের তথ্য সফলভাবে লোড হয়েছে।",
      true
    );


    updatePreview();

  }


  /* =====================================================
     INPUT LIVE UPDATE
  ===================================================== */

  formFields.forEach(
    function (field) {

      const input =
        getInput(field);

      if (!input) {
        return;
      }

      input.addEventListener(
        "input",
        function () {

          updatePreview();

        }
      );

    }
  );


  /* =====================================================
     UPDATE BUTTON
  ===================================================== */

  const updateButton =
    document.getElementById(
      "updateBtn"
    );


  if (updateButton) {

    updateButton.addEventListener(
      "click",
      function () {

        updatePreview();

      }
    );

  }


  /* =====================================================
     PRINT BUTTON
  ===================================================== */

  const printButton =
    document.getElementById(
      "printBtn"
    );


  if (printButton) {

    printButton.addEventListener(
      "click",
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
     RESET MANUAL FIELDS
  ===================================================== */

  const resetButton =
    document.getElementById(
      "resetBtn"
    );


  if (resetButton) {

    resetButton.addEventListener(
      "click",
      function () {

        const confirmed =
          confirm(
            "ম্যানুয়ালভাবে দেওয়া তথ্যগুলো খালি করতে চান?"
          );


        if (!confirmed) {
          return;
        }


        const keepFields = [
          "titleText",
          "pageText",
          "division",
          "district",
          "upazila",
          "mouza",
          "owner",
          "dag",
          "printDate",
          "qrUrl",
          "printing"
        ];


        formFields.forEach(
          function (field) {

            if (
              keepFields.includes(field)
            ) {
              return;
            }


            const input =
              getInput(field);

            if (input) {
              input.value = "";
            }

          }
        );


        updatePreview();

      }
    );

  }


  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  loadRecord();

})();
