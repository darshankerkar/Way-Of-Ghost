const langs = ['java', 'python', 'c++'];

async function install() {
  for (const lang of langs) {
    console.log("Installing", lang, "...");
    const res = await fetch("http://localhost:2000/api/v2/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: lang, version: "*" })
    });
    const text = await res.text();
    console.log(text);
  }
}
install();
