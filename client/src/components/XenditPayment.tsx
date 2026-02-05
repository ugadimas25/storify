import { useState, useEffect, useCallback } from "react";
import { 
  useSubscriptionPlans, 
  useCreatePayment, 
  usePaymentStatus,
  useActiveSubscription,
  useListeningStatus
} from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Crown, Music, Clock, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// Payment method logos
const PAYMENT_METHODS = [
  { name: "QRIS", logo: "📱" },
  { name: "GoPay", logo: "💚" },
  { name: "OVO", logo: "💜" },
  { name: "DANA", logo: "💙" },
  { name: "ShopeePay", logo: "🧡" },
  { name: "Virtual Account", logo: "🏦" },
  { name: "Retail Outlet", logo: "🏪" },
];

type PaymentState = "idle" | "pending" | "paid" | "expired" | "failed";

interface XenditPaymentProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export function XenditPayment({ onSuccess, onClose }: XenditPaymentProps) {
  const { user } = useAuth();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: activeSubscription } = useActiveSubscription();
  const { data: listeningStatus } = useListeningStatus();
  const createPayment = useCreatePayment();
  
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<number | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [paymentUrl, setPaymentUrl] = useState<string>("");

  // Poll payment status
  const { data: paymentStatus } = usePaymentStatus(
    currentTransaction, 
    paymentState === "pending"
  );

  // Handle payment status changes
  useEffect(() => {
    if (!paymentStatus) return;

    if (paymentStatus.status === "paid") {
      setPaymentState("paid");
      onSuccess?.();
    } else if (paymentStatus.status === "expired") {
      setPaymentState("expired");
    } else if (paymentStatus.status === "failed") {
      setPaymentState("failed");
    }

    // Update time left
    if (paymentStatus.expiredAt && paymentStatus.status === "pending") {
      const expiry = new Date(paymentStatus.expiredAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(remaining);
    }
  }, [paymentStatus, onSuccess]);

  // Countdown timer
  useEffect(() => {
    if (paymentState !== "pending" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPaymentState("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentState, timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format price to Indonesian Rupiah
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Handle plan selection and payment creation
  const handleSelectPlan = async (planId: number) => {
    if (!user) {
      alert("Silakan login terlebih dahulu untuk berlangganan");
      return;
    }

    setSelectedPlanId(planId);
    
    try {
      const transaction = await createPayment.mutateAsync(planId);
      setCurrentTransaction(transaction.id);
      setPaymentUrl(transaction.xenditInvoiceUrl || "");
      setPaymentState("pending");
      
      // Set initial countdown (24 hours)
      if (transaction.expiredAt) {
        const expiry = new Date(transaction.expiredAt).getTime();
        const now = Date.now();
        setTimeLeft(Math.max(0, Math.floor((expiry - now) / 1000)));
      } else {
        setTimeLeft(24 * 60 * 60); // Default 24 hours
      }
      
      // Open Xendit payment page in new tab
      if (transaction.xenditInvoiceUrl) {
        window.open(transaction.xenditInvoiceUrl, '_blank');
      }
    } catch (error: any) {
      console.error("Payment creation failed:", error);
      alert(error.message || "Gagal membuat pembayaran");
    }
  };

  // Reset payment state
  const handleReset = () => {
    setPaymentState("idle");
    setSelectedPlanId(null);
    setCurrentTransaction(null);
    setPaymentUrl("");
    setTimeLeft(0);
  };

  // If user has active subscription
  if (activeSubscription && new Date(activeSubscription.endDate) > new Date()) {
    return (
      <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-yellow-700 dark:text-yellow-400">Anda Sudah Berlangganan!</CardTitle>
          <CardDescription>
            Langganan aktif sampai: {new Date(activeSubscription.endDate).toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Music className="w-4 h-4 mr-2" />
            Unlimited Listening
          </Badge>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (plansLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Payment success state
  if (paymentState === "paid") {
    return (
      <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-green-700 dark:text-green-400 text-2xl">Pembayaran Berhasil!</CardTitle>
          <CardDescription className="text-green-600 dark:text-green-300">
            Terima kasih telah berlangganan Storify Premium
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Sekarang Anda dapat menikmati unlimited audiobook tanpa batasan!
          </p>
          <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">
            Mulai Mendengarkan
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Payment expired/failed state
  if (paymentState === "expired" || paymentState === "failed") {
    return (
      <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <CardTitle className="text-red-700 dark:text-red-400 text-2xl">
            {paymentState === "expired" ? "Waktu Habis" : "Pembayaran Gagal"}
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-300">
            {paymentState === "expired" 
              ? "QR Code sudah kedaluwarsa. Silakan coba lagi."
              : "Terjadi kesalahan dalam pembayaran. Silakan coba lagi."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={handleReset} variant="outline" className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Payment page display (pending payment)
  if (paymentState === "pending" && paymentUrl) {
    const selectedPlan = plans?.find(p => p.id === selectedPlanId);
    
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Selesaikan Pembayaran</CardTitle>
          <CardDescription>
            {selectedPlan?.name} - {formatPrice(selectedPlan?.price || 0)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment link */}
          <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
            <div className="text-center space-y-2">
              <p className="font-medium">Halaman pembayaran telah dibuka</p>
              <p className="text-sm text-muted-foreground">Silakan selesaikan pembayaran di tab baru</p>
            </div>
            <Button 
              onClick={() => window.open(paymentUrl, '_blank')}
              className="w-full max-w-xs"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Buka Halaman Pembayaran
            </Button>
          </div>

          {/* Countdown */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-lg font-medium">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className={cn(
                "font-mono text-xl",
                timeLeft < 3600 ? "text-red-500" : "text-orange-500"
              )}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Invoice akan kedaluwarsa dalam waktu di atas
            </p>
          </div>

          {/* Payment methods */}
          <div className="space-y-2">
            <p className="text-sm text-center text-muted-foreground">
              Metode pembayaran yang didukung:
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {PAYMENT_METHODS.map((method) => (
                <div 
                  key={method.name}
                  className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs"
                >
                  <span>{method.logo}</span>
                  <span className="text-[10px]">{method.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Menunggu pembayaran...
          </div>

          {/* Instructions */}
          <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
            <p className="font-medium">Cara Pembayaran:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Pilih metode pembayaran di halaman Xendit</li>
              <li>Selesaikan pembayaran sesuai instruksi</li>
              <li>Subscription akan aktif otomatis setelah pembayaran berhasil</li>
            </ol>
          </div>

          {/* Cancel button */}
          <Button variant="outline" onClick={handleReset} className="w-full">
            Batal
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Plan selection (idle state)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Pilih Paket Langganan</h2>
        <p className="text-muted-foreground">
          Nikmati unlimited audiobook dengan berlangganan Storify Premium
        </p>
        {listeningStatus && !listeningStatus.hasSubscription && (
          <Badge variant="outline" className="mt-2">
            {user 
              ? `Sisa ${listeningStatus.limit! - listeningStatus.listenCount} dari ${listeningStatus.limit} buku gratis`
              : `Guest: ${listeningStatus.listenCount}/${listeningStatus.limit} buku didengarkan`}
          </Badge>
        )}
      </div>

      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans?.map((plan) => {
          const isPopular = plan.name.toLowerCase().includes("bulanan");
          const pricePerDay = Math.round(plan.price / plan.durationDays);
          
          return (
            <Card 
              key={plan.id}
              className={cn(
                "relative transition-all hover:shadow-lg cursor-pointer",
                isPopular && "border-primary ring-2 ring-primary ring-offset-2",
                selectedPlanId === plan.id && "bg-primary/5"
              )}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  BEST VALUE
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.durationDays} hari</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div>
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(plan.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(pricePerDay)}/hari
                  </p>
                </div>
                
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Unlimited audiobook
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Akses semua kategori
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Continue listening
                  </li>
                </ul>

                <Button 
                  className="w-full"
                  variant={selectedPlanId === plan.id ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(plan.id);
                  }}
                  disabled={createPayment.isPending}
                >
                  {createPayment.isPending && selectedPlanId === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Pilih Paket"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Login prompt for guests */}
      {!user && (
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Anda harus login terlebih dahulu untuk berlangganan
          </p>
        </div>
      )}
    </div>
  );
}
