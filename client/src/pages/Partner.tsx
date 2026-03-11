import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Handshake, Copy, Check, DollarSign, Users, TrendingUp,
  Clock, CheckCircle, LogIn, UserPlus, Lock, Share2, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";

function apiUrl(path: string) {
  return path;
}

interface PartnerEarnings {
  totalEarnings: number;
  pendingEarnings: number;
  approvedEarnings: number;
  paidEarnings: number;
  totalTransactions: number;
  transactions: Array<{
    id: number;
    amount: number;
    commissionAmount: number;
    commissionStatus: string | null;
    referralCode: string | null;
    paidAt: string | null;
    createdAt: string | null;
  }>;
}

function usePartnerRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl("/api/partner/register"), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to register as partner");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-referral-code"] });
      queryClient.invalidateQueries({ queryKey: ["referral-stats"] });
      queryClient.invalidateQueries({ queryKey: ["partner-earnings"] });
    },
  });
}

function usePartnerEarnings() {
  const { user } = useAuth();
  return useQuery<PartnerEarnings>({
    queryKey: ["partner-earnings", user?.id],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/partner/earnings"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch earnings");
      return res.json();
    },
    enabled: !!user,
  });
}

function useMyReferralCode() {
  const { user } = useAuth();
  return useQuery<{ code: string }>({
    queryKey: ["my-referral-code", user?.id],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/referral/my-code"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch referral code");
      return res.json();
    },
    enabled: !!user,
  });
}

