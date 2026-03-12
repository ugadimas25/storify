export type Locale = "id" | "en";

const translations = {
  // === Navigation ===
  "nav.home": { id: "Home", en: "Home" },
  "nav.explore": { id: "Jelajahi", en: "Explore" },
  "nav.premium": { id: "Premium", en: "Premium" },
  "nav.favorites": { id: "Favorit", en: "Favorites" },
  "nav.profile": { id: "Profil", en: "Profile" },

  // === Home - Hero (Guest) ===
  "home.brand": { id: "Storify Insights", en: "Storify Insights" },
  "home.hero.title1": { id: "Dengarkan Ringkasan", en: "Listen to Summaries of" },
  "home.hero.title2": { id: "Buku Terbaik", en: "Best Books" },
  "home.hero.subtitle": {
    id: "Akses ratusan ringkasan audiobook kapan saja, di mana saja. Belajar lebih cepat, lebih cerdas.",
    en: "Access hundreds of audiobook summaries anytime, anywhere. Learn faster, smarter.",
  },
  "home.hero.signin": { id: "Masuk", en: "Sign In" },
  "home.hero.signup": { id: "Daftar Gratis", en: "Sign Up Free" },
  "home.hero.trust": { id: "Bergabung dengan 1000+ pembaca", en: "Join 1000+ readers" },

  // === Home - Hero (Logged in) ===
  "home.greeting.morning": { id: "Selamat pagi", en: "Good morning" },
  "home.greeting.afternoon": { id: "Selamat siang", en: "Good afternoon" },
  "home.greeting.evening": { id: "Selamat malam", en: "Good evening" },
  "home.stats.listening": { id: "Mendengarkan", en: "Listening" },
  "home.stats.library": { id: "Pustaka", en: "Library" },
  "home.stats.explore": { id: "Jelajahi", en: "Explore" },

  // === Home - Sections ===
  "home.continue": { id: "Lanjut Dengarkan", en: "Continue Listening" },
  "home.continue.sub": { id: "Lanjutkan dari posisi terakhir", en: "Pick up where you left off" },
  "home.featured": { id: "Pilihan Utama", en: "Featured" },
  "home.viewAll": { id: "Lihat Semua", en: "View All" },
  "home.newArrivals": { id: "Terbaru", en: "New Arrivals" },
  "home.newArrivals.sub": { id: "Ringkasan terbaru untukmu", en: "Fresh summaries just for you" },
  "home.seeAll": { id: "Lihat Semua", en: "See All" },
  "home.completed": { id: "selesai", en: "completed" },

  // === Explore ===
  "explore.title": { id: "Jelajahi", en: "Explore" },
  "explore.search": { id: "Judul, penulis, atau kata kunci...", en: "Title, author, or keyword..." },
  "explore.all": { id: "Semua", en: "All" },
  "explore.noBooks": { id: "Buku tidak ditemukan", en: "No books found" },
  "explore.noBooks.sub": { id: "Coba ubah pencarian atau filter Anda.", en: "Try adjusting your search or filter criteria." },
  "explore.showing": { id: "Menampilkan", en: "Showing" },
  "explore.book": { id: "buku", en: "book" },
  "explore.books": { id: "buku", en: "books" },
  "explore.in": { id: "di", en: "in" },
  "explore.matching": { id: "untuk", en: "matching" },

  // === Favorites ===
  "favorites.title": { id: "Perpustakaan Saya", en: "My Library" },
  "favorites.subtitle": { id: "Buku tersimpan dan favoritmu", en: "Your saved books and favorites" },
  "favorites.loginRequired": { id: "Login Diperlukan", en: "Login Required" },
  "favorites.loginMsg": {
    id: "Masuk untuk mengakses koleksi ringkasan yang disimpan dan lanjutkan mendengarkan.",
    en: "Sign in to access your library of saved summaries and continue listening where you left off.",
  },
  "favorites.signin": { id: "Masuk", en: "Sign In" },
  "favorites.noFavorites": { id: "Belum ada favorit", en: "No favorites yet" },
  "favorites.noFavorites.sub": { id: "Mulai jelajahi untuk membangun koleksimu.", en: "Start exploring to build your library." },
  "favorites.exploreBooks": { id: "Jelajahi Buku", en: "Explore Books" },

  // === Profile ===
  "profile.title": { id: "Profil", en: "Profile" },
  "profile.welcome": { id: "Selamat Datang di Storify", en: "Welcome to Storify" },
  "profile.welcomeMsg": { id: "Masuk untuk menyinkronkan progres di semua perangkat.", en: "Sign in to sync your progress across devices." },
  "profile.signinSignup": { id: "Masuk / Daftar", en: "Sign In / Sign Up" },
  "profile.accountSettings": { id: "Pengaturan Akun", en: "Account Settings" },
  "profile.editName": { id: "Nama Lengkap", en: "Full Name" },
  "profile.email": { id: "Email", en: "Email" },
  "profile.changePassword": { id: "Ubah Kata Sandi", en: "Change Password" },
  "profile.currentPassword": { id: "Kata Sandi Saat Ini", en: "Current Password" },
  "profile.newPassword": { id: "Kata Sandi Baru", en: "New Password" },
  "profile.confirmPassword": { id: "Konfirmasi Kata Sandi", en: "Confirm Password" },
  "profile.save": { id: "Simpan", en: "Save" },
  "profile.saved": { id: "Tersimpan!", en: "Saved!" },
  "profile.deleteAccount": { id: "Hapus Akun", en: "Delete Account" },
  "profile.deleteAccountWarning": { id: "Tindakan ini tidak dapat dibatalkan. Semua data Anda akan dihapus.", en: "This action cannot be undone. All your data will be deleted." },
  "profile.privacy": { id: "Privasi & Keamanan", en: "Privacy & Security" },
  "profile.privacyDesc": { id: "Kami menghargai privasi Anda. Data Anda aman bersama kami.", en: "We value your privacy. Your data is safe with us." },
  "profile.dataCollected": { id: "Data yang Kami Kumpulkan", en: "Data We Collect" },
  "profile.dataCollectedDesc": { id: "Email, nama, dan progres mendengarkan Anda untuk menyinkronkan antar perangkat.", en: "Email, name, and your listening progress to sync across devices." },
  "profile.dataSecurity": { id: "Keamanan Data", en: "Data Security" },
  "profile.dataSecurityDesc": { id: "Semua data dienkripsi dan disimpan dengan aman di server kami.", en: "All data is encrypted and stored securely on our servers." },
  "profile.dataControl": { id: "Kontrol Data Anda", en: "Your Data Control" },
  "profile.dataControlDesc": { id: "Anda dapat menghapus akun dan semua data kapan saja melalui Pengaturan Akun.", en: "You can delete your account and all data at any time via Account Settings." },
  "profile.help": { id: "Bantuan & Dukungan", en: "Help & Support" },
  "profile.faq": { id: "Pertanyaan Umum", en: "FAQ" },
  "profile.faq1q": { id: "Bagaimana cara mendengarkan audiobook?", en: "How do I listen to audiobooks?" },
  "profile.faq1a": { id: "Pilih buku, lalu tekan tombol \"Dengarkan Ringkasan\" untuk memutar audio.", en: "Select a book, then press the \"Listen to Summary\" button to play audio." },
  "profile.faq2q": { id: "Apakah progres saya tersimpan?", en: "Is my progress saved?" },
  "profile.faq2a": { id: "Ya, jika Anda login, progres akan tersinkronisasi di semua perangkat.", en: "Yes, if you're logged in, your progress is synced across all devices." },
  "profile.faq3q": { id: "Bagaimana cara berlangganan Premium?", en: "How do I subscribe to Premium?" },
  "profile.faq3a": { id: "Kunjungi halaman Premium dari menu navigasi bawah.", en: "Visit the Premium page from the bottom navigation menu." },
  "profile.contactSupport": { id: "Hubungi Dukungan", en: "Contact Support" },
  "profile.contactEmail": { id: "Email: support@storify.id", en: "Email: support@storify.id" },
  "profile.language": { id: "Bahasa", en: "Language" },
  "profile.darkMode": { id: "Mode Malam", en: "Night Mode" },
  "profile.signout": { id: "Keluar", en: "Sign Out" },
  "profile.signingOut": { id: "Keluar...", en: "Signing out..." },

  // === Subscription ===
  "sub.title": { id: "Storify Premium", en: "Storify Premium" },
  "sub.subtitle": {
    id: "Nikmati akses tanpa batas ke ratusan audiobook berkualitas",
    en: "Enjoy unlimited access to hundreds of quality audiobooks",
  },
  "sub.status": { id: "Status Akses Anda", en: "Your Access Status" },
  "sub.statusLabel": { id: "Status:", en: "Status:" },
  "sub.premium": { id: "Premium", en: "Premium" },
  "sub.free": { id: "Free", en: "Free" },
  "sub.guest": { id: "Guest", en: "Guest" },
  "sub.booksListened": { id: "Buku Didengarkan:", en: "Books Listened:" },
  "sub.validUntil": { id: "Berlaku Sampai:", en: "Valid Until:" },
  "sub.unlimitedAudiobook": { id: "Unlimited Audiobook", en: "Unlimited Audiobook" },
  "sub.unlimitedDesc": { id: "Akses semua koleksi tanpa batasan", en: "Access the entire collection without limits" },
  "sub.continueListen": { id: "Continue Listening", en: "Continue Listening" },
  "sub.continueDesc": { id: "Lanjutkan dari posisi terakhir", en: "Resume from your last position" },
  "sub.allCategories": { id: "Semua Kategori", en: "All Categories" },
  "sub.allCategoriesDesc": { id: "Akses lengkap semua genre", en: "Full access to every genre" },

  // Subscription - Auth Gate
  "sub.loginToSubscribe": { id: "Login untuk Berlangganan", en: "Login to Subscribe" },
  "sub.loginToSubscribeMsg": {
    id: "Masuk atau buat akun terlebih dahulu untuk memilih paket dan melanjutkan pembayaran.",
    en: "Sign in or create an account first to choose a plan and proceed with payment.",
  },
  "sub.signin": { id: "Masuk", en: "Sign In" },
  "sub.signup": { id: "Daftar Sekarang", en: "Sign Up Now" },

  // Subscription - Tabs
  "sub.active": { id: "Aktif", en: "Active" },
  "sub.maintenance": { id: "Maintenance", en: "Maintenance" },

  // Subscription - Comparison
  "sub.comparison": { id: "Perbandingan Paket", en: "Plan Comparison" },
  "sub.comparisonDesc": { id: "Pilih paket yang sesuai dengan kebutuhanmu", en: "Choose the plan that suits your needs" },
  "sub.feature": { id: "Fitur", en: "Feature" },
  "sub.bookLimit": { id: "Batas Buku", en: "Book Limit" },
  "sub.1book": { id: "1 buku", en: "1 book" },
  "sub.3books": { id: "3 buku", en: "3 books" },
  "sub.unlimited": { id: "Unlimited", en: "Unlimited" },
  "sub.skipSeconds": { id: "Skip ±15 Detik", en: "Skip ±15 Seconds" },

  // Subscription - FAQ
  "sub.faq": { id: "Pertanyaan Umum", en: "FAQ" },
  "sub.faq1q": { id: "Bagaimana cara membayar?", en: "How do I pay?" },
  "sub.faq1a": {
    id: "Pilih paket langganan, lalu scan QR Code QRIS menggunakan aplikasi e-wallet favorit Anda seperti GoPay, OVO, DANA, ShopeePay, LinkAja, atau mobile banking.",
    en: "Choose a subscription plan, then scan the QRIS QR Code using your favorite e-wallet app such as GoPay, OVO, DANA, ShopeePay, LinkAja, or mobile banking.",
  },
  "sub.faq2q": { id: "Apakah pembayaran aman?", en: "Is the payment secure?" },
  "sub.faq2a": {
    id: "Ya, semua transaksi QRIS diproses secara aman melalui sistem pembayaran yang terdaftar di Bank Indonesia.",
    en: "Yes, all QRIS transactions are securely processed through payment systems registered with Bank Indonesia.",
  },
  "sub.faq3q": { id: "Berapa lama waktu untuk membayar?", en: "How long do I have to pay?" },
  "sub.faq3a": {
    id: "Anda memiliki waktu 60 menit setelah membuat pembayaran. Jika kedaluwarsa, Anda bisa membuat pembayaran baru.",
    en: "You have 60 minutes after creating a payment. If it expires, you can create a new payment.",
  },
  "sub.faq4q": { id: "Apa yang terjadi setelah langganan habis?", en: "What happens when my subscription expires?" },
  "sub.faq4a": {
    id: "Akun Anda akan kembali ke mode Free dengan batasan 3 buku. Anda dapat memperbarui langganan kapan saja.",
    en: "Your account will revert to Free mode with a 3-book limit. You can renew your subscription at any time.",
  },

  // === Auth - Sign In ===
  "auth.signIn": { id: "Masuk", en: "Sign In" },
  "auth.signInDesc": { id: "Masuk ke akun Storify Insights Anda", en: "Sign in to your Storify Insights account" },
  "auth.email": { id: "Email", en: "Email" },
  "auth.password": { id: "Password", en: "Password" },
  "auth.processing": { id: "Memproses...", en: "Processing..." },
  "auth.orSignInWith": { id: "Atau masuk dengan", en: "Or sign in with" },
  "auth.noAccount": { id: "Belum punya akun?", en: "Don't have an account?" },
  "auth.register": { id: "Daftar", en: "Sign Up" },
  "auth.emailNotVerified": { id: "Email belum diverifikasi", en: "Email not yet verified" },
  "auth.checkEmailVerify": {
    id: "Silakan cek email Anda dan klik link verifikasi terlebih dahulu.",
    en: "Please check your email and click the verification link first.",
  },
  "auth.resendVerification": { id: "Kirim Ulang Email Verifikasi", en: "Resend Verification Email" },
  "auth.sending": { id: "Mengirim...", en: "Sending..." },
  "auth.googleNotConfigured": { id: "Google Login belum dikonfigurasi", en: "Google Login not configured" },

  // === Auth - Sign Up ===
  "auth.signUp": { id: "Daftar Akun", en: "Create Account" },
  "auth.signUpDesc": { id: "Buat akun Storify Insights Anda", en: "Create your Storify Insights account" },
  "auth.fullName": { id: "Nama Lengkap", en: "Full Name" },
  "auth.confirmPassword": { id: "Konfirmasi Password", en: "Confirm Password" },
  "auth.creating": { id: "Membuat akun...", en: "Creating account..." },
  "auth.hasAccount": { id: "Sudah punya akun?", en: "Already have an account?" },
  "auth.signInLink": { id: "Masuk", en: "Sign In" },

  // Auth - Email Verification
  "auth.checkEmail": { id: "Cek Email Anda", en: "Check Your Email" },
  "auth.verificationSent": {
    id: "Kami telah mengirim link verifikasi ke",
    en: "We sent a verification link to",
  },
  "auth.clickToActivate": {
    id: "Klik link di email untuk mengaktifkan akun Anda. Cek juga folder spam jika tidak menemukan email.",
    en: "Click the link in the email to activate your account. Also check your spam folder if you can't find the email.",
  },
  "auth.resendEmail": { id: "Kirim Ulang Email", en: "Resend Email" },
  "auth.goToLogin": { id: "Ke Halaman Login", en: "Go to Login" },

  // === Book Detail ===
  "book.notFound": { id: "Buku tidak ditemukan", en: "Book not found" },

  // === Not Found ===
  "notFound.title": { id: "Halaman Tidak Ditemukan", en: "Page Not Found" },
  "notFound.message": {
    id: "Halaman yang Anda cari tidak ada atau sudah dipindahkan.",
    en: "The page you're looking for doesn't exist or has been moved.",
  },
  "notFound.returnHome": { id: "Kembali ke Home", en: "Return Home" },

  // === Listening Limit Modal ===
  "limit.title": { id: "Batas Mendengarkan Tercapai", en: "Listening Limit Reached" },
  "limit.loginMsg": {
    id: "Login untuk mendapatkan akses lebih banyak audiobook, atau berlangganan untuk akses unlimited!",
    en: "Login to get access to more audiobooks, or subscribe for unlimited access!",
  },
  "limit.loginBtn": { id: "Login (3 Buku Gratis)", en: "Login (3 Free Books)" },
  "limit.subscribeBtn": { id: "Berlangganan Premium", en: "Subscribe Premium" },
  "limit.upgradeMsg": {
    id: "Upgrade ke Premium untuk menikmati unlimited audiobook tanpa batasan!",
    en: "Upgrade to Premium to enjoy unlimited audiobooks without any limits!",
  },
  "limit.later": { id: "Nanti saja", en: "Maybe Later" },

  // === Payment Components (QRIS/DOKU shared) ===
  "pay.alreadySubscribed": { id: "Anda Sudah Berlangganan!", en: "You're Already Subscribed!" },
  "pay.activeUntil": { id: "Langganan aktif sampai:", en: "Active subscription until:" },
  "pay.unlimitedListening": { id: "Unlimited Listening", en: "Unlimited Listening" },
  "pay.paymentSuccess": { id: "Pembayaran Berhasil!", en: "Payment Successful!" },
  "pay.thankYou": { id: "Terima kasih telah berlangganan Storify Premium", en: "Thank you for subscribing to Storify Premium" },
  "pay.enjoyUnlimited": {
    id: "Sekarang Anda dapat menikmati unlimited audiobook tanpa batasan!",
    en: "You can now enjoy unlimited audiobooks without limits!",
  },
  "pay.startListening": { id: "Mulai Mendengarkan", en: "Start Listening" },
  "pay.timeExpired": { id: "Waktu Habis", en: "Time Expired" },
  "pay.paymentFailed": { id: "Pembayaran Gagal", en: "Payment Failed" },
  "pay.expiredMsg": {
    id: "QR Code QRIS sudah kedaluwarsa. Silakan coba lagi.",
    en: "QRIS QR Code has expired. Please try again.",
  },
  "pay.failedMsg": {
    id: "Terjadi kesalahan dalam pembayaran. Silakan coba lagi.",
    en: "An error occurred during payment. Please try again.",
  },
  "pay.tryAgain": { id: "Coba Lagi", en: "Try Again" },

  // === Toast Messages ===
  "toast.success": { id: "Berhasil!", en: "Success!" },
  "toast.signedIn": { id: "Anda telah berhasil masuk.", en: "You have successfully signed in." },
  "toast.welcome": { id: "Selamat datang", en: "Welcome" },
  "toast.loginFailed": { id: "Login Gagal", en: "Login Failed" },
  "toast.googleFailed": { id: "Gagal masuk dengan Google. Silakan coba lagi.", en: "Failed to sign in with Google. Please try again." },
  "toast.resendFailed": { id: "Gagal mengirim ulang email verifikasi", en: "Failed to resend verification email" },
} as const;

export type TranslationKey = keyof typeof translations;

let currentLocale: Locale = (typeof window !== "undefined"
  ? (localStorage.getItem("storify-lang") as Locale)
  : null) || "id";

const listeners = new Set<() => void>();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  if (typeof window !== "undefined") {
    localStorage.setItem("storify-lang", locale);
  }
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function t(key: TranslationKey): string {
  const entry = translations[key];
  return entry?.[currentLocale] ?? key;
}
