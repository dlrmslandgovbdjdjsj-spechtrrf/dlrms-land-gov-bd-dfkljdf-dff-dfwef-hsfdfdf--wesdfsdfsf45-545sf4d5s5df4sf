(function () {
  "use strict";


  // =========================================================
  // HTML INPUT FIELD IDs
  // =========================================================

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


  // =========================================================
  // INPUT → PREVIEW
  // =========================================================

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


  // =========================================================
  // QR CODE UPDATE
  // =========================================================

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


    // URL না থাকলে QR লুকাবে
    if (!url) {

      box.style.display =
        "none";

      return;
    }


    box.style.display =
      "block";


    // QRCode library পাওয়া না গেলে
    // আর কিছু করবে না
    if (typeof QRCode === "undefined") {
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


  // =========================================================
  // OLD SITE / ADMIN থেকে IMPORT DATA
  //
  // Query Parameters:
  //
  // ?id=123
  // &khatian=...
  // &owner=...
  // &dag=...
  // &date=...
  // &url=...
  //
  // Mapping:
  //
  // khatian → titleText
  // owner   → owner
  // dag     → dag
  // date    → printDate
  // url     → qrUrl
  // =========================================================

  function getImportedData() {

    const params =
      new URLSearchParams(
        window.location.search
      );


    // =======================================================
    // প্রথম পাওয়া valid parameter return করবে
    // =======================================================

    function firstValue(keys) {

      for (
        const key of keys
      ) {

        const value =
          params.get(key);


        if (
          value !== null &&
          value !== ""
        ) {

          return value;

        }

      }


      return "";

    }


    // =======================================================
    // IMPORT DATA
    // =======================================================

    return {

      // -----------------------------------------------------
      // খতিয়ান → শিরোনাম
      // -----------------------------------------------------

      titleText:
        firstValue([
          "khatian",
          "title",
          "titleText"
        ]),


      // -----------------------------------------------------
      // মালিক → মালিক
      // -----------------------------------------------------

      owner:
        firstValue([
          "owner",
          "malik",
          "ownerText"
        ]),


      // -----------------------------------------------------
      // দাগ নং → দাগ
      // -----------------------------------------------------

      dag:
        firstValue([
          "dag",
          "dagNo",
          "dag_no",
          "dagNumber"
        ]),


      // -----------------------------------------------------
      // তারিখ → তারিখ
      // -----------------------------------------------------

      printDate:
        firstValue([
          "date",
          "printDate",
          "tarikh",
          "record_date"
        ]),


      // -----------------------------------------------------
      // URL → QR-এর URL
      // -----------------------------------------------------

      qrUrl:
        firstValue([
          "url",
          "qrUrl",
          "qr_url"
        ])

    };

  }


  // =========================================================
  // IMPORT DATA INTO INPUT FIELDS
  // =========================================================

  function importFromOldSite() {

    const data =
      getImportedData();


    let imported =
      false;


    Object.keys(data)
      .forEach(
        function (id) {

          const input =
            document.getElementById(id);


          // Input না থাকলে অথবা data খালি হলে skip
          if (
            !input ||
            data[id] === ""
          ) {

            return;

          }


          input.value =
            data[id];


          imported =
            true;

        }
      );


    // =======================================================
    // Data পাওয়া গেলে Preview আপডেট
    // =======================================================

    if (imported) {

      updatePreview();


      // =====================================================
      // Query parameters address bar থেকে সরিয়ে দেওয়া
      //
      // কিন্তু input-এর data থাকবে।
      // =====================================================

      try {

        const cleanUrl =
          window.location.origin +
          window.location.pathname +
          window.location.hash;


        window.history.replaceState(
          {},
          document.title,
          cleanUrl
        );

      } catch (e) {

        // Browser history update না হলে
        // কোনো সমস্যা হবে না।

      }

    }

  }


  // =========================================================
  // UPDATE COMPLETE PREVIEW
  // =========================================================

  function updatePreview() {

    fieldIds.forEach(
      setOutputs
    );


    updateQR();

  }


  // =========================================================
  // LIVE PREVIEW UPDATE
  // =========================================================

  fieldIds.forEach(
    function (id) {

      const input =
        document.getElementById(id);


      if (input) {

        input.addEventListener(
          "input",
          updatePreview
        );

      }

    }
  );


  // =========================================================
  // QR URL LIVE UPDATE
  // =========================================================

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


  // =========================================================
  // PREVIEW UPDATE BUTTON
  // =========================================================

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


  // =========================================================
  // PRINT / PDF BUTTON
  // =========================================================

  const printBtn =
    document.getElementById(
      "printBtn"
    );


  if (printBtn) {

    printBtn.addEventListener(
      "click",
      function () {

        // Print করার আগে Preview update
        updatePreview();


        // QR এবং Preview render হওয়ার
        // জন্য সামান্য সময় দেওয়া
        setTimeout(
          function () {

            window.print();

          },
          100
        );

      }
    );

  }


  // =========================================================
  // RESET BUTTON
  // =========================================================

  const resetBtn =
    document.getElementById(
      "resetBtn"
    );


  if (resetBtn) {

    resetBtn.addEventListener(
      "click",
      function () {


        // ===================================================
        // সব field খালি
        // ===================================================

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


        // ===================================================
        // QR URL খালি
        // ===================================================

        if (qrUrl) {

          qrUrl.value =
            "";

        }


        // ===================================================
        // Preview update
        // ===================================================

        updatePreview();

      }
    );

  }


  // =========================================================
  // PAGE LOAD
  //
  // 1. Admin/পুরোনো URL থেকে data নেবে
  // 2. Input field-এ বসাবে
  // 3. Preview update করবে
  // 4. QR তৈরি করবে
  // =========================================================

  importFromOldSite();


  updatePreview();


})();
