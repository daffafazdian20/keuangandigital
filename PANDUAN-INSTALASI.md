# PANDUAN INSTALASI — Keuangan Digital (GAS API + GitHub Pages)

Alur: **1.** Client ID Google → **2.** Backend GAS → **3.** Isi `js/config.js` → **4.** Push ke GitHub → **5.** Aktifkan Pages → **6.** Uji.
Folder kerja Git = **`keuangan-digital`** (hasil ekstrak ZIP; di dalamnya langsung ada `index.html`). Backend (`Kode.gs`) TIDAK ikut ke GitHub.

## 1. Buat Google OAuth Client ID (untuk tombol "Masuk dengan Google")
1. Buka https://console.cloud.google.com → buat Project baru (nama bebas).
2. **APIs & Services → OAuth consent screen**: User type **External** → isi nama aplikasi + email Anda → Save. Biarkan status **Testing**.
3. Di **Test users** tambahkan email Anda dan email anggota keluarga (mis. budi@gmail.com, siti@gmail.com). Hanya akun ini yang bisa login.
4. **Credentials → Create Credentials → OAuth client ID** → tipe **Web application**.
5. **Authorized JavaScript origins** → tambah `https://USERNAME.github.io` (ganti USERNAME dengan username GitHub; tanpa nama repo, tanpa garis miring di akhir).
6. Create → salin **Client ID** (berakhiran `.apps.googleusercontent.com`).

## 2. Pasang Backend (Google Apps Script)
1. https://script.google.com → Proyek baru. Ganti nama file `Code.gs` menjadi `Kode`, lalu tempel seluruh isi `Kode.gs`.
2. Di baris atas, ganti `GOOGLE_CLIENT_ID` dengan Client ID dari langkah 1.
3. Project Settings (ikon roda gigi) → centang **Show "appsscript.json"** → buka file itu → ganti isinya dengan `appsscript.json` yang diberikan.
4. Pilih fungsi **setupAppEnvironment** → ▶ Run → izinkan akses. Jalankan **sekali saja**. Akun yang menjalankannya otomatis menjadi **Admin**, jadi gunakan akun Google Anda (Budi).
5. **Deploy → New deployment → Web app**: Execute as **Me**, Who has access **Anyone** → Deploy → salin URL yang berakhiran `/exec`.
6. Setiap kali `Kode.gs` diubah: Deploy → Manage deployments → ikon pensil → Version **New version** → Deploy (URL tetap sama).

## 3. Isi konfigurasi frontend
Buka `js/config.js` dengan Notepad, isi `GAS_URL` (URL `/exec`) dan `GOOGLE_CLIENT_ID`. Simpan.

## 4. Push ke GitHub (lewat terminal)
1. Pasang Git (https://git-scm.com/download/win) dan buat akun + repository **Public** di GitHub (jangan centang README).
2. Buka folder `keuangan-digital` di File Explorer → klik address bar → ketik `powershell` → Enter.
3. Verifikasi: jalankan `dir`. **`index.html`, `css`, `js` harus terlihat.** Jika yang terlihat folder `backend`/`frontend`, Anda satu level terlalu tinggi.
4. Jalankan satu per satu:
```
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```
Saat diminta password, tempel **Personal Access Token** (GitHub → Settings → Developer settings → Tokens (classic) → scope **repo**). Layar tampak kosong saat paste, itu normal.

## 5. Aktifkan GitHub Pages
Repo → **Settings → Pages** → Source **Deploy from a branch** → Branch **main** / **(root)** → Save → centang **Enforce HTTPS**. Tunggu 1-2 menit; alamatnya `https://USERNAME.github.io/NAMA-REPO/`.

## 6. Uji
1. Buka alamat situs → klik **Masuk dengan Google** → dashboard tampil.
2. Menu **Pengaturan → Pengguna → Tambah**: daftarkan email Siti sebagai Anggota. Siti juga harus ada di Test users (langkah 1.3).
3. Catat satu transaksi → cek sheet **Transaksi** di Google Sheets.

## Update di kemudian hari
`git add .` → `git commit -m "deskripsi"` → `git push`, lalu Ctrl+Shift+R di browser.

## Masalah umum
| Gejala | Penyebab | Solusi |
|---|---|---|
| Error 400: origin_mismatch | Alamat situs belum ada di Authorized JavaScript origins | Tambahkan `https://USERNAME.github.io` (langkah 1.5) |
| "Access blocked" / app belum diverifikasi | Email belum di Test users | Tambahkan email di OAuth consent screen |
| Akses Ditolak (403) | Email belum terdaftar di sheet Pengguna | Admin menambahkan lewat Pengaturan |
| "Token tidak valid untuk aplikasi ini" | Client ID di Kode.gs berbeda dengan config.js | Samakan keduanya, deploy New version |
| "Gagal terhubung ke server" / CORS | Deploy bukan "Anyone", atau belum New version | Periksa Deploy → Manage deployments |
| Situs 404 di GitHub Pages | `index.html` tidak di root repo | Push ulang dari folder `keuangan-digital` |
