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
        margin:0;
        padding:20px;
        background:#f5f6fa;
        font-family:
          'Noto Sans Bengali',
          'Noto Sans Bengali UI',
          sans-serif;
      ">

        <div style="
          width:100%;
          max-width:500px;
          padding:35px 20px;
          background:#fff;
          border:1px solid #e1e1e1;
          border-radius:10px;
          box-shadow:0 2px 10px rgba(0,0,0,.12);
          text-align:center;
        ">

          <h1 style="
            margin:0;
            color:#111;
            font-size:28px;
            font-weight:800;
          ">
            খতিয়ান পাওয়া যায়নি
          </h1>

        </div>

      </div>
    `;

    document.body.style.margin = "0";
  }


  function showError() {

    const card =
      document.getElementById("record-card");

    if (!card) {
      return;
    }

    card.innerHTML = `
      <div style="
        text-align:center;
        padding:30px 15px;
      ">

        <h1 style="
          margin:0;
          color:#111;
          font-size:22px;
          font-weight:800;
        ">
          তথ্য লোড করা যাচ্ছে না
        </h1>

      </div>
    `;
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


    /* Specific record URL */

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

    }


    /* Main page without ID */

    else {

      query =
        query
          .order(
            "id",
            {
              ascending:false
            }
          )
          .limit(1);

    }


    const result =
      await query.maybeSingle();


    const data =
      result.data;

    const error =
      result.error;


    if (error) {

      console.error(
        "Supabase error:",
        error
      );

      showError();

      return;
    }


    /* Deleted or missing record */

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
