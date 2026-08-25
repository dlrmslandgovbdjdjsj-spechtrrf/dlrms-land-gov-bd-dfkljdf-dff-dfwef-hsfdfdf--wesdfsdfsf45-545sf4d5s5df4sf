(function () {
  "use strict";

  const cfg = window.APP_CONFIG || {};

  const valid =
    cfg.SUPABASE_URL &&
    !cfg.SUPABASE_URL.includes("PASTE_") &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_ANON_KEY.includes("PASTE_");

  const statusEl = document.getElementById("load-status");

  function setStatus(text, ok) {
    if (!statusEl) return;

    statusEl.textContent = text;
    statusEl.style.color = ok ? "#087a3d" : "#a40000";
  }

  if (!valid || !window.supabase) {
    setStatus(
      "Supabase configuration পাওয়া যায়নি।",
      false
    );
    return;
  }

  const client = window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY
  );

  /* =====================================================
     URL ID
  ===================================================== */

  const params = new URLSearchParams(
    window.location.search
  );

  const idParam = params.get("id");

  if (!idParam || !/^\d+$/.test(idParam)) {
    setStatus(
      "খতিয়ানের ID পাওয়া যায়নি।",
      false
    );
    return;
  }

  const recordId = Number(idParam);


  /* =====================================================
     INPUT HELPERS
  ===================================================== */

  function getInput(id) {
    return document.getElementById(id);
  }

  function getValue(id) {
    const el = getInput(id);
    return el ? el.value : "";
  }

  function setValue(id, value) {
    const el = getInput(id);
    if (!el) return;

    el.value = value == null ? "" : String(value);
  }


  /* =====================================================
     SVG TEXT HELPERS
  ===================================================== */

  function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;

    el.textContent =
      value == null ? "" : String(value);
  }


  /* =====================================================
     LIVE PREVIEW
  ===================================================== */

  function updatePreview() {

    setText(
      "out-title",
      getValue("titleText")
    );

    setText(
      "out-page",
      getValue("pageText")
    );


    setText(
      "out-division",
      getValue("division")
    );

    setText(
      "out-district",
      getValue("district")
    );

    setText(
      "out-upazila",
      getValue("upazila")
    );

    setText(
      "out-mouza",
      getValue("mouza")
    );

    setText(
      "out-jl",
      getValue("jlNo")
    );

    setText(
      "out-revision",
      getValue("revisionNo")
    );


    setText(
      "out-owner",
      getValue("owner")
    );

    setText(
      "out-share",
      getValue("share")
    );

    setText(
      "out-revenue",
      getValue("revenue")
    );

    setText(
      "out-dag",
      getValue("dag")
    );

    setText(
      "out-agri",
      getValue("agri")
    );

    setText(
      "out-nonagri",
      getValue("nonAgri")
    );

    setText(
      "out-dag-acre",
      getValue("dagTotalAcre")
    );

    setText(
      "out-dag-percent",
      getValue("dagTotalPercent")
    );

    setText(
      "out-khatian-share",
      getValue("khatianShare")
    );

    setText(
      "out-share-acre",
      getValue("shareLandAcre")
    );

    setText(
      "out-share-percent",
      getValue("shareLandPercent")
    );

    setText(
      "out-remarks",
      getValue("remarks")
    );

    setText(
      "out-total-share",
      getValue("share")
    );

    setText(
      "out-total-land",
      getValue("totalLand")
    );


    const printing = getValue("printing");
    const printDate = getValue("printDate");

    setText(
      "out-printing",
      "মুদ্রণঃ " +
      printing +
      "   তারিখঃ " +
      printDate
    );


    updateQR();
  }


  /* =====================================================
     PUBLIC KHATIAN URL
  ===================================================== */

  function getPublicRecordUrl(id) {

    return (
      window.location.origin +
      "/index.html?id=" +
      encodeURIComponent(id)
    );
  }


  /* =====================================================
     QR CODE
  ===================================================== */

  function updateQR() {

    const holder =
      document.getElementById("qr-holder");

    if (!holder) return;

    holder.innerHTML = "";

    const url =
      getValue("qrUrl").trim();

    if (!url || !window.QRCode) {
      return;
    }

    new QRCode(holder, {
      text: url,
      width: 82,
      height: 82,
      correctLevel: QRCode.CorrectLevel.M
    });
  }


  /* =====================================================
     LOAD RECORD FROM SUPABASE
  ===================================================== */

  async function loadRecord() {

    setStatus(
      "খতিয়ানের তথ্য লোড হচ্ছে...",
      true
    );

    const {
      data,
      error
    } = await client
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
      .eq("id", recordId)
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


    /* =================================================
       AUTO FILL
    ================================================= */

    setValue(
      "titleText",
      data.khatian
        ? "আর এস (জোনাল) খতিয়ান নং- " +
          data.khatian
        : ""
    );


    setValue(
      "division",
      data.division
    );

    setValue(
      "district",
      data.district
    );

    setValue(
      "upazila",
      data.upazila
    );

    setValue(
      "mouza",
      data.mouza
    );

    setValue(
      "owner",
      data.owner
    );

    setValue(
      "dag",
      data.dag_no
    );

    setValue(
      "printDate",
      data.record_date
    );


    /* =================================================
       AUTOMATIC QR URL
    ================================================= */

    setValue(
      "qrUrl",
      getPublicRecordUrl(data.id)
    );


    setStatus(
      "খতিয়ানের তথ্য সফলভাবে লোড হয়েছে।",
      true
    );


    updatePreview();
  }


  /* =====================================================
     LIVE INPUT UPDATE
  ===================================================== */

  document
    .querySelectorAll(
      ".controls input, .controls textarea"
    )
    .forEach(function (el) {

      el.addEventListener(
        "input",
        updatePreview
      );

    });


  /* =====================================================
     PREVIEW BUTTON
  ===================================================== */

  const updateBtn =
    document.getElementById("updateBtn");

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
    document.getElementById("printBtn");

  if (printBtn) {

    printBtn.addEventListener(
      "click",
      function () {

        updatePreview();

        setTimeout(function () {
          window.print();
        }, 100);

      }
    );

  }


  /* =====================================================
     RESET MANUAL FIELDS
  ===================================================== */

  const resetBtn =
    document.getElementById("resetBtn");

  if (resetBtn) {

    resetBtn.addEventListener(
      "click",
      function () {

        const manualFields = [
          "jlNo",
          "revisionNo",
          "share",
          "revenue",
          "agri",
          "nonAgri",
          "dagTotalAcre",
          "dagTotalPercent",
          "khatianShare",
          "shareLandAcre",
          "shareLandPercent",
          "totalLand",
          "remarks"
        ];


        manualFields.forEach(
          function (id) {
            setValue(id, "");
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
