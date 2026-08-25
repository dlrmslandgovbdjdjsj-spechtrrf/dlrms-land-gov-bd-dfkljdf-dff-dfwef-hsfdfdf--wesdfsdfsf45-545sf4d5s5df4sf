(function () {
  "use strict";

  /*
    KHATIAN AUTO-FILL
    -----------------
    এই পেজ URL হবে:
    .../index.html?id=28

    id অনুযায়ী Supabase-এর ready_khatian টেবিল থেকে তথ্য
    নিজে নিজে ফর্মে বসবে। এরপর পুরোনো manual editor-এর মতো
    আপনি চাইলে যেকোনো ঘর পরিবর্তন করতে পারবেন।
  */

  const SUPABASE_URL = "https://ltfsopobmmcseekouhd.supabase.co";
  const SUPABASE_ANON_KEY =
    "sb_publishable_IAXZxM_DmmJlhhavUY7uBQ_uQfhWHQQ";

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

  function setValue(id, value) {
    const input = document.getElementById(id);
    if (!input) return;

    if (value === null || value === undefined) {
      input.value = "";
      return;
    }

    input.value = String(value);
  }

  function setOutputs(id) {
    const input = document.getElementById(id);
    if (!input) return;

    document
      .querySelectorAll('[data-out="' + id + '"]')
      .forEach(function (el) {
        el.textContent = input.value;
      });
  }

  function updateQR() {
    const box = document.getElementById("qrcode");
    const input = document.getElementById("qrUrl");

    if (!box || !input) return;

    box.innerHTML = "";

    const url = input.value.trim();

    if (!url) {
      box.style.display = "none";
      return;
    }

    box.style.display = "block";

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

  function updatePreview() {
    fieldIds.forEach(setOutputs);
    updateQR();
  }

  /*
    ready_khatian-এর data -> পুরোনো editor-এর field
    mapping
  */
  function fillFromReadyKhatian(row) {
    if (!row) return;

    setValue("titleText", row.title);
    setValue("pageText", row.page_no || "পৃষ্ঠা নং: ১ এর ১");

    setValue("division", row.division);
    setValue("district", row.district);
    setValue("upazila", row.upazila);
    setValue("mouza", row.mouza);
    setValue("jlNo", row.jl_no);

    // পুরোনো editor-এর "রেঃ সা. নং" ঘরে ready_khatian-এর record_no
    setValue("revisionNo", row.record_no);

    setValue("owner", row.owner_address);
    setValue("share", row.share);
    setValue("revenue", row.revenue);
    setValue("dag", row.dag);
    setValue("agri", row.agri);
    setValue("nonAgri", row.non_agri);

    setValue("dagTotalAcre", row.dag_unit);
    setValue("dagTotalPercent", row.dag_percent);
    setValue("khatianShare", row.record_share);

    setValue("shareLandAcre", row.area_unit);
    setValue("shareLandPercent", row.area_percent);

    setValue("remarks", row.remarks);

    /*
      ready_khatian-এ মোট জমির জন্য total_unit এবং total_percent
      দুটো আলাদা field আছে। পুরোনো editor-এ একটি মাত্র totalLand
      field থাকায় আগে percent থাকলে সেটি, না থাকলে unit নেওয়া হচ্ছে।
    */
    if (row.total_percent !== null && row.total_percent !== undefined &&
        String(row.total_percent).trim() !== "") {
      setValue("totalLand", row.total_percent);
    } else {
      setValue("totalLand", row.total_unit);
    }

    if (row.print_date) {
      setValue("printDate", row.print_date);
    }

    // পুরোনো editor-এর default printing অপরিবর্তিত থাকবে।
    if (!document.getElementById("printing").value.trim()) {
      setValue("printing", "সেটেলমেন্ট প্রেস, ঢাকা");
    }

    /*
      QR-এর URL = এই একই public editor URL।
      যেমন: https://.../manual-khatian-edit/index.html?id=28
    */
    const qrInput = document.getElementById("qrUrl");
    if (qrInput) {
      qrInput.value = window.location.href;
    }

    updatePreview();
  }

  async function autoFill() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    // id না থাকলে পুরোনো manual editor-এর মতোই থাকবে।
    if (!id) {
      updatePreview();
      return;
    }

    try {
      const endpoint =
        SUPABASE_URL +
        "/rest/v1/ready_khatian" +
        "?id=eq." + encodeURIComponent(id) +
        "&is_deleted=eq.false" +
        "&select=*";

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": "Bearer " + SUPABASE_ANON_KEY,
          "Accept": "application/json"
        },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Supabase HTTP " + response.status);
      }

      const rows = await response.json();

      if (!Array.isArray(rows) || rows.length === 0) {
        console.warn("ready_khatian-এ id পাওয়া যায়নি:", id);
        updatePreview();
        return;
      }

      fillFromReadyKhatian(rows[0]);

    } catch (error) {
      console.error("খতিয়ান অটোফিল ব্যর্থ:", error);
      updatePreview();
    }
  }

  fieldIds.forEach(function (id) {
    const input = document.getElementById(id);

    if (input) {
      input.addEventListener("input", updatePreview);
    }
  });

  const qrUrl = document.getElementById("qrUrl");

  if (qrUrl) {
    qrUrl.addEventListener("input", updateQR);
  }

  document.getElementById("updateBtn").addEventListener(
    "click",
    updatePreview
  );

  document.getElementById("printBtn").addEventListener(
    "click",
    function () {
      updatePreview();

      setTimeout(function () {
        window.print();
      }, 150);
    }
  );

  document.getElementById("resetBtn").addEventListener(
    "click",
    function () {
      fieldIds.forEach(function (id) {
        const input = document.getElementById(id);

        if (input) {
          input.value = "";
        }
      });

      if (qrUrl) {
        qrUrl.value = "";
      }

      updatePreview();
    }
  );

  // প্রথমে পুরোনো editor চালু হবে, তারপর URL-এর id থাকলে auto-fill হবে।
  updatePreview();
  autoFill();

})();
