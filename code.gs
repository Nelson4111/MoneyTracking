// ============================================================
// MONEY TRACKING 2026 - Backend Google Apps Script
// ============================================================

const ID_MASTER_USERS = "1Lzk2cJ0D0GvM0tvbyqaOsyAtrjth0Q5wBjLJWKkye2Q";

const NAMA_TAB_MASTER = {
  USERS: "USERS2",
  SETTING_WEB: "SETTING_WEB",
};

const NAMA_TAB = {
  TRANSAKSI: "TRANSAKSI",
  AKUN: "AKUN",
  KATEGORI: "KATEGORI",
  BUDGET: "BUDGET",
  PELANGGAN: "PELANGGAN",
  PEMBAYARAN: "PEMBAYARAN",
  BOT_LOG: "BOT_LOG",
  PENGATURAN: "PENGATURAN",
};

function doGet(e) {
  return HtmlService.createTemplateFromFile("Index")
    .evaluate()
    .setTitle("Money Tracking 2026")
    .addMetaTag(
      "viewport",
      "width=device-width, initial-scale=1, viewport-fit=cover",
    )
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function filterTransaksiByRole(transaksi, role) {
  role = role || "UserPribadi";
  if (role === "Admin") return transaksi;
  if (role === "UserBisnisPribadi" || role === "UserPribadiBisnis") {
    return transaksi.filter(function (t) {
      const jenis = mtJenisKeuangan_(t);
      return jenis === "Pribadi" || jenis === "Bisnis";
    });
  }
  if (role === "UserBisnis") {
    return transaksi.filter(function (t) {
      return mtJenisKeuangan_(t) === "Bisnis";
    });
  }
  if (role === "UserPribadi") {
    return transaksi.filter(function (t) {
      return mtJenisKeuangan_(t) === "Pribadi";
    });
  }
  return transaksi.filter(function (t) {
    return mtJenisKeuangan_(t) === "Pribadi";
  });
}

function roleBolehJenisKeuangan(role, jenisKeuangan) {
  role = role || "UserPribadi";
  jenisKeuangan = mtJenisKeuangan_({ "Jenis Keuangan": jenisKeuangan });
  if (role === "Admin") return true;
  if (role === "UserBisnisPribadi" || role === "UserPribadiBisnis")
    return jenisKeuangan === "Pribadi" || jenisKeuangan === "Bisnis";
  if (role === "UserBisnis") return jenisKeuangan === "Bisnis";
  if (role === "UserPribadi") return jenisKeuangan === "Pribadi";
  return jenisKeuangan === "Pribadi";
}

function getUserMasterByUsername(username) {
  pastikanHeaderMasterUser_();
  const users = ambilDataMasterSebagaiObjek(NAMA_TAB_MASTER.USERS);
  const inputUsername = String(username || "")
    .trim()
    .toLowerCase();
  return (
    users.find(function (u) {
      return (
        String(u["Username"] || "")
          .trim()
          .toLowerCase() === inputUsername
      );
    }) || null
  );
}

function modeAksesUser(username) {
  const user = getUserMasterByUsername(username);
  if (!user) return "Normal";
  const manualMode = String(user["Mode Akses"] || "").trim();
  if (manualMode === "ReadOnly") return "ReadOnly";
  if (manualMode === "Normal") return "Normal";
  const info = hitungStatusLangganan(user);
  return info.modeAkses || "Normal";
}

function wajibBolehTulis(data) {
  const username = data && data.username ? data.username : "";
  if (!username) {
    return {
      boleh: false,
      pesan: "Username tidak dikirim. Sistem tidak bisa memvalidasi akses.",
    };
  }
  const mode = modeAksesUser(username);
  if (mode === "ReadOnly") {
    return {
      boleh: false,
      pesan:
        "Akun dalam mode lihat saja. Tidak bisa menambah, mengubah, atau menghapus data.",
    };
  }
  return { boleh: true, pesan: "" };
}

function balasJson(status, data, pesan) {
  return JSON.stringify({
    status: status,
    data: data || null,
    pesan: pesan || "",
  });
}

function getSheet(spreadsheetId, namaTab) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    let sheet = ss.getSheetByName(namaTab);
    return sheet;
  } catch (e) {
    return null;
  }
}

function ambilDataSebagaiObjek(spreadsheetId, namaTab) {
  const sheet = getSheet(spreadsheetId, namaTab);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(function (row) {
    const obj = {};
    headers.forEach(function (h, i) {
      obj[h] = row[i];
    });
    return obj;
  });
}

function ambilDataMasterSebagaiObjek(namaTab) {
  return ambilDataSebagaiObjek(ID_MASTER_USERS, namaTab);
}

function generateId() {
  return (
    new Date().getTime().toString(36).toUpperCase() +
    Math.random().toString(36).substr(2, 4).toUpperCase()
  );
}

function formatTanggal(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

function ambilNominalUniversal(t) {
  return mtAngka_(t["Nominal"] || t["Jumlah"] || t["_Nominal"] || 0);
}

function ambilJenisKeuanganUniversal(t) {
  return mtJenisKeuangan_(t);
}

function ambilTipeUniversal(t) {
  return mtTipeTransaksi_(t);
}

function ambilKategoriUniversal(t) {
  return t["Kategori"] || t["Tipe Pembayaran"] || "Lainnya";
}

function ambilAkunUniversal(t) {
  const tipe = ambilTipeUniversal(t);
  if (tipe === "Transfer") {
    return (t["Akun Asal"] || "-") + " → " + (t["Akun Tujuan"] || "-");
  }
  return t["Akun"] || t["Akun Asal"] || t["Akun Tujuan"] || "-";
}

function ambilJenisLaporanUniversal(t) {
  const tipeTransaksi = mtTipeTransaksi_(t);
  const tipePembayaran = t["Tipe Pembayaran"] || "";
  if (tipeTransaksi === "Pemasukan") return "Pemasukan";
  if (tipeTransaksi === "Pengeluaran") return "Pengeluaran";
  if (tipeTransaksi === "Transfer") return "Transfer";
  if (tipePembayaran === "Pembayaran Masuk") return "Pemasukan";
  if (tipePembayaran === "Operasional Bisnis") return "Pengeluaran";
  if (tipePembayaran === "Refund") return "Pengeluaran";
  if (tipePembayaran === "Lainnya") {
    if (t["Akun Tujuan"] && !t["Akun Asal"]) return "Pemasukan";
    if (t["Akun Asal"] && !t["Akun Tujuan"]) return "Pengeluaran";
  }
  return "";
}

function ambilTanggalKey(t) {
  if (!t["Tanggal"]) return "";
  const d = new Date(t["Tanggal"]);
  if (isNaN(d)) return "";
  return d.toISOString().split("T")[0];
}

function tambahKeObjekRingkasan(obj, key, dataAwal, nominal) {
  if (!obj[key]) obj[key] = dataAwal;
  obj[key].total += nominal;
}

function getNilaiTransaksi(t, namaBaru, namaLama, defaultValue) {
  if (t[namaBaru] !== undefined && t[namaBaru] !== "") return t[namaBaru];
  if (namaLama && t[namaLama] !== undefined && t[namaLama] !== "")
    return t[namaLama];
  return defaultValue || "";
}

function getNominalTransaksi(t) {
  return mtAngka_(getNilaiTransaksi(t, "Nominal", "Jumlah", 0));
}

function getTipeTransaksi(t) {
  return mtTipeTransaksi_(t);
}

function getAkunTransaksi(t) {
  const tipe = getTipeTransaksi(t);
  if (tipe === "Pemasukan")
    return getNilaiTransaksi(t, "Akun Tujuan", "Akun", "");
  if (tipe === "Pengeluaran")
    return getNilaiTransaksi(t, "Akun Asal", "Akun", "");
  return (
    getNilaiTransaksi(t, "Akun Asal", "Akun", "") ||
    getNilaiTransaksi(t, "Akun Tujuan", "", "")
  );
}

function pastikanHeaderTransaksi(spreadsheetId) {
  const sheet = getSheet(spreadsheetId, NAMA_TAB.TRANSAKSI);
  if (!sheet) return;
  const headerBaru = [
    "ID",
    "Tanggal",
    "Jenis Keuangan",
    "Tipe Transaksi",
    "Tipe Pembayaran",
    "Kategori",
    "Akun Asal",
    "Akun Tujuan",
    "Nominal",
    "Keterangan",
    "Pelanggan",
    "Status",
    "Sumber Input",
    "Invoice ID",
    "Nomor WA",
    "Detail Item",
    "Metode Pembayaran",
    "Saldo Diproses",
    "Created At",
    "Updated At",
  ];
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length === 0) {
    sheet.appendRow(headerBaru);
    return;
  }
  const headers = values[0];
  headerBaru.forEach(function (h) {
    if (headers.indexOf(h) === -1)
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
  });
}

function appendObjekKeSheet(sheet, obj) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(function (h) {
    return obj[h] !== undefined ? obj[h] : "";
  });
  sheet.appendRow(row);
}

function headerMasterUserWajib_() {
  return [
    "ID",
    "Nama",
    "Username",
    "Password",
    "Spreadsheet ID",
    "Role",
    "Status",
    "Tema",
    "Warna",
    "No WA",
    "Created At",
  ];
}

function pastikanHeaderMasterUser_() {
  const ss = SpreadsheetApp.openById(ID_MASTER_USERS);
  let sheet = ss.getSheetByName(NAMA_TAB_MASTER.USERS);
  if (!sheet) sheet = ss.insertSheet(NAMA_TAB_MASTER.USERS);
  pastikanKolomSheet_(sheet, headerMasterUserWajib_());
  return sheet;
}

function pastikanKolomSheet_(sheet, headerWajib) {
  if (!sheet) return [];
  let lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) {
    sheet.appendRow(headerWajib);
    return headerWajib.slice();
  }
  let headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  if (!headers || headers.length === 0 || headers[0] === "") {
    sheet.clearContents();
    sheet.appendRow(headerWajib);
    return headerWajib.slice();
  }
  headerWajib.forEach(function (h) {
    if (headers.indexOf(h) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
    }
  });
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function pastikanHeaderPembayaran(spreadsheetId) {
  const sheet = getSheet(spreadsheetId, NAMA_TAB.PEMBAYARAN);
  if (!sheet) return null;
  pastikanKolomSheet_(sheet, [
    "ID",
    "Transaksi ID",
    "Pelanggan ID",
    "Jumlah",
    "Metode",
    "Bukti URL",
    "Status",
    "Catatan",
    "Invoice ID",
    "Nomor WA",
    "Detail Item",
    "Sumber Input",
    "Updated At",
    "Created At",
  ]);
  return sheet;
}

function pastikanHeaderPelanggan(spreadsheetId) {
  const sheet = getSheet(spreadsheetId, NAMA_TAB.PELANGGAN);
  if (!sheet) return null;
  pastikanKolomSheet_(sheet, [
    "ID",
    "Nama",
    "No HP",
    "Email",
    "Alamat",
    "Status",
    "Created At",
  ]);
  return sheet;
}

function objekDariRow_(headers, row) {
  const obj = {};
  headers.forEach(function (h, i) {
    obj[h] = row[i];
  });
  return obj;
}

function setObjekKeSheetRow_(sheet, rowNumber, obj) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Object.keys(obj).forEach(function (key) {
    const idx = headers.indexOf(key);
    if (idx !== -1) sheet.getRange(rowNumber, idx + 1).setValue(obj[key]);
  });
}

function cariRowSheet_(sheet, namaKolom, nilai) {
  if (!sheet) return null;
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;
  const headers = values[0];
  const idx = headers.indexOf(namaKolom);
  if (idx === -1) return null;
  const target = String(nilai || "").trim();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idx] || "").trim() === target) {
      return {
        rowNumber: i + 1,
        headers: headers,
        row: values[i],
        obj: objekDariRow_(headers, values[i]),
      };
    }
  }
  return null;
}

function normalisasiNomorWa_(nomor) {
  let n = String(nomor || "").replace(/[^0-9]/g, "");
  if (n.charAt(0) === "0") n = "62" + n.slice(1);
  return n;
}

function detailItemBot_(items) {
  try {
    return JSON.stringify(items || []);
  } catch (e) {
    return "[]";
  }
}

function ringkasanItemBot_(items) {
  items = items || [];
  return items
    .map(function (item) {
      return (
        (item.nama || item.name || "Item") +
        " x" +
        (parseFloat(item.qty || item.quantity || 1) || 1) +
        " @ " +
        mtAngka_(item.hargaSatuan || item.harga || item.price || 0)
      );
    })
    .join("; ");
}

function botApiKeyValid_(apiKey) {
  try {
    const required =
      PropertiesService.getScriptProperties().getProperty(
        "MONEYTRACK_BOT_API_KEY",
      ) || "";
    if (!required) return true;
    return String(apiKey || "") === String(required);
  } catch (e) {
    return true;
  }
}

function wajibBotApiKey_(apiKey) {
  if (!botApiKeyValid_(apiKey)) {
    throw new Error("API key bot tidak valid.");
  }
}

function statusPembayaranBot_(status) {
  const s = String(status || "").trim();
  if (s === "Diterima") return "Lunas";
  if (s === "Menunggu") return "Menunggu Verifikasi";
  return s || "Menunggu Pembayaran";
}

function cariAtauBuatPelangganBot_(spreadsheetId, order) {
  const sheet = pastikanHeaderPelanggan(spreadsheetId);
  if (!sheet) return "";
  const noWa = normalisasiNomorWa_(order.nomorWa || order.nomor || order.wa);
  const nama = String(order.namaUser || order.nama || order.customerName || noWa || "Pelanggan WA").trim();
  const values = sheet.getDataRange().getValues();
  const headers = values[0] || [];
  const hpIdx = headers.indexOf("No HP");
  const idIdx = headers.indexOf("ID");
  if (hpIdx !== -1 && noWa) {
    for (let i = 1; i < values.length; i++) {
      if (normalisasiNomorWa_(values[i][hpIdx]) === noWa) {
        return idIdx !== -1 ? values[i][idIdx] : "";
      }
    }
  }
  const id = generateId();
  appendObjekKeSheet(sheet, {
    ID: id,
    Nama: nama,
    "No HP": noWa,
    Email: "",
    Alamat: "",
    Status: "Aktif",
    "Created At": new Date().toISOString(),
  });
  return id;
}

// ============================================================
// SETUP DATABASE
// ============================================================

function setupMasterUser() {
  try {
    let sheet = pastikanHeaderMasterUser_();
    const headers = headerMasterUserWajib_();
    const existing = sheet.getDataRange().getValues();
    if (existing.length === 0 || existing[0][0] !== "ID") {
      sheet.clearContents();
      sheet.appendRow(headers);
      appendObjekKeSheet(sheet, {
        ID: generateId(),
        Nama: "Nelson Randanan",
        Username: "nelson",
        Password: "123",
        "Spreadsheet ID": "1yUsZQ_JJ1Uf1I81lfD3eDTibOta2wsBLWc9VSp-Kw_4",
        Role: "Admin",
        Status: "Aktif",
        Tema: "dark",
        Warna: "#00ff99",
        "No WA": "6281241100804",
        "Created At": new Date().toISOString(),
      });
      appendObjekKeSheet(sheet, {
        ID: generateId(),
        Nama: "Imelda",
        Username: "imelda",
        Password: "123",
        "Spreadsheet ID": "1Jo9Z-GGKlPoG0Zmfhf9awr2EESdmeTedALfhF3knFiY",
        Role: "UserPribadi",
        Status: "Aktif",
        Tema: "dark",
        Warna: "#00d5ff",
        "No WA": "",
        "Created At": new Date().toISOString(),
      });
    }
    Logger.log("Setup master user berhasil.");
    return "OK";
  } catch (e) {
    Logger.log("Error setupMasterUser: " + e.message);
    return "ERROR: " + e.message;
  }
}

