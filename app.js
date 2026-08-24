(function () {
  const cfg = window.APP_CONFIG || {};

  const valid =
    cfg.SUPABASE_URL &&
    !cfg.SUPABASE_URL.includes("PASTE_") &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_ANON_KEY.includes("PASTE_");

  if (!valid || !window.supabase) {
    return;
  }

  const client = window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY
  );

  const fields = [
    "khatian",
    "owner",
    "dag_no",
    "survey",
    "mouza",
    "upazila",
    "district",
    "division",
    "record_date"
  ];

  function setText(id, value) {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = value ?? "";
    }
  }

  function showRecord(record) {
    fields.forEach(function (field) {
      setText(field, record[field]);
    });
  }

  function showNotFound() {
    const card = document.getElementById("record-card");

    if (!card) {
      return;
    }

    card.style.background = "#ffffff";
    card.style.backgroundColor = "#ffffff";

    card.innerHTML = `
      <div style="
        text-align:center;
        padding:30px 15px;
        font-family:inherit;
      ">
        <h1 style="
          color:#a40000;
          font-size:24px;
          margin:0 0 12px;
        ">
          খতিয়ান পাওয়া যায়নি
        </h1>

        <p style="
          color:#555;
          font-size:16px;
          line-height:1.6;
          margin:0;
        ">
          এই খতিয়ানটি মুছে ফেলা হয়েছে
          অথবা আর উপলভ্য নয়।
        </p>
      </div>
    `;
  }

  function showError() {
    const card = document.getElementById("record-card");

    if (!card) {
      return;
    }

    card.innerHTML = `
      <div style="
        text-align:center;
        padding:30px 15px;
      ">
        <h1 style="
          color:#a40000;
          font-size:22px;
          margin:0 0 10px;
        ">
          তথ্য লোড করা যায়নি
        </h1>

        <p style="
          color:#555;
          font-size:15px;
          margin:0;
        ">
          অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।
        </p>
      </div>
    `;
  }

  const params = new URLSearchParams(
    window.location.search
  );

  const idParam = params.get("id");

  /*
    No ID = latest record
    With ID = exact record
  */

  async function loadRecord() {

    let query = client
      .from("land_records")
      .select(
        "id,khatian,owner,dag_no,survey,mouza,upazila,district,division,record_date"
      );

    if (idParam && /^\d+$/.test(idParam)) {

      query = query.eq(
        "id",
        Number(idParam)
      );

    } else {

      query = query
        .order("id", {
          ascending: false
        })
        .limit(1);
    }

    const {
      data,
      error
    } = await query.maybeSingle();

    if (error) {
      console.error(error);
      showError();
      return;
    }

    /*
      No fallback data here.
      Deleted record = no data = dead URL.
    */

    if (!data) {
      showNotFound();
      return;
    }

    showRecord(data);
  }

  loadRecord();

})();
