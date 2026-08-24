```javascript
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

  const params = new URLSearchParams(
    window.location.search
  );

  const idParam = params.get("id");

  function showNotFound() {
    document.body.innerHTML = `
      <div style="
        min-height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        margin:0;
        background:#f5f6fa;
        font-family:
          'Noto Sans Bengali',
          'Noto Sans Bengali UI',
          sans-serif;
      ">
        <div style="
          width:100%;
          max-width:520px;
          background:#ffffff;
          border:1px solid #e1e1e1;
          border-radius:10px;
          box-shadow:0 2px 10px rgba(0,0,0,.12);
          padding:40px 25px;
          text-align:center;
        ">
          <h1 style="
            margin:0;
            color:#00863c;
            font-size:28px;
            font-weight:800;
          ">
            কোনো খতিয়ান পাওয়া যায়নি
          </h1>
        </div>
      </div>
    `;

    document.body.style.margin = "0";
  }

  function showError() {
    document.body.innerHTML = `
      <div style="
        min-height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        margin:0;
        background:#f5f6fa;
        font-family:
          'Noto Sans Bengali',
          'Noto Sans Bengali UI',
          sans-serif;
      ">
        <div style="
          width:100%;
          max-width:520px;
          background:#ffffff;
          border:1px solid #e1e1e1;
          border-radius:10px;
          box-shadow:0 2px 10px rgba(0,0,0,.12);
          padding:40px 25px;
          text-align:center;
        ">
          <h1 style="
            margin:0;
            color:#a40000;
            font-size:26px;
            font-weight:800;
          ">
            তথ্য লোড করা যাচ্ছে না
          </h1>
        </div>
      </div>
    `;

    document.body.style.margin = "0";
  }

  function showRecord(record) {
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

    fields.forEach(function (field) {
      const element = document.getElementById(field);

      if (element) {
        element.textContent =
          record[field] ?? "";
      }
    });
  }

  async function loadRecord() {

    if (!idParam || !/^\d+$/.test(idParam)) {
      showNotFound();
      return;
    }

    const recordId = Number(idParam);

    const { data, error } = await client
      .from("land_records")
      .select(
        "id,khatian,owner,dag_no,survey,mouza,upazila,district,division,record_date"
      )
      .eq("id", recordId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      showError();
      return;
    }

    if (!data) {
      showNotFound();
      return;
    }

    showRecord(data);
  }

  loadRecord();

})();
```