function setupSpreadsheetUser(spreadsheetId) {
  try {
    const idBersih = ambilIdDariUrlAtauId(spreadsheetId);
    if (!idBersih)
      throw new Error("Spreadsheet ID kosong dari data user master.");
    const ss = SpreadsheetApp.openById(idBersih);
    const tabSetup = [
      {
        nama: NAMA_TAB.TRANSAKSI,
        headers: [
          "ID",
          "Tanggal",
          "Jenis Keuangan",
          "Tipe Transaksi",
          "Tipe Pembayaran",
          "Kategori",
          "Akun Asal",
          "Akun Tujuan",
          "Nominal",
          "Keterangan",
          "Pelanggan",
          "Status",
          "Sumber Input",
          "Invoice ID",
          "Nomor WA",
          "Detail Item",
          "Metode Pembayaran",
          "Saldo Diproses",
          "Created At",
          "Updated At",
        ],
      },
      {
        nama: NAMA_TAB.AKUN,
        headers: [
          "ID",
          "Nama Akun",
          "Jenis",
          "Saldo Awal",
          "Saldo Sekarang",
          "Warna",
          "Icon",
          "Status",
          "Created At",
        ],
      },
      {
        nama: NAMA_TAB.KATEGORI,
        headers: [
          "ID",
          "Nama",
          "Jenis",
          "Icon",
          "Warna",
          "Status",
          "Created At",
        ],
      },
      {
        nama: NAMA_TAB.BUDGET,
        headers: [
          "ID",
          "Bulan",
          "Tahun",
          "Kategori",
          "Nominal Budget",
          "Realisasi",
          "Status",
          "Created At",
        ],
      },
      {
        nama: NAMA_TAB.PELANGGAN,
        headers: [
          "ID",
          "Nama",
          "No HP",
          "Email",
          "Alamat",
          "Status",
          "Created At",
        ],
      },
      {
        nama: NAMA_TAB.PEMBAYARAN,
        headers: [
          "ID",
          "Transaksi ID",
          "Pelanggan ID",
          "Jumlah",
          "Metode",
          "Bukti URL",
          "Status",
          "Catatan",
          "Invoice ID",
          "Nomor WA",
          "Detail Item",
          "Sumber Input",
          "Updated At",
          "Created At",
        ],
      },
      {
        nama: NAMA_TAB.BOT_LOG,
        headers: ["ID", "Waktu", "Tipe", "Pesan", "Data", "Status"],
      },
      { nama: NAMA_TAB.PENGATURAN, headers: ["Key", "Value", "Updated At"] },
    ];
    tabSetup.forEach(function (tab) {
      let sheet = ss.getSheetByName(tab.nama);
      if (!sheet) {
        sheet = ss.insertSheet(tab.nama);
        sheet.appendRow(tab.headers);
      }
    });
    const sheetPengaturan = ss.getSheetByName(NAMA_TAB.PENGATURAN);
    const existPengaturan = sheetPengaturan.getDataRange().getValues();
    if (existPengaturan.length <= 1) {
      [
        ["app_name", "Money Tracking 2026"],
        ["owner_name", "Admin"],
        ["tahun_default", new Date().getFullYear()],
        ["mata_uang", "IDR"],
        ["tema", "dark"],
      ].forEach(function (row) {
        sheetPengaturan.appendRow([row[0], row[1], new Date().toISOString()]);
      });
    }
    Logger.log("Setup spreadsheet user berhasil: " + idBersih);
    return "OK";
  } catch (e) {
    Logger.log("Error setupSpreadsheetUser: " + e.message);
    return "ERROR: " + e.message;
  }
}

function setupSettingWeb() {
  const ss = SpreadsheetApp.openById(ID_MASTER_USERS);
  let sheet = ss.getSheetByName(NAMA_TAB_MASTER.SETTING_WEB);
  if (!sheet) {
    sheet = ss.insertSheet(NAMA_TAB_MASTER.SETTING_WEB);
    sheet.appendRow(["Key", "Value", "Updated At"]);
  }
  const data = sheet.getDataRange().getValues();
  const keys = data.slice(1).map(function (row) {
    return row[0];
  });
  const defaults = [
    ["musik_url", "", new Date().toISOString()],
    ["musik_global_aktif", "false", new Date().toISOString()],
    ["pesan_login_aktif", "false", new Date().toISOString()],
    [
      "pesan_login_isi",
      "Selamat pagi, semoga pagimu cerah.",
      new Date().toISOString(),
    ],
    ["pesan_login_media_url", "", new Date().toISOString()],
    ["pesan_login_music_url", "", new Date().toISOString()],
    ["pesan_login_target", "semua", new Date().toISOString()],
  ];
  defaults.forEach(function (row) {
    if (keys.indexOf(row[0]) === -1) sheet.appendRow(row);
  });
  return "OK";
}

function getSettingWeb() {
  try {
    setupSettingWeb();
    const data = ambilDataMasterSebagaiObjek(NAMA_TAB_MASTER.SETTING_WEB);
    const hasil = {};
    data.forEach(function (row) {
      hasil[row["Key"]] = row["Value"];
    });
    return balasJson("success", hasil, "Setting web berhasil dimuat.");
  } catch (e) {
    return balasJson("error", null, "Gagal memuat setting web: " + e.message);
  }
}

function simpanSettingWeb(data) {
  try {
    const cekAkses = getUserMasterByUsername(data.username);
    if (!cekAkses || cekAkses["Role"] !== "Admin") {
      return balasJson(
        "error",
        null,
        "Hanya Admin yang boleh mengubah setting web.",
      );
    }
    setupSettingWeb();
    const ss = SpreadsheetApp.openById(ID_MASTER_USERS);
    const sheet = ss.getSheetByName(NAMA_TAB_MASTER.SETTING_WEB);
    const values = sheet.getDataRange().getValues();
    const mapRow = {};
    for (let i = 1; i < values.length; i++) {
      mapRow[values[i][0]] = i + 1;
    }
    const entries = [
      ["musik_url", data.musik_url || ""],
      ["musik_global_aktif", data.musik_global_aktif || "false"],
      ["pesan_login_aktif", data.pesan_login_aktif || "false"],
      ["pesan_login_isi", data.pesan_login_isi || ""],
      ["pesan_login_media_url", data.pesan_login_media_url || ""],
      ["pesan_login_music_url", data.pesan_login_music_url || ""],
      ["pesan_login_target", data.pesan_login_target || "semua"],
    ];
    entries.forEach(function (item) {
      const key = item[0],
        value = item[1];
      if (mapRow[key]) {
        sheet.getRange(mapRow[key], 2).setValue(value);
        sheet.getRange(mapRow[key], 3).setValue(new Date().toISOString());
      } else {
        sheet.appendRow([key, value, new Date().toISOString()]);
      }
    });
    return balasJson("success", null, "Setting web berhasil disimpan.");
  } catch (e) {
    return balasJson(
      "error",
      null,
      "Gagal menyimpan setting web: " + e.message,
    );
  }
}

function getNotifikasiLogin(role) {
  try {
    setupSettingWeb();

    const data = ambilDataMasterSebagaiObjek(NAMA_TAB_MASTER.SETTING_WEB);
    const setting = {};

    data.forEach(function (row) {
      setting[row["Key"]] = row["Value"];
    });

    const aktif =
      String(setting.pesan_login_aktif || "false").toLowerCase() === "true";
    const target = setting.pesan_login_target || "semua";

    if (!aktif) {
      return balasJson(
        "success",
        {
          tampil: false,
        },
        "Pesan login nonaktif.",
      );
    }

    if (target !== "semua" && target !== role) {
      return balasJson(
        "success",
        {
          tampil: false,
        },
        "Role bukan target pesan login.",
      );
    }

    return balasJson(
      "success",
      {
        tampil: true,
        pesan: setting.pesan_login_isi || "",
        mediaUrl: setting.pesan_login_media_url || "",
        musicUrl: setting.pesan_login_music_url || "",
      },
      "Pesan login berhasil dimuat.",
    );
  } catch (e) {
    return balasJson("error", null, "Gagal memuat pesan login: " + e.message);
  }
}
// ============================================================
// AUTH & LOGIN
// ============================================================

function login(username, password) {
  try {
    if (!username || !password)
      return balasJson("error", null, "Username dan password wajib diisi.");
    pastikanHeaderMasterUser_();
    const inputUsername = String(username).trim().toLowerCase();
    const inputPassword = String(password).trim();
    const users = ambilDataMasterSebagaiObjek(NAMA_TAB_MASTER.USERS);
    Logger.log("TAB USERS DIPAKAI: " + NAMA_TAB_MASTER.USERS);
    Logger.log("JUMLAH USER TERBACA: " + users.length);
    const user = users.find(function (u) {
      const usernameSheet = String(u["Username"] || "")
        .trim()
        .toLowerCase();
      const passwordSheet = String(u["Password"] || "").trim();
      return usernameSheet === inputUsername && passwordSheet === inputPassword;
    });
    if (!user) return balasJson("error", null, "Username atau password salah.");
    const status = String(user["Status"] || "")
      .trim()
      .toLowerCase();
    if (status !== "aktif")
      return balasJson("error", null, "Akun tidak aktif. Hubungi admin.");
    setupSpreadsheetUser(user["Spreadsheet ID"]);
    var infoLangganan = hitungStatusLangganan(user);
    var modeManual = String(user["Mode Akses"] || "").trim();
    if (modeManual === "ReadOnly") infoLangganan.modeAkses = "ReadOnly";
    if (modeManual === "Normal") infoLangganan.modeAkses = "Normal";
    return balasJson(
      "success",
      {
        nama: user["Nama"],
        username: user["Username"],
        spreadsheetId: user["Spreadsheet ID"],
        role: user["Role"],
        tema: user["Tema"] || "dark",
        warna: user["Warna"] || "#00ff99",
        noWa: normalisasiNomorWa_(user["No WA"] || user["Nomor WA"] || user["No HP"] || ""),
        fotoProfil: user["Foto Profil"] || "",
        statusLangganan: infoLangganan.statusLangganan,
        modeAkses: infoLangganan.modeAkses,
        berakhirLangganan: infoLangganan.berakhirLangganan,
        graceSampai: infoLangganan.graceSampai,
        tipeLangganan: user["Tipe Langganan"] || "",
      },
      "Login berhasil.",
    );
  } catch (e) {
    return balasJson("error", null, "Terjadi kesalahan login: " + e.message);
  }
}

// ============================================================
// TRANSAKSI
// ============================================================

function getTransaksi(spreadsheetId, filter) {
  try {
    let data = ambilDataSebagaiObjek(spreadsheetId, NAMA_TAB.TRANSAKSI);
    if (filter && filter.role) data = filterTransaksiByRole(data, filter.role);
    data = data.map(function (t) {
      const tipe = mtTipeTransaksi_(t);
      const nominal = getNominalTransaksi(t);
      t["_JenisKeuangan"] = mtJenisKeuangan_(t);
      t["_Tipe"] = tipe;
      t["_Nominal"] = nominal;
      t["_Akun"] = mtAkunTransaksi_(t);
      t["_AkunAsal"] = getNilaiTransaksi(t, "Akun Asal", "", "");
      t["_AkunTujuan"] = getNilaiTransaksi(t, "Akun Tujuan", "", "");
      t["_Keterangan"] = getNilaiTransaksi(t, "Keterangan", "", "");
      t["_Kategori"] = getNilaiTransaksi(t, "Kategori", "", "");
      t["_Pelanggan"] = getNilaiTransaksi(t, "Pelanggan", "Pelanggan ID", "");
      return t;
    });
    if (filter) {
      if (filter.bulan)
        data = data.filter(function (d) {
          const tgl = new Date(d["Tanggal"]);
          return tgl.getMonth() + 1 == parseInt(filter.bulan);
        });
      if (filter.tahun)
        data = data.filter(function (d) {
          const tgl = new Date(d["Tanggal"]);
          return tgl.getFullYear() == parseInt(filter.tahun);
        });
      if (filter.jenis)
        data = data.filter(function (d) {
          return d["_Tipe"] === filter.jenis;
        });
      if (filter.kategori)
        data = data.filter(function (d) {
          return d["_Kategori"] === filter.kategori;
        });
    }
    data.sort(function (a, b) {
      return new Date(b["Tanggal"]) - new Date(a["Tanggal"]);
    });
    return balasJson("success", data);
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function tambahTransaksi(spreadsheetId, data) {
  try {
    const cekAkses = wajibBolehTulis(data);
    if (!cekAkses.boleh) return balasJson("error", null, cekAkses.pesan);
    pastikanHeaderTransaksi(spreadsheetId);
    const sheet = getSheet(spreadsheetId, NAMA_TAB.TRANSAKSI);
    if (!sheet)
      return balasJson("error", null, "Sheet TRANSAKSI tidak ditemukan.");
    const jenisKeuangan = data.jenisKeuangan || "Pribadi";
    if (!roleBolehJenisKeuangan(data.role || "UserPribadi", jenisKeuangan))
      return balasJson(
        "error",
        null,
        "Role ini tidak boleh input transaksi " + jenisKeuangan + ".",
      );
    const tipeTransaksi = data.tipeTransaksi || data.jenis || "";
    const tipePembayaran = data.tipePembayaran || "";
    const nominal = parseFloat(data.nominal || data.jumlah) || 0;
    const akunAsal = data.akunAsal || "";
    const akunTujuan = data.akunTujuan || data.akun || "";
    if (!data.tanggal) return balasJson("error", null, "Tanggal wajib diisi.");
    if (!["Pribadi", "Bisnis"].includes(jenisKeuangan))
      return balasJson("error", null, "Jenis keuangan tidak valid.");
    if (nominal <= 0)
      return balasJson("error", null, "Nominal harus lebih dari 0.");
    if (jenisKeuangan === "Pribadi") {
      if (!["Pemasukan", "Pengeluaran", "Transfer"].includes(tipeTransaksi))
        return balasJson("error", null, "Tipe transaksi pribadi tidak valid.");
      if (tipeTransaksi === "Pemasukan" && !akunTujuan)
        return balasJson(
          "error",
          null,
          "Akun tujuan wajib diisi untuk pemasukan.",
        );
      if (tipeTransaksi === "Pengeluaran" && !akunAsal)
        return balasJson(
          "error",
          null,
          "Akun asal wajib diisi untuk pengeluaran.",
        );
      if (tipeTransaksi === "Transfer") {
        if (!akunAsal || !akunTujuan)
          return balasJson(
            "error",
            null,
            "Akun asal dan akun tujuan wajib diisi untuk transfer.",
          );
        if (akunAsal === akunTujuan)
          return balasJson(
            "error",
            null,
            "Akun asal dan akun tujuan tidak boleh sama.",
          );
      }
    }
    if (jenisKeuangan === "Bisnis") {
      if (
        ![
          "Pembayaran Masuk",
          "Operasional Bisnis",
          "Refund",
          "Lainnya",
        ].includes(tipePembayaran)
      )
        return balasJson("error", null, "Tipe pembayaran bisnis tidak valid.");
      if (tipePembayaran === "Pembayaran Masuk" && !akunTujuan)
        return balasJson(
          "error",
          null,
          "Akun tujuan wajib diisi untuk pembayaran masuk.",
        );
      if (
        (tipePembayaran === "Operasional Bisnis" ||
          tipePembayaran === "Refund") &&
        !akunAsal
      )
        return balasJson("error", null, "Akun asal wajib diisi.");
    }
    const id = generateId();
    appendObjekKeSheet(sheet, {
      ID: id,
      Tanggal: data.tanggal,
      "Jenis Keuangan": jenisKeuangan,
      "Tipe Transaksi": jenisKeuangan === "Pribadi" ? tipeTransaksi : "",
      "Tipe Pembayaran": jenisKeuangan === "Bisnis" ? tipePembayaran : "",
      Kategori: data.kategori || "",
      "Akun Asal": akunAsal,
      "Akun Tujuan": akunTujuan,
      Nominal: nominal,
      Keterangan: data.keterangan || "",
      Pelanggan:
        jenisKeuangan === "Bisnis"
          ? data.pelanggan || data.pelangganId || ""
          : "",
      Status: data.status || "Lunas",
      "Sumber Input": data.sumberInput || "Manual",
      "Created At": new Date().toISOString(),
      "Updated At": new Date().toISOString(),
    });
    prosesSaldoTransaksiBaru(spreadsheetId, {
      jenisKeuangan,
      tipeTransaksi,
      tipePembayaran,
      akunAsal,
      akunTujuan,
      nominal,
    });
    mtHapusCacheDashboard_(spreadsheetId);
    return balasJson("success", { id: id }, "Transaksi berhasil ditambahkan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function editTransaksi(spreadsheetId, id, data) {
  try {
    const cekAkses = wajibBolehTulis(data);
    if (!cekAkses.boleh) return balasJson("error", null, cekAkses.pesan);
    const sheet = getSheet(spreadsheetId, NAMA_TAB.TRANSAKSI);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const idIdx = headers.indexOf("ID");
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][idIdx]) === String(id)) {
        const kolom = [
          ["Tanggal", data.tanggal],
          ["Jenis Keuangan", data.jenisKeuangan],
          ["Tipe Transaksi", data.tipeTransaksi],
          ["Tipe Pembayaran", data.tipePembayaran],
          ["Kategori", data.kategori],
          ["Akun Asal", data.akunAsal],
          ["Akun Tujuan", data.akunTujuan],
          ["Nominal", data.nominal ? parseFloat(data.nominal) : undefined],
          ["Keterangan", data.keterangan],
          ["Status", data.status],
          ["Pelanggan", data.pelanggan],
          ["Updated At", new Date().toISOString()],
        ];
        kolom.forEach(function (k) {
          if (k[1] === undefined || k[1] === null) return;
          const idx = headers.indexOf(k[0]);
          if (idx !== -1) sheet.getRange(i + 1, idx + 1).setValue(k[1]);
        });
        mtHapusCacheDashboard_(spreadsheetId);
        return balasJson("success", null, "Transaksi berhasil diubah.");
      }
    }
    return balasJson("error", null, "Transaksi tidak ditemukan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function hapusTransaksi(spreadsheetId, id, data) {
  try {
    const cekAkses = wajibBolehTulis(data || {});
    if (!cekAkses.boleh) return balasJson("error", null, cekAkses.pesan);
    const sheet = getSheet(spreadsheetId, NAMA_TAB.TRANSAKSI);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const rows = sheet.getDataRange().getValues();
    const idIdx = rows[0].indexOf("ID");
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idIdx] === id) {
        sheet.deleteRow(i + 1);
        mtHapusCacheDashboard_(spreadsheetId);
        return balasJson("success", null, "Transaksi berhasil dihapus.");
      }
    }
    return balasJson("error", null, "Transaksi tidak ditemukan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

// ============================================================
// AKUN & SALDO
// ============================================================

function getMasterInputTransaksi(spreadsheetId) {
  try {
    const akun = ambilDataSebagaiObjek(spreadsheetId, NAMA_TAB.AKUN);
    const kategori = ambilDataSebagaiObjek(spreadsheetId, NAMA_TAB.KATEGORI);
    return balasJson(
      "success",
      { akun: akun || [], kategori: kategori || [] },
      "Master input transaksi berhasil dimuat.",
    );
  } catch (e) {
    return balasJson(
      "error",
      null,
      "Gagal memuat master input transaksi: " + e.message,
    );
  }
}

function getAkun(spreadsheetId) {
  try {
    return balasJson(
      "success",
      ambilDataSebagaiObjek(spreadsheetId, NAMA_TAB.AKUN),
    );
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function tambahAkun(spreadsheetId, data) {
  try {
    if (!data.namaAkun)
      return balasJson("error", null, "Nama akun wajib diisi.");
    const sheet = getSheet(spreadsheetId, NAMA_TAB.AKUN);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const id = generateId();
    const saldo = parseFloat(data.saldoAwal) || 0;
    sheet.appendRow([
      id,
      data.namaAkun,
      data.jenis || "Tunai",
      saldo,
      saldo,
      data.warna || "#00ff99",
      data.icon || "wallet",
      "Aktif",
      new Date().toISOString(),
    ]);
    return balasJson("success", { id: id }, "Akun berhasil ditambahkan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function editAkun(spreadsheetId, id, data) {
  try {
    const sheet = getSheet(spreadsheetId, NAMA_TAB.AKUN);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const idIdx = headers.indexOf("ID");
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idIdx] === id) {
        if (data.namaAkun)
          sheet
            .getRange(i + 1, headers.indexOf("Nama Akun") + 1)
            .setValue(data.namaAkun);
        if (data.jenis)
          sheet
            .getRange(i + 1, headers.indexOf("Jenis") + 1)
            .setValue(data.jenis);
        if (data.warna)
          sheet
            .getRange(i + 1, headers.indexOf("Warna") + 1)
            .setValue(data.warna);
        if (data.status)
          sheet
            .getRange(i + 1, headers.indexOf("Status") + 1)
            .setValue(data.status);
        return balasJson("success", null, "Akun berhasil diubah.");
      }
    }
    return balasJson("error", null, "Akun tidak ditemukan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function hapusAkun(spreadsheetId, id) {
  try {
    const sheet = getSheet(spreadsheetId, NAMA_TAB.AKUN);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const rows = sheet.getDataRange().getValues();
    const idIdx = rows[0].indexOf("ID");
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idIdx] === id) {
        sheet.deleteRow(i + 1);
        return balasJson("success", null, "Akun berhasil dihapus.");
      }
    }
    return balasJson("error", null, "Akun tidak ditemukan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function ubahSaldoAkun(spreadsheetId, namaAkun, selisih) {
  if (!namaAkun) return;
  const sheet = getSheet(spreadsheetId, NAMA_TAB.AKUN);
  if (!sheet) return;
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return;
  const headers = rows[0];
  const namaIdx = headers.indexOf("Nama Akun");
  const saldoIdx = headers.indexOf("Saldo Sekarang");
  if (namaIdx === -1 || saldoIdx === -1) return;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][namaIdx]).trim() === String(namaAkun).trim()) {
      const saldoSekarang = parseFloat(rows[i][saldoIdx]) || 0;
      sheet.getRange(i + 1, saldoIdx + 1).setValue(saldoSekarang + selisih);
      return;
    }
  }
}

