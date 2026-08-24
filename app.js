(function () {
  const cfg = window.APP_CONFIG || {};

  const valid =
    cfg.SUPABASE_URL &&
    !cfg.SUPABASE_URL.includes("PASTE_") &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_ANON_KEY.includes("PASTE_");

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
      el.textContent = value == null ? "" : value;
    }
  }

  function showRecord(record) {
    fields.forEach(function (field) {
      setText(field, record[field]);
    });
  }

  function showDeletedMessage() {
    const card = document.getElementById("record-card");

    if (!card) {
      return;
    }

    card.innerHTML = `
      <div
        style="
          text-align:center;
          padding:35px 20px;
          color:#a40000;
          font-family:inherit;
        "
      >
        <h1
          style="
            color:#a40000;
            font-size:24px;
            margin:0 0 14px;
          "
        >
          খতিয়ান পাওয়া যায়নি
        </h1>

        <p
          style="
            margin:0;
            font-size:17px;
            line-height:1.6;
          "
        >
          এই খতিয়ানটি মুছে ফেলা হয়েছে
          অথবা আর উপলভ্য নয়।
        </p>
      </div>
    `;

    card.style.background = "#fff";
  }

  function showConfigError() {
    const card = document.getElementById("record-card");

    if (!card) {
      return;
    }

    card.innerHTML = `
      <div
        style="
          text-align:center;
          padding:30px 20px;
          color:#a40000;
        "
      >
        <h1
          style="
            color:#a40000;
            font-size:22px;
            margin:0 0 12px;
          "
        >
          সংযোগ সমস্যা
        </h1>

        <p
          style="
            margin:0;
            font-size:16px;
            line-height:1.6;
          "
        >
          ডাটাবেসের সাথে সংযোগ করা যাচ্ছে না।
        </p>
      </div>
    `;
  }

  function showNotFound() {
    showDeletedMessage();
  }

  if (!valid || !window.supabase) {
    showConfigError();
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

  /*
    URL-এ ?id=5 থাকলে ঠিক ওই record খুঁজবে।
    id না থাকলে পুরোনো default হিসেবে ID 1 দেখাবে।
  */

  const recordId =
    idParam && /^\d+$/.test(idParam)
      ? Number(idParam)
      : 1;

  client
    .from("land_records")
    .select(
      "id,khatian,owner,dag_no,survey,mouza,upazila,district,division,record_date"
    )
    .eq("id", recordId)
    .maybeSingle()
    .then(function (result) {

      const data = result.data;
      const error = result.error;

      if (error) {
        console.error("Supabase error:", error);
        showConfigError();
        return;
      }

      /*
        সবচেয়ে গুরুত্বপূর্ণ অংশ:

        record না থাকলে কোনো fallback data দেখাবে না।
        অর্থাৎ delete করা ID-এর URL খুললেও
        খতিয়ান আর দেখাবে না।
      */

      if (!data) {
        showNotFound();
        return;
      }

      showRecord(data);
    })
    .catch(function (error) {
      console.error("Unexpected error:", error);
      showConfigError();
    });

})();
