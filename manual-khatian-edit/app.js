(function () {
  "use strict";

  // =========================================================
  // এই ID-গুলোর মাধ্যমে HTML-এর ইনপুট/প্রিভিউ ফিল্ড নিয়ন্ত্রণ করা হয়
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
  // ইনপুটের লেখা Preview-তে বসানো
  // =========================================================
  function setOutputs(id) {
    const input = document.getElementById(id);

    if (!input) return;

    document
      .querySelectorAll('[data-out="' + id + '"]')
      .forEach(function (el) {
        el.textContent = input.value;
      });
  }


  // =========================================================
  // QR Code তৈরি / আপডেট
  // =========================================================
  function updateQR() {
    const box = document.getElementById("qrcode");
    const input = document.getElementById("qrUrl");

    if (!box || !input) return;

    box.innerHTML = "";

    const url = input.value.trim();

    // URL না থাকলে QR লুকিয়ে রাখবে
    if (!url) {
      box.style.display = "none";
      return;
    }

    box.style.display = "block";

    // QRCode library পাওয়া না গেলে কিছু করবে না
    if (typeof QRCode === "undefined") {
      return;
    }

    new QRCode(box, {
      text: url,
      width: 92,
      height: 92,
      correctLevel: QRCode.CorrectLevel.M
    });
  }


  // =========================================================
  // পুরোনো সাইট থেকে URL Query Parameter-এর মাধ্যমে তথ্য নেওয়া
  //
  // উদাহরণ:
  //
  // index.html?
  // khatian=আরএস%20খতিয়ান%20নং-৩০২&
  // owner=জানিন&
  // dag=১২৩&
  // date=২৭-০৮-২০২৬&
  // url=https://example.com
  //
  // =========================================================
  function getImportedData() {
    const params = new URLSearchParams(window.location.search);


    // একাধিক সম্ভাব্য parameter name পরীক্ষা করবে
    function firstValue(keys) {
      for (const key of keys) {
        const value = params.get(key);

        if (value !== null && value !== "") {
          return value;
        }
      }

      return "";
    }


    // =======================================================
    // পুরোনো সাইটের তথ্য → এই সাইটের input ID
    // =======================================================
    return {
      // পুরোনো সাইটের "খতিয়ান" → শিরোনাম
      titleText: firstValue([
        "khatian",
        "title",
        "titleText"
      ]),

      // পুরোনো সাইটের "মালিক" → মালিক
      owner: firstValue([
        "owner",
        "malik",
        "ownerText"
      ]),

      // পুরোনো সাইটের "দাগ নং" → দাগ
      dag: firstValue([
        "dag",
        "dagNo",
        "dag_no",
        "dagNumber"
      ]),

      // পুরোনো সাইটের "তারিখ" → তারিখ
      printDate: firstValue([
        "date",
        "printDate",
        "tarikh"
      ]),

      // পুরোনো সাইটের "URL" → QR-এর URL
      qrUrl: firstValue([
        "url",
        "qrUrl",
        "qr_url"
      ])
    };
  }


  // =========================================================
  // URL থেকে পাওয়া তথ্য HTML-এর ঘরে বসানো
  // =========================================================
  function importFromOldSite() {
    const data = getImportedData();

    let imported = false;


    Object.keys(data).forEach(function (id) {
      const input = document.getElementById(id);

      // input না থাকলে বা data খালি হলে skip
      if (!input || data[id] === "") {
        return;
      }

      input.value = data[id];

      imported = true;
    });


    // অন্তত একটি তথ্য পাওয়া গেলে Preview আপডেট
    if (imported) {
      updatePreview();


      // =====================================================
      // তথ্য নেওয়ার পর URL-এর ?khatian=... এগুলো সরিয়ে দেবে
      // এতে address bar পরিষ্কার থাকবে
      //
      // NOTE:
      // Form-এর ভিতরের data মুছে যাবে না
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
        // কিছু browser-এ history পরিবর্তন না হলে
        // এখানে error ignore করবে
      }
    }
  }


  // =========================================================
  // পুরো Preview আপডেট
  // =========================================================
  function updatePreview() {
    fieldIds.forEach(setOutputs);

    updateQR();
  }


  // =========================================================
  // Input পরিবর্তন হলে সঙ্গে সঙ্গে Preview আপডেট
  // =========================================================
  fieldIds.forEach(function (id) {
    const input = document.getElementById(id);

    if (input) {
      input.addEventListener(
        "input",
        updatePreview
      );
    }
  });


  // =========================================================
  // QR URL পরিবর্তন হলে QR আপডেট
  // =========================================================
  const qrUrl = document.getElementById("qrUrl");

  if (qrUrl) {
    qrUrl.addEventListener(
      "input",
      updateQR
    );
  }


  // =========================================================
  // "প্রিভিউ আপডেট" button
  // =========================================================
  const updateBtn = document.getElementById("updateBtn");

  if (updateBtn) {
    updateBtn.addEventListener(
      "click",
      updatePreview
    );
  }


  // =========================================================
  // "প্রিন্ট / PDF" button
  // =========================================================
  const printBtn = document.getElementById("printBtn");

  if (printBtn) {
    printBtn.addEventListener(
      "click",
      function () {

        // আগে Preview আপডেট
        updatePreview();

        // তারপর print
        setTimeout(function () {
          window.print();
        }, 100);
      }
    );
  }


  // =========================================================
  // "সব ঘর খালি করুন" button
  // =========================================================
  const resetBtn = document.getElementById("resetBtn");

  if (resetBtn) {
    resetBtn.addEventListener(
      "click",
      function () {

        // সব input খালি
        fieldIds.forEach(function (id) {
          const input =
            document.getElementById(id);

          if (input) {
            input.value = "";
          }
        });


        // QR URL খালি
        if (qrUrl) {
          qrUrl.value = "";
        }


        // Preview আপডেট
        updatePreview();
      }
    );
  }


  // =========================================================
  // PAGE LOAD হওয়ার সঙ্গে সঙ্গে:
  //
  // 1. পুরোনো সাইট থেকে তথ্য নেবে
  // 2. input-এ বসাবে
  // 3. Preview আপডেট করবে
  // =========================================================
  importFromOldSite();

  updatePreview();

})();