function tambahSaldoAkun(spreadsheetId, namaAkun, nominal) {
  ubahSaldoAkun(spreadsheetId, namaAkun, Math.abs(parseFloat(nominal) || 0));
}

function kurangSaldoAkun(spreadsheetId, namaAkun, nominal) {
  ubahSaldoAkun(spreadsheetId, namaAkun, -Math.abs(parseFloat(nominal) || 0));
}

function prosesSaldoTransaksiBaru(spreadsheetId, data) {
  const nominal = parseFloat(data.nominal) || 0;
  if (nominal <= 0) return;
  if (data.jenisKeuangan === "Pribadi") {
    if (data.tipeTransaksi === "Pemasukan")
      tambahSaldoAkun(spreadsheetId, data.akunTujuan, nominal);
    if (data.tipeTransaksi === "Pengeluaran")
      kurangSaldoAkun(spreadsheetId, data.akunAsal, nominal);
    if (data.tipeTransaksi === "Transfer") {
      kurangSaldoAkun(spreadsheetId, data.akunAsal, nominal);
      tambahSaldoAkun(spreadsheetId, data.akunTujuan, nominal);
    }
  }
  if (data.jenisKeuangan === "Bisnis") {
    if (data.tipePembayaran === "Pembayaran Masuk")
      tambahSaldoAkun(spreadsheetId, data.akunTujuan, nominal);
    if (
      data.tipePembayaran === "Operasional Bisnis" ||
      data.tipePembayaran === "Refund"
    )
      kurangSaldoAkun(spreadsheetId, data.akunAsal, nominal);
  }
}

function updateSaldoAkun(spreadsheetId, namaAkun, jenis, jumlah) {
  try {
    const sheet = getSheet(spreadsheetId, NAMA_TAB.AKUN);
    if (!sheet) return;
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const namaIdx = headers.indexOf("Nama Akun");
    const saldoIdx = headers.indexOf("Saldo Sekarang");
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][namaIdx] === namaAkun) {
        let saldo = parseFloat(rows[i][saldoIdx]) || 0;
        if (jenis === "Pemasukan") saldo += jumlah;
        else if (jenis === "Pengeluaran") saldo -= jumlah;
        sheet.getRange(i + 1, saldoIdx + 1).setValue(saldo);
        break;
      }
    }
  } catch (e) {
    Logger.log("Error updateSaldoAkun: " + e.message);
  }
}

// ============================================================
// KATEGORI
// ============================================================

