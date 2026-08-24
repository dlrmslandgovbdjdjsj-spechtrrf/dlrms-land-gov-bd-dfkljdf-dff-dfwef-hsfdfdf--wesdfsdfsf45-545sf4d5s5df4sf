```javascript
(function () {

  const cfg = window.APP_CONFIG || {};

  const valid =
    cfg.SUPABASE_URL &&
    !cfg.SUPABASE_URL.includes("PASTE_") &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_ANON_KEY.includes("PASTE_");

  if (!valid || !window.supabase) {
    console.error("Supabase configuration is missing.");
    return;
  }

  const client =
    window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_ANON_KEY
    );

  const params =
    new URLSearchParams(
      window.location.search
    );

  const idParam =
    params.get("id");


  function showNotFound() {

    const card =
      document.getElementById("record-card");

    if (!card) {
      return;
    }

    card.innerHTML = `
      <div style="
        width:100%;
        min-height:180px;
        display:flex;
        align-items:center;
        justify-content:center;
        text-align:center;
        padding:20px;
      ">

        <h1 style="
          margin:0;
          padding:0;
          color:#111111;
          font-size:28px;
          line-height:1.4;
          font-weight:800;
        ">
          কোন খতিয়ান পাওয়া যায়নি
        </h1>

      </div>
    `;

    card.style.background = "#ffffff";
    card.style.backgroundColor = "#ffffff";
    card.style.backgroundImage = "none";
  }


  function showError() {

    const card =
      document.getElementById("record-card");

    if (!card) {
      return;
    }

    card.innerHTML = `
      <div style="
        width:100%;
        min-height:180px;
        display:flex;
        align-items:center;
        justify-content:center;
        text-align:center;
        padding:20px;
      ">

        <h1 style="
          margin:0;
          padding:0;
          color:#111111;
          font-size:24px;
          line-height:1.4;
          font-weight:800;
        ">
          তথ্য লোড করা যাচ্ছে না
        </h1>

      </div>
    `;

    card.style.background = "#ffffff";
    card.style.backgroundColor = "#ffffff";
    card.style.backgroundImage = "none";
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

      const element =
        document.getElementById(field);

      if (element) {

        element.textContent =
          record[field] ?? "";

      }

    });
  }


  async function loadRecord() {

    let query =
      client
        .from("land_records")
        .select(
          "id,khatian,owner,dag_no,survey,mouza,upazila,district,division,record_date"
        );


    if (idParam !== null) {

      if (!/^\d+$/.test(idParam)) {

        showNotFound();

        return;
      }

      query =
        query.eq(
          "id",
          Number(idParam)
        );

    } else {

      query =
        query
          .order(
            "id",
            {
              ascending: false
            }
          )
          .limit(1);
    }


    const {
      data,
      error
    } = await query.maybeSingle();


    if (error) {

      console.error(
        "Supabase error:",
        error
      );

      showError();

      return;
    }


    if (!data) {

      showNotFound();

      return;
    }


    showRecord(data);

  }


  loadRecord().catch(function (error) {

    console.error(
      "Unexpected error:",
      error
    );

    showError();

  });

})();
```
