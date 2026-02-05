import { XenditPayment } from "@/components/XenditPayment";
import { useActiveSubscription, useListeningStatus } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Music, Headphones, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function Subscription() {
  const { user } = useAuth();
  const { data: listeningStatus } = useListeningStatus();
  const { data: activeSubscription } = useActiveSubscription();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto px-4 py-8 pb-24 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
            <Crown className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold">Storify Premium</h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Nikmati akses tanpa batas ke ratusan audiobook berkualitas
          </p>
        </div>

        {/* Current Status Card */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              Status Akses Anda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {listeningStatus && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={listeningStatus.hasSubscription ? "default" : "secondary"}>
                    {listeningStatus.hasSubscription ? "Premium" : user ? "Free" : "Guest"}
                  </Badge>
                </div>
                
                {!listeningStatus.hasSubscription && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Buku Didengarkan:</span>
                    <span className="font-medium">
                      {listeningStatus.listenCount} / {listeningStatus.limit ?? "∞"}
                    </span>
                  </div>
                )}

                {listeningStatus.hasSubscription && listeningStatus.subscriptionEndsAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Berlaku Sampai:</span>
                    <span className="font-medium">
                      {new Date(listeningStatus.subscriptionEndsAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                )}

                {!listeningStatus.canListen && !listeningStatus.hasSubscription && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{listeningStatus.reason}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Music className="w-8 h-8 mx-auto text-primary mb-2" />
              <h3 className="font-semibold">Unlimited Audiobook</h3>
              <p className="text-sm text-muted-foreground">
                Akses semua koleksi tanpa batasan
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-8 h-8 mx-auto text-primary mb-2" />
              <h3 className="font-semibold">Continue Listening</h3>
              <p className="text-sm text-muted-foreground">
                Lanjutkan dari posisi terakhir
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-primary mb-2" />
              <h3 className="font-semibold">Semua Kategori</h3>
              <p className="text-sm text-muted-foreground">
                Akses lengkap semua genre
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Xendit Payment Component */}
        <XenditPayment 
          onSuccess={() => {
            // Navigate to home or explore after successful payment
          }}
          onClose={() => {
            setLocation("/explore");
          }}
        />

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Perbandingan Paket</CardTitle>
            <CardDescription>
              Pilih paket yang sesuai dengan kebutuhanmu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Fitur</th>
                    <th className="text-center py-3 px-2">Guest</th>
                    <th className="text-center py-3 px-2">Free</th>
                    <th className="text-center py-3 px-2 bg-primary/5">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-2">Batas Buku</td>
                    <td className="text-center py-3 px-2">1 buku</td>
                    <td className="text-center py-3 px-2">3 buku</td>
                    <td className="text-center py-3 px-2 bg-primary/5 font-semibold text-primary">
                      Unlimited
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2">Continue Listening</td>
                    <td className="text-center py-3 px-2">✗</td>
                    <td className="text-center py-3 px-2">✓</td>
                    <td className="text-center py-3 px-2 bg-primary/5">✓</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2">Favorites</td>
                    <td className="text-center py-3 px-2">✗</td>
                    <td className="text-center py-3 px-2">✓</td>
                    <td className="text-center py-3 px-2 bg-primary/5">✓</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2">Semua Kategori</td>
                    <td className="text-center py-3 px-2">✓</td>
                    <td className="text-center py-3 px-2">✓</td>
                    <td className="text-center py-3 px-2 bg-primary/5">✓</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2">Skip ±15 Detik</td>
                    <td className="text-center py-3 px-2">✓</td>
                    <td className="text-center py-3 px-2">✓</td>
                    <td className="text-center py-3 px-2 bg-primary/5">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Pertanyaan Umum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">Bagaimana cara membayar?</h4>
              <p className="text-sm text-muted-foreground">
                Pilih paket langganan, lalu scan QR Code yang muncul menggunakan aplikasi e-wallet favorit Anda (GoPay, OVO, DANA, ShopeePay, LinkAja).
              </p>
            </div>
            <div>
              <h4 className="font-medium">Apakah pembayaran aman?</h4>
              <p className="text-sm text-muted-foreground">
                Ya, semua transaksi menggunakan QRIS yang dijamin keamanannya oleh Bank Indonesia.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Berapa lama QR Code berlaku?</h4>
              <p className="text-sm text-muted-foreground">
                QR Code berlaku selama 30 menit. Jika kedaluwarsa, Anda bisa membuat pembayaran baru.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Apa yang terjadi setelah langganan habis?</h4>
              <p className="text-sm text-muted-foreground">
                Akun Anda akan kembali ke mode Free dengan batasan 3 buku. Anda dapat memperbarui langganan kapan saja.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