function getKategori(spreadsheetId) {
  try {
    return balasJson(
      "success",
      ambilDataSebagaiObjek(spreadsheetId, NAMA_TAB.KATEGORI),
    );
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function tambahKategori(spreadsheetId, data) {
  try {
    if (!data.nama || !data.jenis)
      return balasJson("error", null, "Nama dan jenis wajib diisi.");
    const sheet = getSheet(spreadsheetId, NAMA_TAB.KATEGORI);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const id = generateId();
    sheet.appendRow([
      id,
      data.nama,
      data.jenis,
      data.icon || "tag",
      data.warna || "#00ff99",
      "Aktif",
      new Date().toISOString(),
    ]);
    return balasJson("success", { id: id }, "Kategori berhasil ditambahkan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function editKategori(spreadsheetId, id, data) {
  try {
    const sheet = getSheet(spreadsheetId, NAMA_TAB.KATEGORI);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const idIdx = headers.indexOf("ID");
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idIdx] === id) {
        if (data.nama)
          sheet
            .getRange(i + 1, headers.indexOf("Nama") + 1)
            .setValue(data.nama);
        if (data.jenis)
          sheet
            .getRange(i + 1, headers.indexOf("Jenis") + 1)
            .setValue(data.jenis);
        if (data.warna)
          sheet
            .getRange(i + 1, headers.indexOf("Warna") + 1)
            .setValue(data.warna);
        if (data.status)
          sheet
            .getRange(i + 1, headers.indexOf("Status") + 1)
            .setValue(data.status);
        return balasJson("success", null, "Kategori berhasil diubah.");
      }
    }
    return balasJson("error", null, "Kategori tidak ditemukan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function hapusKategori(spreadsheetId, id) {
  try {
    const sheet = getSheet(spreadsheetId, NAMA_TAB.KATEGORI);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const rows = sheet.getDataRange().getValues();
    const idIdx = rows[0].indexOf("ID");
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idIdx] === id) {
        sheet.deleteRow(i + 1);
        return balasJson("success", null, "Kategori berhasil dihapus.");
      }
    }
    return balasJson("error", null, "Kategori tidak ditemukan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

// ============================================================
// BUDGET
// ============================================================

function getBudget(spreadsheetId, bulan, tahun) {
  try {
    let data = ambilDataSebagaiObjek(spreadsheetId, NAMA_TAB.BUDGET);

    if (bulan) {
      data = data.filter(function (d) {
        return String(d["Bulan"]) === String(bulan);
      });
    }

    if (tahun) {
      data = data.filter(function (d) {
        return String(d["Tahun"]) === String(tahun);
      });
    }

    const transaksi = ambilDataSebagaiObjek(spreadsheetId, NAMA_TAB.TRANSAKSI);

    data = data.map(function (b) {
      const bulanBudget = parseInt(b["Bulan"], 10);
      const tahunBudget = parseInt(b["Tahun"], 10);
      const nominalBudget = parseFloat(b["Nominal Budget"]) || 0;

      const realisasi = transaksi
        .filter(function (t) {
          const tgl = new Date(t["Tanggal"]);
          if (isNaN(tgl)) return false;

          return (
            String(t["Kategori"] || "").trim() ===
              String(b["Kategori"] || "").trim() &&
            ambilJenisLaporanUniversal(t) === "Pengeluaran" &&
            tgl.getMonth() + 1 === bulanBudget &&
            tgl.getFullYear() === tahunBudget
          );
        })
        .reduce(function (sum, t) {
          return sum + ambilNominalUniversal(t);
        }, 0);

      b["Realisasi"] = realisasi;
      b["Persentase"] =
        nominalBudget > 0 ? Math.round((realisasi / nominalBudget) * 100) : 0;

      return b;
    });

    return balasJson("success", data);
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function tambahBudget(spreadsheetId, data) {
  try {
    if (!data.bulan || !data.tahun || !data.kategori || !data.nominal)
      return balasJson("error", null, "Data tidak lengkap.");
    const sheet = getSheet(spreadsheetId, NAMA_TAB.BUDGET);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const id = generateId();
    sheet.appendRow([
      id,
      parseInt(data.bulan),
      parseInt(data.tahun),
      data.kategori,
      parseFloat(data.nominal),
      0,
      "Aktif",
      new Date().toISOString(),
    ]);
    return balasJson("success", { id: id }, "Budget berhasil ditambahkan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function hapusBudget(spreadsheetId, id) {
  try {
    const sheet = getSheet(spreadsheetId, NAMA_TAB.BUDGET);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const rows = sheet.getDataRange().getValues();
    const idIdx = rows[0].indexOf("ID");
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idIdx] === id) {
        sheet.deleteRow(i + 1);
        return balasJson("success", null, "Budget berhasil dihapus.");
      }
    }
    return balasJson("error", null, "Budget tidak ditemukan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

// ============================================================
// PELANGGAN
// ============================================================

function getPelanggan(spreadsheetId) {
  try {
    return balasJson(
      "success",
      ambilDataSebagaiObjek(spreadsheetId, NAMA_TAB.PELANGGAN),
    );
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function tambahPelanggan(spreadsheetId, data) {
  try {
    if (!data.nama)
      return balasJson("error", null, "Nama pelanggan wajib diisi.");
    const sheet = getSheet(spreadsheetId, NAMA_TAB.PELANGGAN);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const id = generateId();
    sheet.appendRow([
      id,
      data.nama,
      data.noHp || "",
      data.email || "",
      data.alamat || "",
      "Aktif",
      new Date().toISOString(),
    ]);
    return balasJson("success", { id: id }, "Pelanggan berhasil ditambahkan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function editPelanggan(spreadsheetId, id, data) {
  try {
    const sheet = getSheet(spreadsheetId, NAMA_TAB.PELANGGAN);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const idIdx = headers.indexOf("ID");
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idIdx] === id) {
        if (data.nama)
          sheet
            .getRange(i + 1, headers.indexOf("Nama") + 1)
            .setValue(data.nama);
        if (data.noHp !== undefined)
          sheet
            .getRange(i + 1, headers.indexOf("No HP") + 1)
            .setValue(data.noHp);
        if (data.email !== undefined)
          sheet
            .getRange(i + 1, headers.indexOf("Email") + 1)
            .setValue(data.email);
        if (data.alamat !== undefined)
          sheet
            .getRange(i + 1, headers.indexOf("Alamat") + 1)
            .setValue(data.alamat);
        if (data.status)
          sheet
            .getRange(i + 1, headers.indexOf("Status") + 1)
            .setValue(data.status);
        return balasJson("success", null, "Pelanggan berhasil diubah.");
      }
    }
    return balasJson("error", null, "Pelanggan tidak ditemukan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function hapusPelanggan(spreadsheetId, id) {
  try {
    const sheet = getSheet(spreadsheetId, NAMA_TAB.PELANGGAN);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const rows = sheet.getDataRange().getValues();
    const idIdx = rows[0].indexOf("ID");
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idIdx] === id) {
        sheet.deleteRow(i + 1);
        return balasJson("success", null, "Pelanggan berhasil dihapus.");
      }
    }
    return balasJson("error", null, "Pelanggan tidak ditemukan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

// ============================================================
// PEMBAYARAN
// ============================================================

function getPembayaran(spreadsheetId) {
  try {
    return balasJson(
      "success",
      ambilDataSebagaiObjek(spreadsheetId, NAMA_TAB.PEMBAYARAN),
    );
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function tambahPembayaran(spreadsheetId, data) {
  try {
    if (!data.jumlah || !data.metode)
      return balasJson("error", null, "Data tidak lengkap.");
    const sheet = pastikanHeaderPembayaran(spreadsheetId);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const id = generateId();
    appendObjekKeSheet(sheet, {
      ID: id,
      "Transaksi ID": data.transaksiId || "",
      "Pelanggan ID": data.pelangganId || "",
      Jumlah: parseFloat(data.jumlah),
      Metode: data.metode,
      "Bukti URL": data.buktiUrl || "",
      Status: data.status || "Menunggu",
      Catatan: data.catatan || "",
      "Invoice ID": data.invoiceId || "",
      "Nomor WA": normalisasiNomorWa_(data.nomorWa || data.nomor || ""),
      "Detail Item": detailItemBot_(data.items || []),
      "Sumber Input": data.sumberInput || "Manual",
      "Updated At": new Date().toISOString(),
      "Created At": new Date().toISOString(),
    });
    return balasJson("success", { id: id }, "Pembayaran berhasil ditambahkan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function verifikasiPembayaran(spreadsheetId, id, status) {
  try {
    if (!["Diterima", "Ditolak", "Lunas", "Menunggu Verifikasi", "Batal"].includes(status))
      return balasJson("error", null, "Status tidak valid.");
    const sheet = pastikanHeaderPembayaran(spreadsheetId);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const idIdx = headers.indexOf("ID");
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idIdx] === id) {
        const invoiceIdx = headers.indexOf("Invoice ID");
        const invoiceId = invoiceIdx !== -1 ? rows[i][invoiceIdx] || id : id;
        const hasil = updateOrderStatusBotInternal_(
          spreadsheetId,
          invoiceId,
          status,
          "",
        );
        const parsed = JSON.parse(hasil);
        if (parsed.status === "success") {
          return balasJson("success", parsed.data, "Pembayaran berhasil diverifikasi.");
        }
        return hasil;
      }
    }
    return balasJson("error", null, "Pembayaran tidak ditemukan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

// ============================================================
// BOT LOG
// ============================================================

function getBotLog(spreadsheetId) {
  try {
    const data = ambilDataSebagaiObjek(spreadsheetId, NAMA_TAB.BOT_LOG);
    data.sort(function (a, b) {
      return new Date(b["Waktu"]) - new Date(a["Waktu"]);
    });
    return balasJson("success", data.slice(0, 100));
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function tambahBotLog(spreadsheetId, tipe, pesan, dataLog) {
  try {
    const sheet = getSheet(spreadsheetId, NAMA_TAB.BOT_LOG);
    if (!sheet) return;
    sheet.appendRow([
      generateId(),
      new Date().toISOString(),
      tipe,
      pesan,
      JSON.stringify(dataLog || {}),
      "OK",
    ]);
  } catch (e) {
    Logger.log("Error tambahBotLog: " + e.message);
  }
}

// ============================================================
// INTEGRASI BOT WA NENELCRAFT
// ============================================================

function botAmbilAkunByWa_(nomorWa, apiKey) {
  wajibBotApiKey_(apiKey);
  pastikanHeaderMasterUser_();
  const target = normalisasiNomorWa_(nomorWa);
  if (!target) {
    return { ok: false, data: null, pesan: "Nomor WA kosong." };
  }

  const users = ambilDataMasterSebagaiObjek(NAMA_TAB_MASTER.USERS);
  const user =
    users.find(function (u) {
      return (
        normalisasiNomorWa_(u["No WA"] || u["Nomor WA"] || u["No HP"] || "") ===
        target
      );
    }) || null;
  if (!user) {
    return {
      ok: false,
      data: {
        nomorWa: target,
        webUrl: "https://nelson4111.github.io/MoneyTracking/",
      },
      pesan:
        "Nomor WA ini belum terdaftar di akun MoneyTrack. Login ke web lalu isi Nomor WA di profil akun.",
    };
  }

  const status = String(user["Status"] || "").trim();
  if (status !== "Aktif") {
    return {
      ok: false,
      data: null,
      pesan: "Akun MoneyTrack untuk nomor ini tidak aktif.",
    };
  }

  setupSpreadsheetUser(user["Spreadsheet ID"]);
  const infoLangganan = hitungStatusLangganan(user);
  return {
    ok: true,
    user: user,
    account: {
      id: user["ID"],
      nama: user["Nama"],
      username: user["Username"],
      spreadsheetId: user["Spreadsheet ID"],
      role: user["Role"],
      noWa: target,
      status: status,
      statusLangganan: infoLangganan.statusLangganan,
      modeAkses: infoLangganan.modeAkses,
    },
  };
}

function botCariUserByWa(nomorWa, apiKey) {
  try {
    const hasil = botAmbilAkunByWa_(nomorWa, apiKey);
    if (!hasil.ok) return balasJson("error", hasil.data || null, hasil.pesan);
    return balasJson("success", hasil.account, "Akun MoneyTrack ditemukan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function botTambahTransaksiPribadi(nomorWa, data, apiKey) {
  try {
    const hasil = botAmbilAkunByWa_(nomorWa, apiKey);
    if (!hasil.ok) return balasJson("error", hasil.data || null, hasil.pesan);
    if (!roleBolehJenisKeuangan(hasil.account.role, "Pribadi"))
      return balasJson(
        "error",
        null,
        "Akun nomor ini tidak punya akses transaksi Pribadi.",
      );

    data = data || {};
    data.username = hasil.account.username;
    data.role = hasil.account.role;
    data.jenisKeuangan = "Pribadi";
    return tambahTransaksi(hasil.account.spreadsheetId, data);
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function botEditTransaksiPribadi(nomorWa, id, data, apiKey) {
  try {
    const hasil = botAmbilAkunByWa_(nomorWa, apiKey);
    if (!hasil.ok) return balasJson("error", hasil.data || null, hasil.pesan);
    if (!roleBolehJenisKeuangan(hasil.account.role, "Pribadi"))
      return balasJson(
        "error",
        null,
        "Akun nomor ini tidak punya akses transaksi Pribadi.",
      );

    data = data || {};
    data.username = hasil.account.username;
    data.role = hasil.account.role;
    data.jenisKeuangan = "Pribadi";
    return editTransaksi(hasil.account.spreadsheetId, id, data);
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function botHapusTransaksiPribadi(nomorWa, id, apiKey) {
  try {
    const hasil = botAmbilAkunByWa_(nomorWa, apiKey);
    if (!hasil.ok) return balasJson("error", hasil.data || null, hasil.pesan);
    if (!roleBolehJenisKeuangan(hasil.account.role, "Pribadi"))
      return balasJson(
        "error",
        null,
        "Akun nomor ini tidak punya akses transaksi Pribadi.",
      );

    return hapusTransaksi(hasil.account.spreadsheetId, id, {
      username: hasil.account.username,
    });
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function botUpsertOrder(spreadsheetId, order, apiKey) {
  try {
    wajibBotApiKey_(apiKey);
    order = order || {};
    const invoiceId = String(order.invoiceId || "").trim();
    if (!invoiceId) return balasJson("error", null, "Invoice ID wajib diisi.");
    const pembuatWa = normalisasiNomorWa_(
      order.dibuatOlehWa || order.adminWa || order.nomorAdmin || "",
    );
    if (pembuatWa) {
      const akunBot = botAmbilAkunByWa_(pembuatWa, apiKey);
      if (!akunBot.ok)
        return balasJson("error", akunBot.data || null, akunBot.pesan);
      if (!roleBolehJenisKeuangan(akunBot.account.role, "Bisnis"))
        return balasJson(
          "error",
          null,
          "Akun nomor pembuat order tidak punya akses Bisnis.",
        );
      spreadsheetId = akunBot.account.spreadsheetId;
      order.moneytrackUsername = akunBot.account.username;
      order.moneytrackRole = akunBot.account.role;
    }

    pastikanHeaderTransaksi(spreadsheetId);
    const trxSheet = getSheet(spreadsheetId, NAMA_TAB.TRANSAKSI);
    const paySheet = pastikanHeaderPembayaran(spreadsheetId);
    if (!trxSheet || !paySheet)
      return balasJson("error", null, "Sheet transaksi/pembayaran tidak ditemukan.");

    const now = new Date().toISOString();
    const items = order.items || order.itemList || [];
    const total = mtAngka_(order.total || order.jumlah || order.nominal || 0);
    const subtotal = mtAngka_(order.subtotal || total);
    const diskon = mtAngka_(order.diskon || 0);
    const metode = String(order.metodePembayaran || order.metode || "QRIS").trim();
    const status = statusPembayaranBot_(order.status || "Menunggu Pembayaran");
    const pelangganId = cariAtauBuatPelangganBot_(spreadsheetId, order);
    const nomorWa = normalisasiNomorWa_(order.nomorWa || order.nomor || order.wa);
    const namaUser = String(order.namaUser || order.nama || nomorWa || "Pelanggan WA").trim();
    const tanggal =
      order.tanggal ||
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    const akunTujuan = String(order.akunTujuan || order.akun || metode || "QRIS").trim();
    const kategori = String(order.kategori || "Penjualan NenelCraft").trim();
    const ringkasanItem = ringkasanItemBot_(items);
    const keterangan =
      "Invoice " +
      invoiceId +
      (ringkasanItem ? " - " + ringkasanItem : "") +
      (diskon > 0 ? " - Diskon " + diskon : "");

    let trxRow = cariRowSheet_(trxSheet, "Invoice ID", invoiceId);
    const transaksiId = trxRow
      ? trxRow.obj["ID"]
      : String(order.transaksiId || invoiceId).trim();
    const saldoDiproses = trxRow
      ? trxRow.obj["Saldo Diproses"] || "Tidak"
      : status === "Lunas"
        ? "Tidak"
        : "Tidak";

    const trxObj = {
      ID: transaksiId,
      Tanggal: tanggal,
      "Jenis Keuangan": "Bisnis",
      "Tipe Transaksi": "",
      "Tipe Pembayaran": "Pembayaran Masuk",
      Kategori: kategori,
      "Akun Asal": "",
      "Akun Tujuan": akunTujuan,
      Nominal: total,
      Keterangan: keterangan,
      Pelanggan: pelangganId || namaUser,
      Status: status,
      "Sumber Input": "Bot WA",
      "Invoice ID": invoiceId,
      "Nomor WA": nomorWa,
      "Detail Item": detailItemBot_(items),
      "Metode Pembayaran": metode,
      "Saldo Diproses": saldoDiproses,
      "Created At": trxRow ? trxRow.obj["Created At"] || now : now,
      "Updated At": now,
    };

    if (trxRow) {
      setObjekKeSheetRow_(trxSheet, trxRow.rowNumber, trxObj);
    } else {
      appendObjekKeSheet(trxSheet, trxObj);
      trxRow = cariRowSheet_(trxSheet, "Invoice ID", invoiceId);
    }

    let payRow = cariRowSheet_(paySheet, "Invoice ID", invoiceId);
    const pembayaranId = payRow
      ? payRow.obj["ID"]
      : String(order.pembayaranId || generateId()).trim();
    const payObj = {
      ID: pembayaranId,
      "Transaksi ID": transaksiId,
      "Pelanggan ID": pelangganId || namaUser,
      Jumlah: total,
      Metode: metode,
      "Bukti URL": order.buktiUrl || "",
      Status: status,
      Catatan:
        order.catatan ||
        ("Subtotal " + subtotal + (diskon > 0 ? ", diskon " + diskon : "")),
      "Invoice ID": invoiceId,
      "Nomor WA": nomorWa,
      "Detail Item": detailItemBot_(items),
      "Sumber Input": "Bot WA",
      "Updated At": now,
      "Created At": payRow ? payRow.obj["Created At"] || now : now,
    };

    if (payRow) setObjekKeSheetRow_(paySheet, payRow.rowNumber, payObj);
    else appendObjekKeSheet(paySheet, payObj);

    if (status === "Lunas" && trxRow) {
      prosesSaldoBotJikaPerlu_(spreadsheetId, trxSheet, trxRow, trxObj);
    }

    tambahBotLog(spreadsheetId, "ORDER", "Order bot tersinkron", {
      invoiceId: invoiceId,
      nomorWa: nomorWa,
      total: total,
      metode: metode,
      status: status,
    });
    mtHapusCacheDashboard_(spreadsheetId);
    return balasJson(
      "success",
      { transaksiId: transaksiId, pembayaranId: pembayaranId, pelangganId: pelangganId },
      "Order bot berhasil disinkronkan.",
    );
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function botKonfirmasiPembayaran(spreadsheetId, data, apiKey) {
  try {
    wajibBotApiKey_(apiKey);
    data = data || {};
    const invoiceId = String(data.invoiceId || data.ticketId || "").trim();
    if (!invoiceId)
      return balasJson("error", null, "Invoice atau ticket ID wajib diisi.");
    const pembuatWa = normalisasiNomorWa_(
      data.dibuatOlehWa || data.adminWa || data.nomorAdmin || "",
    );
    if (pembuatWa) {
      const akunBot = botAmbilAkunByWa_(pembuatWa, apiKey);
      if (!akunBot.ok)
        return balasJson("error", akunBot.data || null, akunBot.pesan);
      if (!roleBolehJenisKeuangan(akunBot.account.role, "Bisnis"))
        return balasJson(
          "error",
          null,
          "Akun nomor pembuat order tidak punya akses Bisnis.",
        );
      spreadsheetId = akunBot.account.spreadsheetId;
      data.moneytrackUsername = akunBot.account.username;
      data.moneytrackRole = akunBot.account.role;
    }

    const paySheet = pastikanHeaderPembayaran(spreadsheetId);
    if (!paySheet) return balasJson("error", null, "Sheet PEMBAYARAN tidak ditemukan.");
    const trxSheet = getSheet(spreadsheetId, NAMA_TAB.TRANSAKSI);
    const now = new Date().toISOString();
    const nomorWa = normalisasiNomorWa_(data.nomorWa || data.nomor || "");
    const pelangganId = cariAtauBuatPelangganBot_(spreadsheetId, data);
    const total = mtAngka_(data.total || data.jumlah || data.nominal || 0);
    const metode = String(data.metodePembayaran || data.metode || "Manual").trim();
    const status = "Menunggu Verifikasi";
    const items = data.items || [];
    const trxRow = trxSheet ? cariRowSheet_(trxSheet, "Invoice ID", invoiceId) : null;

    if (trxRow) {
      setObjekKeSheetRow_(trxSheet, trxRow.rowNumber, {
        Status: status,
        "Updated At": now,
      });
    }

    let payRow = cariRowSheet_(paySheet, "Invoice ID", invoiceId);
    const pembayaranId = payRow
      ? payRow.obj["ID"]
      : String(data.pembayaranId || generateId()).trim();
    const payObj = {
      ID: pembayaranId,
      "Transaksi ID": trxRow ? trxRow.obj["ID"] : data.transaksiId || "",
      "Pelanggan ID": pelangganId || data.namaUser || "",
      Jumlah: total,
      Metode: metode,
      "Bukti URL": data.buktiUrl || "",
      Status: status,
      Catatan: data.catatan || "Konfirmasi pembayaran dari bot WA",
      "Invoice ID": invoiceId,
      "Nomor WA": nomorWa,
      "Detail Item": detailItemBot_(items),
      "Sumber Input": "Bot WA",
      "Updated At": now,
      "Created At": payRow ? payRow.obj["Created At"] || now : now,
    };

    if (payRow) setObjekKeSheetRow_(paySheet, payRow.rowNumber, payObj);
    else appendObjekKeSheet(paySheet, payObj);

    tambahBotLog(spreadsheetId, "PAYMENT", "Konfirmasi bayar masuk dari bot", {
      invoiceId: invoiceId,
      nomorWa: nomorWa,
      total: total,
      metode: metode,
    });
    mtHapusCacheDashboard_(spreadsheetId);
    return balasJson(
      "success",
      { pembayaranId: pembayaranId, invoiceId: invoiceId },
      "Konfirmasi pembayaran berhasil disinkronkan.",
    );
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function botUpdateOrderStatus(spreadsheetId, invoiceId, status, alasan, apiKey, pembuatWa) {
  try {
    wajibBotApiKey_(apiKey);
    pembuatWa = normalisasiNomorWa_(pembuatWa || "");
    if (pembuatWa) {
      const akunBot = botAmbilAkunByWa_(pembuatWa, apiKey);
      if (!akunBot.ok)
        return balasJson("error", akunBot.data || null, akunBot.pesan);
      if (!roleBolehJenisKeuangan(akunBot.account.role, "Bisnis"))
        return balasJson(
          "error",
          null,
          "Akun nomor pembuat order tidak punya akses Bisnis.",
        );
      spreadsheetId = akunBot.account.spreadsheetId;
    }
    return updateOrderStatusBotInternal_(
      spreadsheetId,
      invoiceId,
      status,
      alasan || "",
    );
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function botTambahLog(spreadsheetId, tipe, pesan, dataLog, apiKey) {
  try {
    wajibBotApiKey_(apiKey);
    tambahBotLog(spreadsheetId, tipe || "INFO", pesan || "", dataLog || {});
    return balasJson("success", null, "Log bot berhasil disimpan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function updateOrderStatusBotInternal_(spreadsheetId, invoiceId, status, alasan) {
  const statusBaru = statusPembayaranBot_(status);
  if (
    [
      "Menunggu Pembayaran",
      "Menunggu Verifikasi",
      "Lunas",
      "Ditolak",
      "Batal",
    ].indexOf(statusBaru) === -1
  ) {
    return balasJson("error", null, "Status tidak valid.");
  }

  const now = new Date().toISOString();
  const paySheet = pastikanHeaderPembayaran(spreadsheetId);
  const trxSheet = getSheet(spreadsheetId, NAMA_TAB.TRANSAKSI);
  let payRow = paySheet ? cariRowSheet_(paySheet, "Invoice ID", invoiceId) : null;
  if (!payRow && paySheet) payRow = cariRowSheet_(paySheet, "ID", invoiceId);
  let trxRow = trxSheet ? cariRowSheet_(trxSheet, "Invoice ID", invoiceId) : null;
  if (!trxRow && trxSheet) trxRow = cariRowSheet_(trxSheet, "ID", invoiceId);

  if (!payRow && !trxRow)
    return balasJson("error", null, "Invoice/pembayaran tidak ditemukan.");

  const invoiceFinal =
    (payRow && payRow.obj["Invoice ID"]) ||
    (trxRow && trxRow.obj["Invoice ID"]) ||
    invoiceId;

  if (payRow) {
    setObjekKeSheetRow_(paySheet, payRow.rowNumber, {
      Status: statusBaru,
      Catatan: alasan
        ? (payRow.obj["Catatan"] || "") + " | Alasan: " + alasan
        : payRow.obj["Catatan"] || "",
      "Updated At": now,
    });
  }

  if (trxRow) {
    const trxObj = trxRow.obj;
    trxObj.Status = statusBaru;
    trxObj["Updated At"] = now;
    setObjekKeSheetRow_(trxSheet, trxRow.rowNumber, {
      Status: statusBaru,
      "Updated At": now,
    });
    if (statusBaru === "Lunas") {
      prosesSaldoBotJikaPerlu_(spreadsheetId, trxSheet, trxRow, trxObj);
    }
  }

  tambahBotLog(spreadsheetId, "VERIFY", "Status order bot diperbarui", {
    invoiceId: invoiceFinal,
    status: statusBaru,
    alasan: alasan || "",
  });
  mtHapusCacheDashboard_(spreadsheetId);
  return balasJson(
    "success",
    { invoiceId: invoiceFinal, status: statusBaru },
    "Status order/pembayaran berhasil diperbarui.",
  );
}

function prosesSaldoBotJikaPerlu_(spreadsheetId, trxSheet, trxRow, trxObj) {
  if (!trxRow || !trxObj) return;
  const sudah = String(trxRow.obj["Saldo Diproses"] || "").trim().toLowerCase();
  if (sudah === "ya" || sudah === "true" || sudah === "1") return;
  const nominal = mtAngka_(trxObj["Nominal"] || 0);
  if (nominal <= 0) return;
  prosesSaldoTransaksiBaru(spreadsheetId, {
    jenisKeuangan: "Bisnis",
    tipePembayaran: trxObj["Tipe Pembayaran"] || "Pembayaran Masuk",
    akunAsal: trxObj["Akun Asal"] || "",
    akunTujuan: trxObj["Akun Tujuan"] || "",
    nominal: nominal,
  });
  setObjekKeSheetRow_(trxSheet, trxRow.rowNumber, {
    "Saldo Diproses": "Ya",
    "Updated At": new Date().toISOString(),
  });
}

// ============================================================
// PENGATURAN
// ============================================================

function getPengaturan(spreadsheetId) {
  try {
    const data = ambilDataSebagaiObjek(spreadsheetId, NAMA_TAB.PENGATURAN);
    const obj = {};
    data.forEach(function (d) {
      obj[d["Key"]] = d["Value"];
    });
    return balasJson("success", obj);
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function simpanPengaturan(spreadsheetId, key, value) {
  try {
    const sheet = getSheet(spreadsheetId, NAMA_TAB.PENGATURAN);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const keyIdx = headers.indexOf("Key");
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][keyIdx] === key) {
        sheet.getRange(i + 1, headers.indexOf("Value") + 1).setValue(value);
        sheet
          .getRange(i + 1, headers.indexOf("Updated At") + 1)
          .setValue(new Date().toISOString());
        return balasJson("success", null, "Pengaturan disimpan.");
      }
    }
    sheet.appendRow([key, value, new Date().toISOString()]);
    return balasJson("success", null, "Pengaturan disimpan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

// ============================================================
// LAPORAN
// ============================================================

function getLaporan(spreadsheetId, bulan, tahun, role) {
  try {
    let transaksi = ambilDataSebagaiObjek(spreadsheetId, NAMA_TAB.TRANSAKSI);
    transaksi = filterTransaksiByRole(transaksi, role || "UserPribadi");
    const filtered = transaksi.filter(function (t) {
      const d = new Date(t["Tanggal"]);
      return (
        !isNaN(d) &&
        (!bulan || d.getMonth() + 1 == parseInt(bulan)) &&
        (!tahun || d.getFullYear() == parseInt(tahun))
      );
    });
    const totalPemasukan = filtered
      .filter(function (t) {
        return ambilJenisLaporanUniversal(t) === "Pemasukan";
      })
      .reduce(function (sum, t) {
        return sum + ambilNominalUniversal(t);
      }, 0);
    const totalPengeluaran = filtered
      .filter(function (t) {
        return ambilJenisLaporanUniversal(t) === "Pengeluaran";
      })
      .reduce(function (sum, t) {
        return sum + ambilNominalUniversal(t);
      }, 0);
    const perKategori = {},
      perHari = {};
    filtered.forEach(function (t) {
      const jenis = ambilJenisLaporanUniversal(t);
      const nominal = ambilNominalUniversal(t);
      const kategori = ambilKategoriUniversal(t);
      const tanggalKey = ambilTanggalKey(t);
      if (!jenis || jenis === "Transfer") return;
      const keyKategori = kategori + "|" + jenis;
      if (!perKategori[keyKategori])
        perKategori[keyKategori] = { nama: kategori, jenis: jenis, total: 0 };
      perKategori[keyKategori].total += nominal;
      if (tanggalKey) {
        if (!perHari[tanggalKey])
          perHari[tanggalKey] = {
            tanggal: tanggalKey,
            pemasukan: 0,
            pengeluaran: 0,
          };
        if (jenis === "Pemasukan") perHari[tanggalKey].pemasukan += nominal;
        if (jenis === "Pengeluaran") perHari[tanggalKey].pengeluaran += nominal;
      }
    });
    return balasJson("success", {
      totalPemasukan,
      totalPengeluaran,
      sisaBersih: totalPemasukan - totalPengeluaran,
      jumlahTransaksi: filtered.length,
      perKategori: Object.values(perKategori),
      perHari: Object.values(perHari).sort(function (a, b) {
        return a.tanggal.localeCompare(b.tanggal);
      }),
      detail: filtered,
    });
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

// ============================================================
// KELOLA USER (Admin only)
// ============================================================

function getDaftarUser() {
  try {
    pastikanHeaderMasterUser_();
    const users = ambilDataMasterSebagaiObjek(NAMA_TAB_MASTER.USERS);
    const safe = users.map(function (u) {
      return {
        id: u["ID"],
        nama: u["Nama"],
        username: u["Username"],
        spreadsheetId: u["Spreadsheet ID"],
        role: u["Role"],
        status: u["Status"],
        tema: u["Tema"],
        warna: u["Warna"],
        noWa: normalisasiNomorWa_(u["No WA"] || u["Nomor WA"] || u["No HP"] || ""),
        fotoProfil: u["Foto Profil"] || "",
        mulaLangganan: u["Mulai Langganan"] || "",
        berakhirLangganan: u["Berakhir Langganan"] || "",
        tipeLangganan: u["Tipe Langganan"] || "",
        statusLangganan: u["Status Langganan"] || "",
        graceSampai: u["Grace Sampai"] || "",
        modeAkses: u["Mode Akses"] || "Normal",
        catatanLangganan: u["Catatan Langganan"] || "",
        createdAt: u["Created At"],
      };
    });
    return balasJson("success", safe);
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function tambahUser(data) {
  try {
    if (!data.nama || !data.username || !data.password || !data.spreadsheetId)
      return balasJson("error", null, "Data tidak lengkap.");
    const sheet = pastikanHeaderMasterUser_();
    const users = ambilDataMasterSebagaiObjek(NAMA_TAB_MASTER.USERS);
    if (
      users.find(function (u) {
        return u["Username"] === data.username;
      })
    )
      return balasJson("error", null, "Username sudah digunakan.");
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const id = generateId();
    appendObjekKeSheet(sheet, {
      ID: id,
      Nama: data.nama,
      Username: data.username,
      Password: data.password,
      "Spreadsheet ID": data.spreadsheetId,
      Role: data.role || "UserPribadi",
      Status: "Aktif",
      Tema: data.tema || "dark",
      Warna: data.warna || "#00ff99",
      "No WA": normalisasiNomorWa_(data.noWa || data.nomorWa || ""),
      "Created At": new Date().toISOString(),
    });
    setupSpreadsheetUser(data.spreadsheetId);
    return balasJson("success", { id: id }, "User berhasil ditambahkan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function editUser(id, data) {
  try {
    const sheet = pastikanHeaderMasterUser_();
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const idIdx = headers.indexOf("ID");
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idIdx] === id) {
        if (data.nama)
          sheet
            .getRange(i + 1, headers.indexOf("Nama") + 1)
            .setValue(data.nama);
        if (data.password)
          sheet
            .getRange(i + 1, headers.indexOf("Password") + 1)
            .setValue(data.password);
        if (data.spreadsheetId)
          sheet
            .getRange(i + 1, headers.indexOf("Spreadsheet ID") + 1)
            .setValue(data.spreadsheetId);
        if (data.role)
          sheet
            .getRange(i + 1, headers.indexOf("Role") + 1)
            .setValue(data.role);
        if (data.status)
          sheet
            .getRange(i + 1, headers.indexOf("Status") + 1)
            .setValue(data.status);
        if (data.tema)
          sheet
            .getRange(i + 1, headers.indexOf("Tema") + 1)
            .setValue(data.tema);
        if (data.warna)
          sheet
            .getRange(i + 1, headers.indexOf("Warna") + 1)
            .setValue(data.warna);
        if (data.noWa !== undefined || data.nomorWa !== undefined)
          sheet
            .getRange(i + 1, headers.indexOf("No WA") + 1)
            .setValue(normalisasiNomorWa_(data.noWa || data.nomorWa || ""));
        return balasJson("success", null, "User berhasil diubah.");
      }
    }
    return balasJson("error", null, "User tidak ditemukan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function nonaktifkanUser(id) {
  return editUser(id, { status: "Nonaktif" });
}

function updateProfilUser(username, data) {
  try {
    const sheet = pastikanHeaderMasterUser_();
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const usernameIdx = headers.indexOf("Username");
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][usernameIdx] === username) {
        if (data.nama)
          sheet
            .getRange(i + 1, headers.indexOf("Nama") + 1)
            .setValue(data.nama);
        if (data.tema)
          sheet
            .getRange(i + 1, headers.indexOf("Tema") + 1)
            .setValue(data.tema);
        if (data.warna)
          sheet
            .getRange(i + 1, headers.indexOf("Warna") + 1)
            .setValue(data.warna);
        if (data.passwordBaru && data.passwordBaru.length >= 3)
          sheet
            .getRange(i + 1, headers.indexOf("Password") + 1)
            .setValue(data.passwordBaru);
        if (data.noWa !== undefined || data.nomorWa !== undefined)
          sheet
            .getRange(i + 1, headers.indexOf("No WA") + 1)
            .setValue(normalisasiNomorWa_(data.noWa || data.nomorWa || ""));
        return balasJson("success", null, "Profil berhasil diperbarui.");
      }
    }
    return balasJson("error", null, "User tidak ditemukan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function pastikanKolomMasterUser(namaKolom) {
  const ss = SpreadsheetApp.openById(ID_MASTER_USERS);
  const sheet = ss.getSheetByName(NAMA_TAB_MASTER.USERS);
  if (!sheet) throw new Error("Sheet master user tidak ditemukan.");
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let idx = headers.indexOf(namaKolom);
  if (idx === -1) {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue(namaKolom);
    idx = sheet.getLastColumn() - 1;
  }
  return {
    sheet,
    headers: sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0],
    index: idx,
  };
}

function uploadFotoProfil(username, fileName, mimeType, base64Data) {
  try {
    if (!username) return balasJson("error", null, "Username kosong.");
    if (!base64Data) return balasJson("error", null, "Data foto kosong.");
    const folderName = "Money Tracking Profile Photos";
    let folders = DriveApp.getFoldersByName(folderName);
    let folder = folders.hasNext()
      ? folders.next()
      : DriveApp.createFolder(folderName);
    base64Data = String(base64Data || "").trim();
    if (base64Data.indexOf(",") !== -1) base64Data = base64Data.split(",")[1];
    if (!base64Data)
      return balasJson(
        "error",
        null,
        "Data foto kosong atau format base64 tidak valid.",
      );
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(
      bytes,
      mimeType || "image/jpeg",
      fileName || "profile_" + username + ".jpg",
    );
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileId = file.getId();
    const fotoUrl =
      "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w96";
    const dataKolom = pastikanKolomMasterUser("Foto Profil");
    const sheet = dataKolom.sheet;
    const headers = dataKolom.headers;
    const usernameIdx = headers.indexOf("Username");
    const fotoIdx = headers.indexOf("Foto Profil");
    if (usernameIdx === -1)
      return balasJson(
        "error",
        null,
        "Kolom Username tidak ditemukan di USERS2.",
      );
    if (fotoIdx === -1)
      return balasJson("error", null, "Kolom Foto Profil tidak ditemukan.");
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (
        String(rows[i][usernameIdx] || "")
          .trim()
          .toLowerCase() === String(username).trim().toLowerCase()
      ) {
        sheet.getRange(i + 1, fotoIdx + 1).setValue(fotoUrl);
        return balasJson(
          "success",
          { fotoProfil: fotoUrl, fileId },
          "Foto profil berhasil diperbarui.",
        );
      }
    }
    return balasJson("error", null, "User tidak ditemukan.");
  } catch (e) {
    return balasJson("error", null, "Gagal upload foto profil: " + e.message);
  }
}

// ============================================================
// DASHBOARD CHART PERIODE
// ============================================================
function parseTanggalDashboardChart(value) {
  if (!value) return null;

  if (
    Object.prototype.toString.call(value) === "[object Date]" &&
    !isNaN(value)
  ) {
    return value;
  }

  var d = new Date(value);
  if (!isNaN(d)) return d;

  return null;
}

function formatKeyTanggalDashboard(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function formatKeyBulanDashboard(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM");
}

function formatLabelBulanDashboard(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "MMM yyyy");
}

function tambahBulanDashboard(d, jumlah) {
  var x = new Date(d);
  x.setMonth(x.getMonth() + jumlah);
  return x;
}

function buatChartDashboardPeriode(transaksi, periode) {
  periode = periode || "7hari";
  transaksi = transaksi || [];

  var now = new Date();
  var dataMap = {};
  var hasil = [];

  function buatItem(label) {
    return {
      label: label,
      pemasukan: 0,
      pengeluaran: 0,
    };
  }

  function tambahData(key, label) {
    if (!dataMap[key]) {
      dataMap[key] = buatItem(label);
      hasil.push(dataMap[key]);
    }
    return dataMap[key];
  }

  function isiNominal(item, t) {
    var jenisLaporan = ambilJenisLaporanUniversal(t);
    var nominal = ambilNominalUniversal(t);

    if (jenisLaporan === "Pemasukan") {
      item.pemasukan += nominal;
    }

    if (jenisLaporan === "Pengeluaran") {
      item.pengeluaran += nominal;
    }
  }

  // 7 hari terakhir, per hari
  if (periode === "7hari") {
    var mulai7 = new Date(now);
    mulai7.setDate(mulai7.getDate() - 6);
    mulai7.setHours(0, 0, 0, 0);

    for (var i = 0; i < 7; i++) {
      var d7 = new Date(mulai7);
      d7.setDate(mulai7.getDate() + i);

      var key7 = formatKeyTanggalDashboard(d7);
      var label7 = d7.toLocaleDateString("id-ID", {
        weekday: "short",
      });

      tambahData(key7, label7);
    }

    transaksi.forEach(function (t) {
      var tg = parseTanggalDashboardChart(t["Tanggal"]);
      if (!tg) return;

      tg.setHours(0, 0, 0, 0);
      if (tg < mulai7) return;

      var key = formatKeyTanggalDashboard(tg);
      if (!dataMap[key]) return;

      isiNominal(dataMap[key], t);
    });

    return hasil;
  }

  // 1 bulan terakhir, per hari
  if (periode === "1bln") {
    var mulai30 = new Date(now);
    mulai30.setDate(mulai30.getDate() - 29);
    mulai30.setHours(0, 0, 0, 0);

    for (var j = 0; j < 30; j++) {
      var d30 = new Date(mulai30);
      d30.setDate(mulai30.getDate() + j);

      var key30 = formatKeyTanggalDashboard(d30);
      var label30 = Utilities.formatDate(
        d30,
        Session.getScriptTimeZone(),
        "dd/MM",
      );

      tambahData(key30, label30);
    }

    transaksi.forEach(function (t) {
      var tg = parseTanggalDashboardChart(t["Tanggal"]);
      if (!tg) return;

      tg.setHours(0, 0, 0, 0);
      if (tg < mulai30) return;

      var key = formatKeyTanggalDashboard(tg);
      if (!dataMap[key]) return;

      isiNominal(dataMap[key], t);
    });

    return hasil;
  }

  // 6 bulan terakhir, per bulan
  if (periode === "6bln") {
    var base6 = new Date(now.getFullYear(), now.getMonth(), 1);
    base6 = tambahBulanDashboard(base6, -5);

    for (var k = 0; k < 6; k++) {
      var d6 = tambahBulanDashboard(base6, k);
      var key6 = formatKeyBulanDashboard(d6);
      var label6 = formatLabelBulanDashboard(d6);

      tambahData(key6, label6);
    }

    transaksi.forEach(function (t) {
      var tg = parseTanggalDashboardChart(t["Tanggal"]);
      if (!tg) return;

      var key = formatKeyBulanDashboard(tg);
      if (!dataMap[key]) return;

      isiNominal(dataMap[key], t);
    });

    return hasil;
  }

  // 1 tahun terakhir, per bulan
  if (periode === "1thn") {
    var base12 = new Date(now.getFullYear(), now.getMonth(), 1);
    base12 = tambahBulanDashboard(base12, -11);

    for (var m = 0; m < 12; m++) {
      var d12 = tambahBulanDashboard(base12, m);
      var key12 = formatKeyBulanDashboard(d12);
      var label12 = formatLabelBulanDashboard(d12);

      tambahData(key12, label12);
    }

    transaksi.forEach(function (t) {
      var tg = parseTanggalDashboardChart(t["Tanggal"]);
      if (!tg) return;

      var key = formatKeyBulanDashboard(tg);
      if (!dataMap[key]) return;

      isiNominal(dataMap[key], t);
    });

    return hasil;
  }

  // Semua tahun dari transaksi paling awal sampai terakhir, per tahun
  if (periode === "semua") {
    var tahunList = [];

    transaksi.forEach(function (t) {
      var tg = parseTanggalDashboardChart(t["Tanggal"]);
      if (!tg) return;

      var tahun = tg.getFullYear();
      if (tahunList.indexOf(tahun) === -1) {
        tahunList.push(tahun);
      }
    });

    tahunList.sort(function (a, b) {
      return a - b;
    });

    if (!tahunList.length) {
      var tahunNow = now.getFullYear();
      tahunList = [tahunNow];
    }

    tahunList.forEach(function (tahun) {
      tambahData(String(tahun), String(tahun));
    });

    transaksi.forEach(function (t) {
      var tg = parseTanggalDashboardChart(t["Tanggal"]);
      if (!tg) return;

      var key = String(tg.getFullYear());
      if (!dataMap[key]) return;

      isiNominal(dataMap[key], t);
    });

    return hasil;
  }

  return buatChartDashboardPeriode(transaksi, "7hari");
}

// ============================================================
// DASHBOARD TREND BUCKET HELPER
// Biar chart trend tetap lengkap walau tanggal kosong.
// ============================================================

function mtPad2_(n) {
  return String(n).padStart(2, "0");
}

function mtAwalHari_(date) {
  var d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function mtTrendKeyLabel_(date, periode) {
  var tz = Session.getScriptTimeZone();
  var d = new Date(date);

  if (periode === "7hari" || periode === "1bln") {
    return {
      key: Utilities.formatDate(d, tz, "yyyy-MM-dd"),
      label: Utilities.formatDate(d, tz, "dd/MM"),
    };
  }

  if (periode === "6bln" || periode === "1thn") {
    return {
      key: Utilities.formatDate(d, tz, "yyyy-MM"),
      label: Utilities.formatDate(d, tz, "MMM yyyy"),
    };
  }

  return {
    key: Utilities.formatDate(d, tz, "yyyy"),
    label: Utilities.formatDate(d, tz, "yyyy"),
  };
}

function mtBuatBucketTrendDashboard_(periode, minDate, maxDate) {
  periode = periode || "7hari";

  var now = mtAwalHari_(new Date());
  var buckets = [];

  if (periode === "7hari") {
    var start7 = new Date(now);
    start7.setDate(start7.getDate() - 6);

    for (var i = 0; i < 7; i++) {
      var d7 = new Date(start7);
      d7.setDate(start7.getDate() + i);
      buckets.push(mtTrendKeyLabel_(d7, periode));
    }

    return buckets;
  }

  if (periode === "1bln") {
    var start30 = new Date(now);
    start30.setDate(start30.getDate() - 29);

    for (var j = 0; j < 30; j++) {
      var d30 = new Date(start30);
      d30.setDate(start30.getDate() + j);
      buckets.push(mtTrendKeyLabel_(d30, periode));
    }

    return buckets;
  }

  if (periode === "6bln") {
    var start6 = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    for (var k = 0; k < 6; k++) {
      var m6 = new Date(start6.getFullYear(), start6.getMonth() + k, 1);
      buckets.push(mtTrendKeyLabel_(m6, periode));
    }

    return buckets;
  }

  if (periode === "1thn") {
    var start12 = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    for (var l = 0; l < 12; l++) {
      var m12 = new Date(start12.getFullYear(), start12.getMonth() + l, 1);
      buckets.push(mtTrendKeyLabel_(m12, periode));
    }

    return buckets;
  }

  // Semua tahun
  var startYear = minDate ? new Date(minDate).getFullYear() : now.getFullYear();
  var endYear = maxDate ? new Date(maxDate).getFullYear() : now.getFullYear();

  if (startYear > endYear) {
    startYear = now.getFullYear();
    endYear = now.getFullYear();
  }

  for (var y = startYear; y <= endYear; y++) {
    buckets.push({
      key: String(y),
      label: String(y),
    });
  }

  return buckets;
}
// ============================================================
// DASHBOARD CEPAT + CACHE
// Dipanggil frontend:
// getDashboard(spreadsheetId, role, periode)
// ============================================================

function getDashboard(spreadsheetId, role, periode) {
  try {
    role = role || "UserPribadi";
    periode = periode || "7hari";

    var cache = CacheService.getScriptCache();
    var cacheKey = mtCacheKeyDashboard_(spreadsheetId, role, periode);
    var cached = cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    var transaksi =
      ambilDataSebagaiObjek(spreadsheetId, NAMA_TAB.TRANSAKSI) || [];
    var akun = ambilDataSebagaiObjek(spreadsheetId, NAMA_TAB.AKUN) || [];

    var awalPeriode = mtTanggalAwalPeriode_(periode);

    var totalSaldo = 0;
    var akunAktif = [];

    akun.forEach(function (a) {
      var namaAkun = a["Nama Akun"] || a["Akun"] || a["Nama"] || "-";
      var status = String(a["Status"] || "Aktif").trim();
      var saldo = mtAngka_(a["Saldo Sekarang"] || a["Saldo"] || 0);

      if (status.toLowerCase() !== "nonaktif") {
        totalSaldo += saldo;
        akunAktif.push({
          nama: namaAkun,
          total: saldo,
          warna: a["Warna"] || "",
        });
      }
    });

    var totalPemasukanPeriode = 0;
    var totalPengeluaranPeriode = 0;
    var jumlahTransaksiPeriode = 0;

    var chartTrendMap = {};
    var minTanggalTrend = null;
    var maxTanggalTrend = null;
    var chartPribadiBisnisMap = {
      Pribadi: { pemasukan: 0, pengeluaran: 0 },
      Bisnis: { pemasukan: 0, pengeluaran: 0 },
    };

    var kategoriPengeluaranMap = {};
    var kategoriPemasukanMap = {};

    var transaksiTerbaru = [];

    transaksi.forEach(function (trx) {
      if (!mtBolehUntukRole_(trx, role)) return;

      var tgl = mtTanggal_(trx["Tanggal"]);
      if (!tgl) return;

      var nominal = mtNominalTransaksi_(trx);
      var jenisKeuangan = mtJenisKeuangan_(trx) || "Pribadi";
      var tipe = mtTipeTransaksi_(trx);
      var kategori = trx["Kategori"] || "Lainnya";

      var isPemasukan = mtIsPemasukan_(trx);
      var isPengeluaran = mtIsPengeluaran_(trx);

      var masukPeriode = true;

      if (awalPeriode) {
        masukPeriode = tgl >= awalPeriode;
      }

      if (masukPeriode) {
        jumlahTransaksiPeriode++;

        if (isPemasukan) {
          totalPemasukanPeriode += nominal;

          if (!kategoriPemasukanMap[kategori]) {
            kategoriPemasukanMap[kategori] = 0;
          }

          kategoriPemasukanMap[kategori] += nominal;
        }

        if (isPengeluaran) {
          totalPengeluaranPeriode += nominal;

          if (!kategoriPengeluaranMap[kategori]) {
            kategoriPengeluaranMap[kategori] = 0;
          }

          kategoriPengeluaranMap[kategori] += nominal;
        }

        var bucket = mtTrendKeyLabel_(tgl, periode);

        if (!chartTrendMap[bucket.key]) {
          chartTrendMap[bucket.key] = {
            key: bucket.key,
            label: bucket.label,
            pemasukan: 0,
            pengeluaran: 0,
          };
        }

        if (isPemasukan) {
          chartTrendMap[bucket.key].pemasukan += nominal;
        }

        if (isPengeluaran) {
          chartTrendMap[bucket.key].pengeluaran += nominal;
        }

        if (!minTanggalTrend || tgl < minTanggalTrend) minTanggalTrend = tgl;
        if (!maxTanggalTrend || tgl > maxTanggalTrend) maxTanggalTrend = tgl;

        if (!chartPribadiBisnisMap[jenisKeuangan]) {
          chartPribadiBisnisMap[jenisKeuangan] = {
            pemasukan: 0,
            pengeluaran: 0,
          };
        }

        if (isPemasukan)
          chartPribadiBisnisMap[jenisKeuangan].pemasukan += nominal;
        if (isPengeluaran)
          chartPribadiBisnisMap[jenisKeuangan].pengeluaran += nominal;
        transaksiTerbaru.push({
          ID: trx["ID"] || trx["ID Transaksi"] || "",
          Tanggal: trx["Tanggal"],
          "Jenis Keuangan": jenisKeuangan,
          "Tipe Transaksi": tipe,
          "Tipe Pembayaran": trx["Tipe Pembayaran"] || "",
          Kategori: kategori,
          Akun: mtAkunTransaksi_(trx),
          Nominal: nominal,
          Keterangan: trx["Keterangan"] || "",
          Status: trx["Status"] || "",
        });
      }
    });

    transaksiTerbaru.sort(function (a, b) {
      return new Date(b["Tanggal"]) - new Date(a["Tanggal"]);
    });

    transaksiTerbaru = transaksiTerbaru.slice(0, 10);

    var bucketLengkap = mtBuatBucketTrendDashboard_(
      periode,
      minTanggalTrend,
      maxTanggalTrend,
    );

    var chartTrend = bucketLengkap.map(function (bucket) {
      var isi = chartTrendMap[bucket.key] || {};

      return {
        key: bucket.key,
        label: bucket.label,
        pemasukan: isi.pemasukan || 0,
        pengeluaran: isi.pengeluaran || 0,
      };
    });

    var chartPribadiBisnis = Object.keys(chartPribadiBisnisMap).map(
      function (nama) {
        return {
          nama: nama,
          pemasukan: chartPribadiBisnisMap[nama].pemasukan || 0,
          pengeluaran: chartPribadiBisnisMap[nama].pengeluaran || 0,
        };
      },
    );

    var hasil = {
      totalSaldo: totalSaldo,
      pemasukan: totalPemasukanPeriode,
      pengeluaran: totalPengeluaranPeriode,
      pemasukanBulan: totalPemasukanPeriode,
      pengeluaranBulan: totalPengeluaranPeriode,
      sisaBersih: totalPemasukanPeriode - totalPengeluaranPeriode,
      jumlahAkun: akunAktif.length,
      jumlahTransaksi: jumlahTransaksiPeriode,
      jumlahTransaksiBulanIni: jumlahTransaksiPeriode,

      // Nama tetap chart7Hari supaya frontend lama tidak pingsan.
      // Isinya mengikuti periode: 7hari / 1bln / 6bln / 1thn / semua.
      chart7Hari: chartTrend,

      chartPribadiBisnis: chartPribadiBisnis,
      chartKategoriPengeluaran: mtMapKeArray_(kategoriPengeluaranMap, 6),
      chartKategoriPemasukan: mtMapKeArray_(kategoriPemasukanMap, 6),
      chartSaldoAkun: akunAktif.map(function (a) {
        return {
          nama: a.nama,
          total: a.total,
        };
      }),

      transaksiTerbaru: transaksiTerbaru,
      akunAktif: akunAktif,
    };

    var output = balasJson("success", hasil, "Dashboard berhasil dimuat.");

    // Cache 60 detik. Jangan terlalu lama, nanti data baru terasa telat.
    cache.put(cacheKey, output, 60);

    return output;
  } catch (e) {
    return balasJson("error", null, "Gagal memuat dashboard: " + e.message);
  }
}

// ============================================================
// LANGGANAN / SUBSCRIPTION
// ============================================================

function hitungStatusLangganan(user) {
  var role = String(user["Role"] || "").trim();
  if (role === "Admin")
    return {
      statusLangganan: "Unlimited",
      modeAkses: "Normal",
      berakhirLangganan: "",
      graceSampai: "",
    };
  var tipeLangganan = String(user["Tipe Langganan"] || "").trim();
  var berakhirStr = String(user["Berakhir Langganan"] || "").trim();
  if (tipeLangganan === "Unlimited")
    return {
      statusLangganan: "Unlimited",
      modeAkses: "Normal",
      berakhirLangganan: "",
      graceSampai: "",
    };
  if (!berakhirStr)
    return {
      statusLangganan: "Aktif",
      modeAkses: "Normal",
      berakhirLangganan: "",
      graceSampai: "",
    };
  var now = new Date();
  var berakhir = new Date(berakhirStr);
  if (isNaN(berakhir))
    return {
      statusLangganan: "Aktif",
      modeAkses: "Normal",
      berakhirLangganan: berakhirStr,
      graceSampai: "",
    };
  var graceSampai = new Date(berakhir);
  graceSampai.setDate(graceSampai.getDate() + 15);
  var selisihHari = Math.floor((berakhir - now) / (1000 * 60 * 60 * 24));
  var graceSampaiStr = graceSampai.toISOString().split("T")[0];
  var berakhirFmt = berakhir.toISOString().split("T")[0];
  if (now <= berakhir) {
    return {
      statusLangganan: selisihHari <= 7 ? "Akan Habis" : "Aktif",
      modeAkses: "Normal",
      berakhirLangganan: berakhirFmt,
      graceSampai: graceSampaiStr,
    };
  } else if (now <= graceSampai) {
    return {
      statusLangganan: "Grace Period",
      modeAkses: "Normal",
      berakhirLangganan: berakhirFmt,
      graceSampai: graceSampaiStr,
    };
  } else {
    return {
      statusLangganan: "Habis",
      modeAkses: "ReadOnly",
      berakhirLangganan: berakhirFmt,
      graceSampai: graceSampaiStr,
    };
  }
}

function aturLanggananUser(userId, dataLangganan) {
  try {
    pastikanKolomLanggananMasterUser();
    const sheet = getSheet(ID_MASTER_USERS, NAMA_TAB_MASTER.USERS);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const idIdx = headers.indexOf("ID");
    var durasiMap = {
      "1 bulan": 30,
      "3 bulan": 90,
      "6 bulan": 180,
      "1 tahun": 365,
      Unlimited: -1,
    };
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][idIdx]) === String(userId)) {
        var mulai =
          dataLangganan.mulaiLangganan ||
          new Date().toISOString().split("T")[0];
        var tipe = dataLangganan.tipeLangganan || "1 bulan";
        var hari = durasiMap[tipe] !== undefined ? durasiMap[tipe] : 30;
        var berakhir = "",
          graceSampai = "";
        if (tipe !== "Unlimited") {
          var tglBerakhir = new Date(mulai);
          tglBerakhir.setDate(tglBerakhir.getDate() + hari);
          berakhir = tglBerakhir.toISOString().split("T")[0];
          var tglGrace = new Date(tglBerakhir);
          tglGrace.setDate(tglGrace.getDate() + 15);
          graceSampai = tglGrace.toISOString().split("T")[0];
        }
        var userObj = {};
        headers.forEach(function (h, idx) {
          userObj[h] = rows[i][idx];
        });
        userObj["Tipe Langganan"] = tipe;
        userObj["Mulai Langganan"] = mulai;
        userObj["Berakhir Langganan"] = berakhir;
        userObj["Grace Sampai"] = graceSampai;
        userObj["Mode Akses"] =
          tipe === "Unlimited" ? "Normal" : dataLangganan.modeAkses || "Normal";
        userObj["Catatan Langganan"] = dataLangganan.catatan || "";
        userObj["Status Langganan"] =
          hitungStatusLangganan(userObj).statusLangganan;
        [
          "Tipe Langganan",
          "Mulai Langganan",
          "Berakhir Langganan",
          "Status Langganan",
          "Grace Sampai",
          "Mode Akses",
          "Catatan Langganan",
        ].forEach(function (kolom) {
          var idx = headers.indexOf(kolom);
          if (idx !== -1)
            sheet.getRange(i + 1, idx + 1).setValue(userObj[kolom] || "");
        });
        return balasJson("success", null, "Langganan berhasil diperbarui.");
      }
    }
    return balasJson("error", null, "User tidak ditemukan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function pastikanKolomLanggananMasterUser() {
  var ss = SpreadsheetApp.openById(ID_MASTER_USERS);
  var sheet = ss.getSheetByName(NAMA_TAB_MASTER.USERS);
  if (!sheet) return;
  var kolomBaru = [
    "Foto Profil",
    "Mulai Langganan",
    "Berakhir Langganan",
    "Tipe Langganan",
    "Status Langganan",
    "Grace Sampai",
    "Mode Akses",
    "Catatan Langganan",
  ];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  kolomBaru.forEach(function (k) {
    if (headers.indexOf(k) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(k);
      headers.push(k);
    }
  });
}

// ============================================================
// SETUP GLOBAL
// ============================================================

const NAMA_TAB_SETUP = "SETUP";

function pastikanTabSetup() {
  try {
    var ss = SpreadsheetApp.openById(ID_MASTER_USERS);
    var sheet = ss.getSheetByName(NAMA_TAB_SETUP);
    if (!sheet) {
      sheet = ss.insertSheet(NAMA_TAB_SETUP);
      sheet.appendRow(["Key", "Value", "Updated At"]);
      [
        ["musik_url", "https://c.termai.cc/a157/d9SepH"],
        ["musik_global_aktif", "true"],
        ["pesan_login_aktif", "false"],
        ["pesan_login_isi", "Selamat datang! Semoga harimu produktif."],
        ["pesan_login_target", "semua"],
      ].forEach(function (row) {
        sheet.appendRow([row[0], row[1], new Date().toISOString()]);
      });
    }
    return sheet;
  } catch (e) {
    Logger.log("Error pastikanTabSetup: " + e.message);
    return null;
  }
}

function getSetupGlobal() {
  try {
    pastikanTabSetup();
    var data = ambilDataSebagaiObjek(ID_MASTER_USERS, NAMA_TAB_SETUP);
    var obj = {};
    data.forEach(function (d) {
      obj[d["Key"]] = d["Value"];
    });
    return balasJson("success", obj);
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function simpanSetupGlobal(key, value) {
  try {
    pastikanTabSetup();
    var sheet = getSheet(ID_MASTER_USERS, NAMA_TAB_SETUP);
    if (!sheet) return balasJson("error", null, "Sheet SETUP tidak ditemukan.");
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0];
    var keyIdx = headers.indexOf("Key");
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][keyIdx] === key) {
        sheet.getRange(i + 1, headers.indexOf("Value") + 1).setValue(value);
        sheet
          .getRange(i + 1, headers.indexOf("Updated At") + 1)
          .setValue(new Date().toISOString());
        return balasJson("success", null, "Setup disimpan.");
      }
    }
    sheet.appendRow([key, value, new Date().toISOString()]);
    return balasJson("success", null, "Setup disimpan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function setupKolomLanggananSekarang() {
  pastikanKolomLanggananMasterUser();
  pastikanTabSetup();
  setupSettingWeb();
  return "Kolom langganan, tab SETUP, dan SETTING_WEB berhasil ditambahkan.";
}

// ============================================================
// HELPER / TEST
// ============================================================

function ambilIdDariUrlAtauId(input) {
  if (!input) return "";
  let teks = String(input)
    .trim()
    .replace(/^['"]+|['"]+$/g, "");
  const match = teks.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];
  return teks;
}

function cekDatabaseDuaUser() {
  const daftarUser = ambilDataMasterSebagaiObjek(NAMA_TAB_MASTER.USERS);
  const hasil = daftarUser.map(function (user) {
    return {
      nama: user["Nama"],
      username: user["Username"],
      spreadsheetId: user["Spreadsheet ID"],
      status: user["Status"],
      role: user["Role"],
    };
  });
  Logger.log(JSON.stringify(hasil, null, 2));
  return hasil;
}

function tesLoginNelson() {
  const hasil = login("nelson", "123");
  Logger.log(hasil);
  return hasil;
}
function tesLoginImelda() {
  const hasil = login("imelda", "123");
  Logger.log(hasil);
  return hasil;
}

function upgradeDatabaseTransaksiNelson() {
  pastikanHeaderTransaksi("1yUsZQ_JJ1Uf1I81lfD3eDTibOta2wsBLWc9VSp-Kw_4");
  return "Header TRANSAKSI Nelson selesai dicek.";
}
function upgradeDatabaseTransaksiImelda() {
  pastikanHeaderTransaksi("1Jo9Z-GGKlPoG0Zmfhf9awr2EESdmeTedALfhF3knFiY");
  return "Header TRANSAKSI Imelda selesai dicek.";
}

function setupDataAwalNelson() {
  const spreadsheetId = "1yUsZQ_JJ1Uf1I81lfD3eDTibOta2wsBLWc9VSp-Kw_4";
  setupSpreadsheetUser(spreadsheetId);
  const sheetAkun = getSheet(spreadsheetId, NAMA_TAB.AKUN);
  const sheetKategori = getSheet(spreadsheetId, NAMA_TAB.KATEGORI);
  const akunDefault = [
    "CASH",
    "DANA",
    "GOPAY",
    "OVO",
    "E-MONEY",
    "SULSELBAR",
    "KAS BISNIS",
  ];
  const kategoriDefault = [
    {
      nama: "Ortu",
      jenis: "Pemasukan Pribadi",
      icon: "user-heart",
      warna: "#00ff99",
    },
    {
      nama: "Lainnya",
      jenis: "Pemasukan Pribadi",
      icon: "more-horizontal",
      warna: "#00d5ff",
    },
    {
      nama: "Keb. Kuliah",
      jenis: "Pengeluaran Pribadi",
      icon: "book-open",
      warna: "#ff9f43",
    },
    {
      nama: "Transportasi",
      jenis: "Pengeluaran Pribadi",
      icon: "bus",
      warna: "#00d5ff",
    },
    {
      nama: "Makan & Minum",
      jenis: "Pengeluaran Pribadi",
      icon: "restaurant",
      warna: "#ff4560",
    },
    {
      nama: "Tagihan Rumah",
      jenis: "Pengeluaran Pribadi",
      icon: "home",
      warna: "#b84cff",
    },
    {
      nama: "Internet",
      jenis: "Pengeluaran Pribadi",
      icon: "wifi",
      warna: "#00ff99",
    },
    {
      nama: "Hiburan & Sosial",
      jenis: "Pengeluaran Pribadi",
      icon: "gamepad",
      warna: "#ff9f43",
    },
    {
      nama: "Kesehatan",
      jenis: "Pengeluaran Pribadi",
      icon: "heart-pulse",
      warna: "#ff4560",
    },
    {
      nama: "Kebutuhan Rumah",
      jenis: "Pengeluaran Pribadi",
      icon: "shopping-bag",
      warna: "#00d5ff",
    },
    {
      nama: "Persembahan",
      jenis: "Pengeluaran Pribadi",
      icon: "gift",
      warna: "#b84cff",
    },
    {
      nama: "Lainnya",
      jenis: "Pengeluaran Pribadi",
      icon: "more-horizontal",
      warna: "#8d99b3",
    },
    {
      nama: "Pembayaran Pelanggan",
      jenis: "TipePembayaranBisnis",
      icon: "secure-payment",
      warna: "#00ff99",
    },
    {
      nama: "Operasional Bisnis",
      jenis: "TipePembayaranBisnis",
      icon: "briefcase",
      warna: "#ff9f43",
    },
    {
      nama: "Refund",
      jenis: "TipePembayaranBisnis",
      icon: "refund",
      warna: "#ff4560",
    },
    {
      nama: "Lainnya",
      jenis: "TipePembayaranBisnis",
      icon: "more-horizontal",
      warna: "#00d5ff",
    },
    {
      nama: "Cuci Motor",
      jenis: "Bisnis",
      icon: "car-washing",
      warna: "#00d5ff",
    },
    {
      nama: "Print",
      jenis: "Bisnis",
      icon: "printer",
      warna: "#b84cff",
    },
    {
      nama: "Sopir",
      jenis: "Bisnis",
      icon: "steering-2",
      warna: "#ff9f43",
    },
    {
      nama: "Lainnya",
      jenis: "Bisnis",
      icon: "more-horizontal",
      warna: "#8d99b3",
    },
  ];
  const akunLama = ambilDataSebagaiObjek(spreadsheetId, NAMA_TAB.AKUN);
  const namaAkunLama = akunLama.map(function (a) {
    return String(a["Nama Akun"] || "")
      .trim()
      .toLowerCase();
  });
  akunDefault.forEach(function (namaAkun) {
    if (namaAkunLama.indexOf(namaAkun.toLowerCase()) === -1) {
      sheetAkun.appendRow([
        generateId(),
        namaAkun,
        namaAkun === "KAS BISNIS" ? "Bisnis" : "Pribadi",
        0,
        0,
        "#00ff99",
        "wallet",
        "Aktif",
        new Date().toISOString(),
      ]);
    }
  });
  const kategoriLama = ambilDataSebagaiObjek(spreadsheetId, NAMA_TAB.KATEGORI);
  const kunciKategoriLama = kategoriLama.map(function (k) {
    return (
      String(k["Nama"] || "")
        .trim()
        .toLowerCase() +
      "|" +
      String(k["Jenis"] || "")
        .trim()
        .toLowerCase()
    );
  });
  kategoriDefault.forEach(function (k) {
    const key = k.nama.toLowerCase() + "|" + k.jenis.toLowerCase();
    if (kunciKategoriLama.indexOf(key) === -1)
      sheetKategori.appendRow([
        generateId(),
        k.nama,
        k.jenis,
        k.icon,
        k.warna,
        "Aktif",
        new Date().toISOString(),
      ]);
  });
  return "Setup akun dan kategori Nelson selesai.";
}

function izinkanDriveApp() {
  const folder = DriveApp.getRootFolder();
  Logger.log(folder.getName());
}
function izinkanDriveTulis() {
  const folder = DriveApp.createFolder("MT_TEST_PERMISSION_DELETE_ME");
  Logger.log("Folder test dibuat: " + folder.getUrl());
  folder.setTrashed(true);
  return "Izin Drive tulis berhasil diberikan.";
}

// ============================================================
// API ROUTER UNTUK GITHUB PAGES
// Frontend GitHub Pages akan kirim:
// { action: "namaFungsi", args: [...] }
// ============================================================

function doPost(e) {
  try {
    const raw =
      e && e.postData && e.postData.contents ? e.postData.contents : "";

    if (!raw) {
      return apiOutput_(balasJson("error", null, "Body request kosong."));
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (errJson) {
      return apiOutput_(
        balasJson(
          "error",
          null,
          "Format JSON request tidak valid: " + errJson.message,
        ),
      );
    }

    const action = String(payload.action || "").trim();
    const args = Array.isArray(payload.args) ? payload.args : [];

    if (!action) {
      return apiOutput_(balasJson("error", null, "Action kosong."));
    }

    const allowedActions = {
      // AUTH
      login: true,

      // DASHBOARD / LAPORAN
      getDashboard: true,
      getLaporan: true,

      // TRANSAKSI
      getTransaksi: true,
      tambahTransaksi: true,
      editTransaksi: true,
      hapusTransaksi: true,
      getMasterInputTransaksi: true,

      // AKUN
      getAkun: true,
      tambahAkun: true,
      editAkun: true,
      hapusAkun: true,

      // KATEGORI
      getKategori: true,
      tambahKategori: true,
      editKategori: true,
      hapusKategori: true,

      // BUDGET
      getBudget: true,
      tambahBudget: true,
      hapusBudget: true,

      // PELANGGAN
      getPelanggan: true,
      tambahPelanggan: true,
      editPelanggan: true,
      hapusPelanggan: true,

      // PEMBAYARAN
      getPembayaran: true,
      tambahPembayaran: true,
      verifikasiPembayaran: true,

      // BOT LOG
      getBotLog: true,

      // BOT WA NENELCRAFT
      botCariUserByWa: true,
      botUpsertOrder: true,
      botKonfirmasiPembayaran: true,
      botUpdateOrderStatus: true,
      botTambahLog: true,
      botTambahTransaksiPribadi: true,
      botEditTransaksiPribadi: true,
      botHapusTransaksiPribadi: true,

      // PENGATURAN USER
      getPengaturan: true,
      simpanPengaturan: true,
      updateProfilUser: true,
      uploadFotoProfil: true,

      // ADMIN
      getDaftarUser: true,
      tambahUser: true,
      editUser: true,
      nonaktifkanUser: true,
      aturLanggananUser: true,

      // SETTING WEB
      getSettingWeb: true,
      simpanSettingWeb: true,
      getNotifikasiLogin: true,
    };

    if (!allowedActions[action]) {
      return apiOutput_(
        balasJson("error", null, "Action tidak diizinkan: " + action),
      );
    }

    if (typeof this[action] !== "function") {
      return apiOutput_(
        balasJson(
          "error",
          null,
          "Function tidak ditemukan di Code.gs: " + action,
        ),
      );
    }

    const hasil = this[action].apply(null, args);

    if (typeof hasil === "string") {
      return apiOutput_(hasil);
    }

    return apiOutput_(
      JSON.stringify(hasil || { status: "success", data: null, pesan: "" }),
    );
  } catch (err) {
    return apiOutput_(
      balasJson("error", null, "Error API doPost: " + err.message),
    );
  }
}

function apiOutput_(text) {
  return ContentService.createTextOutput(text).setMimeType(
    ContentService.MimeType.TEXT,
  );
}

// ============================================================
// MONEYTRACK PERFORMANCE HELPER
// Cache dashboard supaya tidak baca Google Sheets terus-terusan
// ============================================================

function mtCacheKeyDashboard_(spreadsheetId, role, periode) {
  return [
    "MT_DASHBOARD",
    "V3",
    spreadsheetId,
    role || "User",
    periode || "7hari",
  ].join("__");
}

function mtHapusCacheDashboard_(spreadsheetId) {
  try {
    var cache = CacheService.getScriptCache();

    var roles = [
      "Admin",
      "UserBisnisPribadi",
      "UserPribadiBisnis",
      "UserPribadi",
      "UserBisnis",
    ];
    var periodes = ["7hari", "1bln", "6bln", "1thn", "semua"];

    roles.forEach(function (role) {
      periodes.forEach(function (periode) {
        cache.remove(mtCacheKeyDashboard_(spreadsheetId, role, periode));
      });
    });
  } catch (err) {
    Logger.log("Gagal hapus cache dashboard: " + err.message);
  }
}

function mtAngka_(value) {
  if (value === null || value === undefined || value === "") return 0;

  var cleaned = String(value)
    .replace(/Rp/gi, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^\d.-]/g, "");

  var n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function mtTanggal_(value) {
  if (!value) return null;

  if (
    Object.prototype.toString.call(value) === "[object Date]" &&
    !isNaN(value)
  ) {
    return value;
  }

  var d = new Date(value);
  if (!isNaN(d)) return d;

  return null;
}

function mtJenisKeuangan_(trx) {
  var explicit = String(
    trx["Jenis Keuangan"] || trx["Jenis Keuangan "] || "",
  ).trim();

  if (explicit) {
    var explicitLower = explicit.toLowerCase();
    if (explicitLower.indexOf("bisnis") !== -1) return "Bisnis";
    if (explicitLower.indexOf("pribadi") !== -1) return "Pribadi";
    return explicit;
  }

  var tipePembayaran = String(trx["Tipe Pembayaran"] || "").trim();
  if (tipePembayaran) return "Bisnis";

  var raw = String(
    trx["Jenis"] || trx["Tipe"] || trx["Tipe Transaksi"] || "",
  ).trim();
  var lower = raw.toLowerCase();

  if (lower.indexOf("bisnis") !== -1) return "Bisnis";
  if (lower.indexOf("pribadi") !== -1) return "Pribadi";
  if (
    raw === "Pembayaran Masuk" ||
    raw === "Operasional Bisnis" ||
    raw === "Refund"
  ) {
    return "Bisnis";
  }

  return "Pribadi";
}

function mtTipeTransaksi_(trx) {
  var tipe = String(
    trx["Tipe Transaksi"] || trx["Tipe Pembayaran"] || "",
  ).trim();

  if (!tipe) tipe = String(trx["Jenis"] || trx["Tipe"] || "").trim();

  var lower = tipe.toLowerCase();
  if (lower.indexOf("pemasukan") !== -1) return "Pemasukan";
  if (lower.indexOf("pengeluaran") !== -1) return "Pengeluaran";
  if (lower.indexOf("transfer") !== -1) return "Transfer";

  return tipe;
}

function mtNominalTransaksi_(trx) {
  return mtAngka_(trx["Nominal"] || trx["Jumlah"] || trx["_Nominal"] || 0);
}

function mtAkunTransaksi_(trx) {
  var tipe = mtTipeTransaksi_(trx);

  if (tipe === "Pemasukan" || tipe === "Pembayaran Masuk") {
    return trx["Akun Tujuan"] || trx["Akun"] || "-";
  }

  if (
    tipe === "Pengeluaran" ||
    tipe === "Operasional Bisnis" ||
    tipe === "Refund"
  ) {
    return trx["Akun Asal"] || trx["Akun"] || "-";
  }

  if (tipe === "Transfer") {
    return (trx["Akun Asal"] || "-") + " → " + (trx["Akun Tujuan"] || "-");
  }

  return trx["Akun"] || trx["Akun Asal"] || trx["Akun Tujuan"] || "-";
}

function mtIsPemasukan_(trx) {
  var tipe = mtTipeTransaksi_(trx);
  if (tipe === "Lainnya" && trx["Akun Tujuan"] && !trx["Akun Asal"]) {
    return true;
  }
  return tipe === "Pemasukan" || tipe === "Pembayaran Masuk";
}

function mtIsPengeluaran_(trx) {
  var tipe = mtTipeTransaksi_(trx);
  if (tipe === "Lainnya" && trx["Akun Asal"] && !trx["Akun Tujuan"]) {
    return true;
  }
  return (
    tipe === "Pengeluaran" || tipe === "Operasional Bisnis" || tipe === "Refund"
  );
}

function mtBolehUntukRole_(trx, role) {
  var jenisKeuangan = mtJenisKeuangan_(trx);

  if (role === "Admin") return true;
  if (role === "UserBisnisPribadi" || role === "UserPribadiBisnis") return true;
  if (role === "UserPribadi") return jenisKeuangan === "Pribadi";
  if (role === "UserBisnis") return jenisKeuangan === "Bisnis";

  return jenisKeuangan === "Pribadi";
}

function mtTanggalAwalPeriode_(periode) {
  var now = new Date();
  var start = new Date(now);

  if (periode === "7hari") {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (periode === "1bln") {
    start.setMonth(now.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (periode === "6bln") {
    start.setMonth(now.getMonth() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (periode === "1thn") {
    start.setFullYear(now.getFullYear() - 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  return null; // semua tahun
}

function mtLabelBucket_(date, periode) {
  if (!date) return "-";

  if (periode === "7hari" || periode === "1bln") {
    return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM");
  }

  if (periode === "6bln" || periode === "1thn") {
    return Utilities.formatDate(date, Session.getScriptTimeZone(), "MMM yyyy");
  }

  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy");
}

function mtTambahMap_(map, key, value) {
  if (!key) key = "-";
  if (!map[key]) map[key] = 0;
  map[key] += value;
}

function mtMapKeArray_(map, limit) {
  var arr = Object.keys(map).map(function (key) {
    return {
      nama: key,
      total: map[key],
    };
  });

  arr.sort(function (a, b) {
    return b.total - a.total;
  });

  if (limit) return arr.slice(0, limit);
  return arr;
}

function hapusCacheDashboardSemuaUserManual() {
  var users = ambilDataMasterSebagaiObjek(NAMA_TAB_MASTER.USERS);

  users.forEach(function (u) {
    var spreadsheetId = u["Spreadsheet ID"];
    if (spreadsheetId) {
      mtHapusCacheDashboard_(spreadsheetId);
    }
  });

  Logger.log("Cache dashboard semua user berhasil dihapus.");
}

// ============================================================
// PATCH SALDO TRANSAKSI - tempel di paling bawah Code.gs
// ============================================================
function mtParseNominalFix_(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  var cleaned = String(value)
    .replace(/Rp/gi, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");
  var n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function mtTransaksiDariRowFix_(headers, row) {
  var obj = {};
  headers.forEach(function (h, i) {
    obj[h] = row[i];
  });
  return obj;
}

function mtNormalisasiTransaksiSaldoFix_(data) {
  data = data || {};
  var jenisKeuangan = data.jenisKeuangan || data["Jenis Keuangan"] || "Pribadi";
  var tipeTransaksi =
    data.tipeTransaksi ||
    data["Tipe Transaksi"] ||
    (jenisKeuangan === "Pribadi" ? data.jenis || data.tipe || "" : "");
  var tipePembayaran =
    data.tipePembayaran ||
    data["Tipe Pembayaran"] ||
    (jenisKeuangan === "Bisnis" ? data.jenis || data.tipe || "" : "");
  var nominal = mtParseNominalFix_(
    data.nominal !== undefined
      ? data.nominal
      : data.jumlah !== undefined
        ? data.jumlah
        : data.Nominal,
  );
  var biayaAdmin = mtParseBiayaAdminFix_(data);
  var akunAsal = data.akunAsal || data["Akun Asal"] || "";
  var akunTujuan = data.akunTujuan || data["Akun Tujuan"] || "";
  var akun = data.akun || data.Akun || "";

  if (jenisKeuangan === "Pribadi") {
    if (!akunAsal && tipeTransaksi === "Pengeluaran") akunAsal = akun;
    if (!akunTujuan && tipeTransaksi === "Pemasukan") akunTujuan = akun;
  }
  if (jenisKeuangan === "Bisnis") {
    if (
      !akunAsal &&
      (tipePembayaran === "Operasional Bisnis" || tipePembayaran === "Refund")
    )
      akunAsal = akun;
    if (!akunTujuan && tipePembayaran === "Pembayaran Masuk") akunTujuan = akun;
  }

  return {
    jenisKeuangan: jenisKeuangan,
    tipeTransaksi: tipeTransaksi,
    tipePembayaran: tipePembayaran,
    nominal: nominal,
    biayaAdmin: biayaAdmin,
    akunAsal: akunAsal,
    akunTujuan: akunTujuan,
  };
}

function mtParseBiayaAdminFix_(data) {
  data = data || {};
  if (data.biayaAdmin !== undefined) return mtParseNominalFix_(data.biayaAdmin);
  if (data["Biaya Admin"] !== undefined)
    return mtParseNominalFix_(data["Biaya Admin"]);
  var ket = String(data.keterangan || data.Keterangan || "");
  var match = ket.match(/\[Biaya Admin Transfer:\s*([^\]\-]+)/i);
  return match ? mtParseNominalFix_(match[1]) : 0;
}

function mtBalikkanSaldoTransaksiFix_(spreadsheetId, data) {
  var t = mtNormalisasiTransaksiSaldoFix_(data);
  var nominal = mtParseNominalFix_(t.nominal);
  if (nominal <= 0) return;

  if (t.jenisKeuangan === "Pribadi") {
    if (t.tipeTransaksi === "Pemasukan")
      kurangSaldoAkun(spreadsheetId, t.akunTujuan, nominal);
    if (t.tipeTransaksi === "Pengeluaran")
      tambahSaldoAkun(spreadsheetId, t.akunAsal, nominal);
    if (t.tipeTransaksi === "Transfer") {
      tambahSaldoAkun(
        spreadsheetId,
        t.akunAsal,
        nominal + mtParseNominalFix_(t.biayaAdmin),
      );
      kurangSaldoAkun(spreadsheetId, t.akunTujuan, nominal);
    }
  }

  if (t.jenisKeuangan === "Bisnis") {
    if (t.tipePembayaran === "Pembayaran Masuk")
      kurangSaldoAkun(spreadsheetId, t.akunTujuan, nominal);
    if (
      t.tipePembayaran === "Operasional Bisnis" ||
      t.tipePembayaran === "Refund"
    )
      tambahSaldoAkun(spreadsheetId, t.akunAsal, nominal);
  }
}

function prosesSaldoTransaksiBaru(spreadsheetId, data) {
  var t = mtNormalisasiTransaksiSaldoFix_(data);
  var nominal = mtParseNominalFix_(t.nominal);
  if (nominal <= 0) return;

  if (t.jenisKeuangan === "Pribadi") {
    if (t.tipeTransaksi === "Pemasukan")
      tambahSaldoAkun(spreadsheetId, t.akunTujuan, nominal);
    if (t.tipeTransaksi === "Pengeluaran")
      kurangSaldoAkun(spreadsheetId, t.akunAsal, nominal);
    if (t.tipeTransaksi === "Transfer") {
      kurangSaldoAkun(
        spreadsheetId,
        t.akunAsal,
        nominal + mtParseNominalFix_(t.biayaAdmin),
      );
      tambahSaldoAkun(spreadsheetId, t.akunTujuan, nominal);
    }
  }

  if (t.jenisKeuangan === "Bisnis") {
    if (t.tipePembayaran === "Pembayaran Masuk")
      tambahSaldoAkun(spreadsheetId, t.akunTujuan, nominal);
    if (
      t.tipePembayaran === "Operasional Bisnis" ||
      t.tipePembayaran === "Refund"
    )
      kurangSaldoAkun(spreadsheetId, t.akunAsal, nominal);
  }
}

function editTransaksi(spreadsheetId, id, data) {
  try {
    data = data || {};
    var cekAkses = wajibBolehTulis(data);
    if (!cekAkses.boleh) return balasJson("error", null, cekAkses.pesan);
    var sheet = getSheet(spreadsheetId, NAMA_TAB.TRANSAKSI);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0];
    var idIdx = headers.indexOf("ID");
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][idIdx]) === String(id)) {
        var lama = mtTransaksiDariRowFix_(headers, rows[i]);
        var lamaSaldo = mtNormalisasiTransaksiSaldoFix_(lama);
        var jenisKeuangan =
          data.jenisKeuangan ||
          lama["Jenis Keuangan"] ||
          lamaSaldo.jenisKeuangan;
        var tipeTransaksi =
          data.tipeTransaksi ||
          (jenisKeuangan === "Pribadi"
            ? data.jenis || lama["Tipe Transaksi"] || lamaSaldo.tipeTransaksi
            : lama["Tipe Transaksi"]);
        var tipePembayaran =
          data.tipePembayaran ||
          (jenisKeuangan === "Bisnis"
            ? data.jenis || lama["Tipe Pembayaran"] || lamaSaldo.tipePembayaran
            : lama["Tipe Pembayaran"]);
        var nominal =
          data.nominal !== undefined || data.jumlah !== undefined
            ? mtParseNominalFix_(
                data.nominal !== undefined ? data.nominal : data.jumlah,
              )
            : mtParseNominalFix_(lama["Nominal"]);
        var akunAsal = data.akunAsal || lama["Akun Asal"] || "";
        var akunTujuan = data.akunTujuan || lama["Akun Tujuan"] || "";
        var biayaAdmin =
          data.biayaAdmin !== undefined
            ? mtParseNominalFix_(data.biayaAdmin)
            : mtParseBiayaAdminFix_({
                keterangan:
                  data.keterangan !== undefined
                    ? data.keterangan
                    : lama["Keterangan"],
              });
        var keterangan = data.keterangan;
        if (data.akun && jenisKeuangan === "Pribadi") {
          if (tipeTransaksi === "Pengeluaran") akunAsal = data.akun;
          if (tipeTransaksi === "Pemasukan") akunTujuan = data.akun;
        }
        if (
          jenisKeuangan === "Pribadi" &&
          tipeTransaksi === "Transfer" &&
          biayaAdmin > 0 &&
          keterangan !== undefined &&
          String(keterangan).indexOf("[Biaya Admin Transfer:") === -1
        ) {
          keterangan +=
            (keterangan ? "\n" : "") +
            "[Biaya Admin Transfer: Rp " +
            biayaAdmin.toLocaleString("id-ID") +
            "]";
        }

        mtBalikkanSaldoTransaksiFix_(spreadsheetId, lamaSaldo);
        prosesSaldoTransaksiBaru(spreadsheetId, {
          jenisKeuangan: jenisKeuangan,
          tipeTransaksi: tipeTransaksi,
          tipePembayaran: tipePembayaran,
          nominal: nominal,
          biayaAdmin: biayaAdmin,
          akunAsal: akunAsal,
          akunTujuan: akunTujuan,
        });

        var kolom = [
          ["Tanggal", data.tanggal],
          ["Jenis Keuangan", jenisKeuangan],
          ["Tipe Transaksi", tipeTransaksi],
          ["Tipe Pembayaran", tipePembayaran],
          ["Kategori", data.kategori],
          ["Akun Asal", akunAsal],
          ["Akun Tujuan", akunTujuan],
          ["Nominal", nominal],
          ["Keterangan", keterangan],
          ["Status", data.status],
          ["Pelanggan", data.pelanggan],
          ["Updated At", new Date().toISOString()],
        ];
        kolom.forEach(function (k) {
          if (k[1] === undefined || k[1] === null) return;
          var idx = headers.indexOf(k[0]);
          if (idx !== -1) sheet.getRange(i + 1, idx + 1).setValue(k[1]);
        });
        mtHapusCacheDashboard_(spreadsheetId);
        return balasJson("success", null, "Transaksi berhasil diubah.");
      }
    }
    return balasJson("error", null, "Transaksi tidak ditemukan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function tambahTransaksi(spreadsheetId, data) {
  try {
    data = data || {};
    var cekAkses = wajibBolehTulis(data);
    if (!cekAkses.boleh) return balasJson("error", null, cekAkses.pesan);
    pastikanHeaderTransaksi(spreadsheetId);
    var sheet = getSheet(spreadsheetId, NAMA_TAB.TRANSAKSI);
    if (!sheet)
      return balasJson("error", null, "Sheet TRANSAKSI tidak ditemukan.");
    var jenisKeuangan = data.jenisKeuangan || "Pribadi";
    if (!roleBolehJenisKeuangan(data.role || "UserPribadi", jenisKeuangan))
      return balasJson(
        "error",
        null,
        "Role ini tidak boleh input transaksi " + jenisKeuangan + ".",
      );
    var tipeTransaksi = data.tipeTransaksi || data.jenis || "";
    var tipePembayaran = data.tipePembayaran || "";
    var nominal = mtParseNominalFix_(data.nominal || data.jumlah);
    var biayaAdmin = mtParseNominalFix_(data.biayaAdmin || 0);
    var akunAsal = data.akunAsal || "";
    var akunTujuan = data.akunTujuan || data.akun || "";
    var keterangan = data.keterangan || "";

    if (!data.tanggal) return balasJson("error", null, "Tanggal wajib diisi.");
    if (nominal <= 0)
      return balasJson("error", null, "Nominal harus lebih dari 0.");
    if (!["Pribadi", "Bisnis"].includes(jenisKeuangan))
      return balasJson("error", null, "Jenis keuangan tidak valid.");

    if (jenisKeuangan === "Pribadi") {
      if (!["Pemasukan", "Pengeluaran", "Transfer"].includes(tipeTransaksi))
        return balasJson("error", null, "Tipe transaksi pribadi tidak valid.");
      if (tipeTransaksi === "Pemasukan" && !akunTujuan)
        return balasJson(
          "error",
          null,
          "Akun tujuan wajib diisi untuk pemasukan.",
        );
      if (tipeTransaksi === "Pengeluaran" && !akunAsal)
        return balasJson(
          "error",
          null,
          "Akun asal wajib diisi untuk pengeluaran.",
        );
      if (tipeTransaksi === "Transfer") {
        if (!akunAsal || !akunTujuan)
          return balasJson(
            "error",
            null,
            "Akun asal dan akun tujuan wajib diisi untuk transfer.",
          );
        if (akunAsal === akunTujuan)
          return balasJson(
            "error",
            null,
            "Akun asal dan akun tujuan tidak boleh sama.",
          );
        if (
          biayaAdmin > 0 &&
          keterangan.indexOf("[Biaya Admin Transfer:") === -1
        ) {
          keterangan +=
            (keterangan ? "\n" : "") +
            "[Biaya Admin Transfer: Rp " +
            biayaAdmin.toLocaleString("id-ID") +
            "]";
        }
      }
    }

    if (jenisKeuangan === "Bisnis") {
      if (
        ![
          "Pembayaran Masuk",
          "Operasional Bisnis",
          "Refund",
          "Lainnya",
        ].includes(tipePembayaran)
      )
        return balasJson("error", null, "Tipe pembayaran bisnis tidak valid.");
      if (tipePembayaran === "Pembayaran Masuk" && !akunTujuan)
        return balasJson(
          "error",
          null,
          "Akun tujuan wajib diisi untuk pembayaran masuk.",
        );
      if (
        (tipePembayaran === "Operasional Bisnis" ||
          tipePembayaran === "Refund") &&
        !akunAsal
      )
        return balasJson("error", null, "Akun asal wajib diisi.");
    }

    var id = generateId();
    appendObjekKeSheet(sheet, {
      ID: id,
      Tanggal: data.tanggal,
      "Jenis Keuangan": jenisKeuangan,
      "Tipe Transaksi": jenisKeuangan === "Pribadi" ? tipeTransaksi : "",
      "Tipe Pembayaran": jenisKeuangan === "Bisnis" ? tipePembayaran : "",
      Kategori: data.kategori || "",
      "Akun Asal": akunAsal,
      "Akun Tujuan": akunTujuan,
      Nominal: nominal,
      Keterangan: keterangan,
      Pelanggan:
        jenisKeuangan === "Bisnis"
          ? data.pelanggan || data.pelangganId || ""
          : "",
      Status: data.status || "Lunas",
      "Sumber Input": data.sumberInput || "Manual",
      "Created At": new Date().toISOString(),
      "Updated At": new Date().toISOString(),
    });
    prosesSaldoTransaksiBaru(spreadsheetId, {
      jenisKeuangan: jenisKeuangan,
      tipeTransaksi: tipeTransaksi,
      tipePembayaran: tipePembayaran,
      akunAsal: akunAsal,
      akunTujuan: akunTujuan,
      nominal: nominal,
      biayaAdmin: biayaAdmin,
    });
    mtHapusCacheDashboard_(spreadsheetId);
    return balasJson("success", { id: id }, "Transaksi berhasil ditambahkan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}

function hapusTransaksi(spreadsheetId, id, data) {
  try {
    var cekAkses = wajibBolehTulis(data || {});
    if (!cekAkses.boleh) return balasJson("error", null, cekAkses.pesan);
    var sheet = getSheet(spreadsheetId, NAMA_TAB.TRANSAKSI);
    if (!sheet) return balasJson("error", null, "Sheet tidak ditemukan.");
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0];
    var idIdx = headers.indexOf("ID");
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][idIdx]) === String(id)) {
        var lama = mtTransaksiDariRowFix_(headers, rows[i]);
        mtBalikkanSaldoTransaksiFix_(spreadsheetId, lama);
        sheet.deleteRow(i + 1);
        mtHapusCacheDashboard_(spreadsheetId);
        return balasJson(
          "success",
          null,
          "Transaksi berhasil dihapus dan saldo akun sudah dikembalikan.",
        );
      }
    }
    return balasJson("error", null, "Transaksi tidak ditemukan.");
  } catch (e) {
    return balasJson("error", null, e.message);
  }
}