function useReferralStats() {
  const { user } = useAuth();
  return useQuery<{ code: string | null; totalUsage: number; discountPercent: number; commissionPercent: number }>({
    queryKey: ["referral-stats", user?.id],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/referral/stats"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch referral stats");
      return res.json();
    },
    enabled: !!user,
  });
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export default function Partner() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: referralCode } = useMyReferralCode();
  const { data: stats } = useReferralStats();
  const { data: earnings, isLoading: earningsLoading } = usePartnerEarnings();
  const registerPartner = usePartnerRegister();

  const isPartner = stats && stats.commissionPercent >= 10;

  const handleCopyCode = async () => {
    if (!referralCode?.code) return;
    await navigator.clipboard.writeText(referralCode.code);
    setCopied(true);
    toast({ title: "Kode disalin!", description: "Kode referral sudah disalin ke clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!referralCode?.code) return;
    const shareText = `Dengarkan audiobook gratis di Storify! Gunakan kode referral saya "${referralCode.code}" untuk dapat diskon 10%. Download sekarang: https://app.storify.asia`;
    if (navigator.share) {
      await navigator.share({ title: "Storify Partner", text: shareText });
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Teks disalin!", description: "Teks promosi sudah disalin ke clipboard" });
    }
  };

  const handleRegister = async () => {
    try {
      await registerPartner.mutateAsync();
      toast({ title: "Berhasil!", description: "Anda sekarang terdaftar sebagai Partner Storify" });
    } catch {
      toast({ title: "Gagal", description: "Tidak dapat mendaftar sebagai partner", variant: "destructive" });
    }
  };

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <SEO
          title="Partner Storify"
          description="Bergabung sebagai Partner Storify dan dapatkan komisi 10% dari setiap subscription melalui kode referral Anda."
          canonical="/partner"
        />
        <div className="container max-w-4xl mx-auto px-4 py-8 pb-24 space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
              <Handshake className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">Partner Storify</h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Dapatkan komisi 10% dari setiap subscription yang menggunakan kode referral Anda
            </p>
          </div>

          <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Login untuk Bergabung</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Login atau buat akun untuk mendaftar sebagai Partner Storify
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => setLocation("/auth/signin")} className="gap-2">
                  <LogIn className="w-4 h-4" /> Masuk
                </Button>
                <Button variant="outline" onClick={() => setLocation("/auth/signup")} className="gap-2">
                  <UserPlus className="w-4 h-4" /> Daftar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Not yet registered as partner
  if (!isPartner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <SEO
          title="Partner Storify"
          description="Bergabung sebagai Partner Storify dan dapatkan komisi 10% dari setiap subscription melalui kode referral Anda."
          canonical="/partner"
        />
        <div className="container max-w-4xl mx-auto px-4 py-8 pb-24 space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
              <Handshake className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">Jadi Partner Storify</h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Bergabunglah sebagai Partner dan dapatkan komisi dari setiap subscription
            </p>
          </div>

          {/* How it works */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                  <Share2 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">1. Daftar & Bagikan</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Daftar sebagai Partner dan dapatkan kode referral unik Anda
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold">2. Ajak Teman</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Sebarkan kode Anda. Teman yang mendaftar dapat diskon 10%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-3">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold">3. Dapatkan Komisi</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Terima komisi 10% dari setiap subscription yang menggunakan kode Anda
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Register CTA */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Siap Bergabung?</h3>
                <p className="text-muted-foreground">
                  Gratis, tanpa syarat. Langsung mulai dapatkan komisi.
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleRegister}
                disabled={registerPartner.isPending}
                className="gap-2 text-lg px-8"
              >
                {registerPartner.isPending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Mendaftar...</>
                ) : (
                  <><Handshake className="w-5 h-5" /> Daftar Sebagai Partner</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Ketentuan */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Ketentuan Partner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>Komisi <strong>10%</strong> dari setiap transaksi subscription yang menggunakan kode referral</li>
                <li>Pelanggan yang memakai kode Anda mendapat <strong>diskon 10%</strong></li>
                <li>Komisi dihitung dari jumlah yang dibayar setelah diskon</li>
                <li>Tidak ada batasan jumlah penggunaan kode</li>
                <li>Minimum pencairan: <strong>Rp 50.000</strong></li>
                <li>Pencairan dilakukan secara berkala oleh tim Storify</li>
                <li>Storify berhak menonaktifkan kode jika terjadi penyalahgunaan</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Partner dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <SEO
        title="Partner Storify"
        description="Bergabung sebagai Partner Storify dan dapatkan komisi 10% dari setiap subscription melalui kode referral Anda."
        canonical="/partner"
      />
      <div className="container max-w-4xl mx-auto px-4 py-8 pb-24 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
            <Handshake className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Partner Dashboard</h1>
          <Badge variant="default" className="bg-green-600">Partner Aktif</Badge>
        </div>

        {/* Referral Code Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="text-center pb-2">
            <CardTitle>Kode Referral Anda</CardTitle>
            <CardDescription>Bagikan kode ini untuk mendapat komisi 10%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="bg-background border-2 border-primary/30 rounded-xl px-6 py-3 text-2xl font-mono font-bold tracking-wider">
                {referralCode?.code || "..."}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                className="h-12 w-12"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleCopyCode} className="gap-2">
                <Copy className="w-4 h-4" /> Salin Kode
              </Button>
              <Button onClick={handleShare} className="gap-2">
                <Share2 className="w-4 h-4" /> Bagikan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <Users className="w-5 h-5 mx-auto text-blue-500 mb-1" />
              <p className="text-2xl font-bold">{stats?.totalUsage || 0}</p>
              <p className="text-xs text-muted-foreground">Kode Digunakan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <TrendingUp className="w-5 h-5 mx-auto text-green-500 mb-1" />
              <p className="text-2xl font-bold">{formatCurrency(earnings?.totalEarnings || 0)}</p>
              <p className="text-xs text-muted-foreground">Total Komisi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <Clock className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
              <p className="text-2xl font-bold">{formatCurrency(earnings?.approvedEarnings || 0)}</p>
              <p className="text-xs text-muted-foreground">Siap Dicairkan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <CheckCircle className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
              <p className="text-2xl font-bold">{formatCurrency(earnings?.paidEarnings || 0)}</p>
              <p className="text-xs text-muted-foreground">Sudah Dicairkan</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Riwayat Komisi
            </CardTitle>
            <CardDescription>Transaksi yang menggunakan kode referral Anda</CardDescription>
          </CardHeader>
          <CardContent>
            {earningsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !earnings?.transactions.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Belum ada transaksi</p>
                <p className="text-sm">Bagikan kode referral Anda untuk mulai mendapat komisi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {earnings.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        Subscription {formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.createdAt
                          ? new Date(tx.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric", month: "short", year: "numeric",
                            })
                          : "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        +{formatCurrency(tx.commissionAmount || 0)}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          tx.commissionStatus === "approved" && "border-green-400 text-green-600",
                          tx.commissionStatus === "pending" && "border-yellow-400 text-yellow-600",
                          tx.commissionStatus === "paid" && "border-emerald-400 text-emerald-600"
                        )}
                      >
                        {tx.commissionStatus === "approved" ? "Disetujui" :
                         tx.commissionStatus === "pending" ? "Menunggu" :
                         tx.commissionStatus === "paid" ? "Dicairkan" : tx.commissionStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Cara Kerja Partner</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Bagikan <strong>kode referral</strong> Anda ke teman, komunitas, atau media sosial</li>
              <li>Pengguna baru memasukkan kode saat berlangganan dan mendapat <strong>diskon 10%</strong></li>
              <li>Anda mendapatkan <strong>komisi 10%</strong> dari setiap pembayaran subscription</li>
              <li>Komisi akan dicatat otomatis dan bisa dicairkan</li>
            </ol>
          </CardContent>
        </Card>

        {/* Ketentuan Partner */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ketentuan Partner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-1">Komisi</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Partner mendapat komisi <strong>10%</strong> dari setiap transaksi subscription yang menggunakan kode referral</li>
                <li>Komisi dihitung dari jumlah yang dibayarkan pelanggan setelah diskon</li>
                <li>Tidak ada batasan jumlah penggunaan kode referral</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Diskon untuk Pelanggan</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Pelanggan yang menggunakan kode referral mendapat <strong>diskon 10%</strong></li>
                <li>Diskon berlaku untuk semua paket langganan (Mingguan, Bulanan, Tahunan)</li>
                <li>Pengguna tidak dapat menggunakan kode referral milik sendiri</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Pencairan Komisi</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Komisi berstatus <strong>"Menunggu"</strong> saat pembayaran masuk</li>
                <li>Komisi berubah menjadi <strong>"Disetujui"</strong> setelah pembayaran terverifikasi</li>
                <li>Pencairan dilakukan secara berkala oleh tim Storify</li>
                <li>Minimum pencairan: <strong>Rp 50.000</strong></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Ketentuan Umum</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Partner dilarang melakukan spam atau menyebarkan kode dengan cara yang melanggar hukum</li>
                <li>Storify berhak menonaktifkan kode referral jika terjadi penyalahgunaan</li>
                <li>Ketentuan dapat berubah sewaktu-waktu dengan pemberitahuan sebelumnya</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
