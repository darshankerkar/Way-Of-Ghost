import http from "node:http";

const langs = ["java", "python", "gcc"];

function postPackageInstall(language) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ language, version: "*" });

    const req = http.request(
      {
        hostname: process.env.PISTON_HOST || "localhost",
        port: 2000,
        path: "/api/v2/packages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let out = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (out += chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: out }));
      }
    );

    // Installs can take a long time; don't use a short timeout.
    req.setTimeout(15 * 60_000, () => {
      req.destroy(new Error("Timed out waiting for Piston response"));
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function install() {
  for (const lang of langs) {
    console.log("Installing", lang, "...");
    try {
      const res = await postPackageInstall(lang);
      const alreadyInstalled = res.body.includes("Already installed");
      if (res.status >= 400 && !alreadyInstalled) {
        console.error(`Failed (${res.status}) ${lang}:`, res.body);
        continue;
      }
      console.log(alreadyInstalled ? `Already installed: ${lang}` : res.body);
    } catch (err) {
      console.error(`Failed (network) ${lang}:`, (err instanceof Error ? err.message : String(err)));
    }
  }
}
install();
