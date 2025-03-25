// backend/server.js
const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = 3000;

// CORS aktivieren für lokale Tests
app.use(cors());
app.use(bodyParser.json());

// Datenbank vorbereiten
const db = new sqlite3.Database("./backend/consent.sqlite");
db.run(`
  CREATE TABLE IF NOT EXISTS consent_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    categories TEXT,
    ip TEXT,
    userAgent TEXT,
    referrer TEXT
  )
`);

// Logging-Endpunkt
app.post("/log", (req, res) => {
  const { categories } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];
  const referrer = req.headers["referer"] || "";

  db.run(
    `INSERT INTO consent_log (timestamp, categories, ip, userAgent, referrer)
     VALUES (?, ?, ?, ?, ?)`,
    [
      new Date().toISOString(),
      JSON.stringify(categories),
      ip,
      userAgent,
      referrer,
    ]
  );

  res.status(200).json({ status: "logged" });
});

app.get("/admin", (req, res) => {
  db.all("SELECT * FROM consent_log ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).send("Fehler bei Datenabfrage");

    let html = `
        <html>
        <head>
          <title>Consent-Logs</title>
          <style>
            body { font-family: sans-serif; padding: 20px; background: #f8f8f8; }
            h1 { margin-bottom: 20px; }
            table { border-collapse: collapse; width: 100%; background: white; }
            th, td { padding: 10px; border: 1px solid #ccc; text-align: left; }
            th { background: #eee; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Consent Logs</h1>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Zeit</th>
                <th>Kategorien</th>
                <th>IP</th>
                <th>Browser</th>
                <th>Referrer</th>
              </tr>
            </thead>
            <tbody>
      `;

    rows.forEach((row) => {
      html += `
          <tr>
            <td>${row.id}</td>
            <td>${row.timestamp}</td>
            <td>${row.categories}</td>
            <td>${row.ip}</td>
            <td>${row.userAgent}</td>
            <td>${row.referrer}</td>
          </tr>
        `;
    });

    html += `
            </tbody>
          </table>
        </body>
        </html>
      `;

    res.send(html);
  });
});

// Server starten
app.listen(PORT, () => {
  console.log(`✅ Consent Logging API läuft auf http://localhost:${PORT}`);
});
