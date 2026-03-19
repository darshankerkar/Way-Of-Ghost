const http = require('http');

const langs = ['java', 'python', 'gcc'];

async function install(lang) {
  return new Promise((resolve) => {
    console.log("Installing", lang, "...");
    const data = JSON.stringify({ language: lang, version: "*" });
    const options = {
      hostname: 'localhost',
      port: 2000,
      path: '/api/v2/packages',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = http.request(options, (res) => {
      let out = "";
      res.on('data', d => out += d);
      res.on('end', () => resolve(out));
    });
    // No timeout
    req.write(data);
    req.end();
  });
}

(async () => {
  for (const l of langs) {
    console.log(await install(l));
  }
})();
