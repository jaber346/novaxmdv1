const axios = require("axios");
const config = require("../config");

function onlyDigits(s = "") {
  return String(s).replace(/\D/g, "");
}

module.exports = {
  name: "pair",
  category: "Owner",
  description: "Générer un code de pairing via ton backend",

  async execute(sock, m, args, extra = {}) {
    const from = m.key.remoteJid;
    const prefix = extra.prefix || config.PREFIX || ".";

    if (!extra.isOwner) {
      return sock.sendMessage(
        from,
        { text: "❌ Commande réservée au owner." },
        { quoted: m }
      );
    }

    const number = onlyDigits(args[0]);

    if (!number || number.length < 8) {
      return sock.sendMessage(
        from,
        {
          text:
`Utilisation :
${prefix}pair 226XXXXXXXX

Sans +, sans espace.`
        },
        { quoted: m }
      );
    }

    try {
      await sock.sendMessage(
        from,
        { text: `⏳ Génération du code pour *${number}*...` },
        { quoted: m }
      );

      const baseUrl = config.PAIR_BASE_URL || "http://127.0.0.1:3000";

      const [pairRes, countRes] = await Promise.all([
        axios.get(`${baseUrl}/pair?number=${encodeURIComponent(number)}`, { timeout: 20000 }),
        axios.get(`${baseUrl}/sessions/count`, { timeout: 10000 }).catch(() => ({ data: { count: "?" } }))
      ]);

      const code = pairRes.data?.code;
      const count = countRes.data?.count ?? "?";

      if (!code) {
        throw new Error("Code non reçu");
      }

      return sock.sendMessage(
        from,
        {
          text:
`╭──────────────〔 NOVA XMD V1 〕──────────────╮
│ ✅ CODE PAIRING
│ 📱 Numéro : ${number}
│ 🔑 Code : ${code}
│ 👥 Sessions : ${count}
╰────────────────────────────────────────────╯

📌 WhatsApp → Appareils connectés → Lier un appareil
→ Connecter avec un numéro
→ Entre ce code rapidement`
        },
        { quoted: m }
      );
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "Erreur inconnue";

      return sock.sendMessage(
        from,
        {
          text:
`❌ Erreur pairing

Message : ${msg}`
        },
        { quoted: m }
      );
    }
  }
};