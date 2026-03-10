import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  BookOpen,
  CreditCard,
  TrendingUp,
  Activity,
  Handshake,
  LogOut,
  Shield,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ============================================
// Admin Auth
// ============================================

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Login gagal");
      }
      return res.json();
    },
    onSuccess: () => onLogin(),
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <CardTitle className="text-white text-lg">Admin Dashboard</CardTitle>
          <p className="text-gray-400 text-sm">Storify Insights</p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              loginMutation.mutate();
            }}
            className="space-y-4"
          >
            <Input
              type="email"
              placeholder="Email admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Masuk..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Dashboard Components
// ============================================

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#14b8a6"];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

function StatsCards() {
  const { data } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (!data) return null;

  const stats = [
    { label: "Total Users", value: data.totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Total Buku", value: data.totalBooks, icon: BookOpen, color: "text-green-400" },
    { label: "Subscription Aktif", value: data.activeSubscriptions, icon: TrendingUp, color: "text-purple-400" },
    { label: "Transaksi Dibayar", value: data.paidTransactions, icon: CreditCard, color: "text-yellow-400" },
    { label: "Total Revenue", value: formatCurrency(data.totalRevenue || 0), icon: CreditCard, color: "text-emerald-400" },
    { label: "Total Partner", value: data.totalPartners, icon: Handshake, color: "text-pink-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-gray-400 text-xs">{s.label}</span>
            </div>
            <p className="text-white text-lg font-bold">{s.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DailyActivityChart() {
  const { data } = useQuery({
    queryKey: ["admin-daily-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats/daily", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (!data || data.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-sm">Aktivitas Harian (30 hari)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">Belum ada data</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
    count: d.count,
  }));

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white text-sm">Aktivitas Harian (30 hari)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
            <YAxis stroke="#9ca3af" fontSize={10} />
            <Tooltip
              contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#fff" }}
            />
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ActionDistributionChart() {
  const { data } = useQuery({
    queryKey: ["admin-action-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats/actions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (!data || data.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-sm">Distribusi Aksi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">Belum ada data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white text-sm">Distribusi Aksi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="action" cx="50%" cy="50%" outerRadius={80} label={false}>
                {data.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2">
            {data.map((d: any, i: number) => (
              <Badge key={d.action} variant="outline" className="border-gray-700 text-gray-300 text-xs">
                <span className="w-2 h-2 rounded-full mr-1" style={{ background: COLORS[i % COLORS.length], display: "inline-block" }} />
                {d.action} ({d.count})
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserList() {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data } = useQuery({
    queryKey: ["admin-users", page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?limit=${limit}&offset=${page * limit}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (!data) return null;

  const totalPages = Math.ceil(data.total / limit);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Users className="w-4 h-4" /> Daftar User ({data.total})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left py-2 px-2">Nama</th>
                <th className="text-left py-2 px-2">Email</th>
                <th className="text-left py-2 px-2">Verified</th>
                <th className="text-left py-2 px-2">Terdaftar</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u: any) => (
                <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-2 px-2 text-white">{u.name || "-"}</td>
                  <td className="py-2 px-2 text-gray-300">{u.email}</td>
                  <td className="py-2 px-2">
                    <Badge variant={u.emailVerified ? "default" : "secondary"} className="text-xs">
                      {u.emailVerified ? "Ya" : "Belum"}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 text-gray-400">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("id-ID") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="border-gray-700 text-gray-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-gray-400 text-sm">
              Hal {page + 1} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="border-gray-700 text-gray-300"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityLogs() {
  const [page, setPage] = useState(0);
  const limit = 30;

  const { data } = useQuery({
    queryKey: ["admin-logs", page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/logs?limit=${limit}&offset=${page * limit}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (!data) return null;

  const totalPages = Math.ceil(data.total / limit);

  const actionColor: Record<string, string> = {
    login: "bg-green-600",
    logout: "bg-gray-600",
    view_book: "bg-blue-600",
    play_book: "bg-purple-600",
    favorite: "bg-pink-600",
    unfavorite: "bg-gray-500",
    create_payment: "bg-yellow-600",
    create_qris_payment: "bg-yellow-600",
    partner_register: "bg-emerald-600",
    page_view: "bg-cyan-600",
    listen_book: "bg-indigo-600",
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Activity className="w-4 h-4" /> Activity Logs ({data.total})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left py-2 px-2">Waktu</th>
                <th className="text-left py-2 px-2">User</th>
                <th className="text-left py-2 px-2">Aksi</th>
                <th className="text-left py-2 px-2">Resource</th>
                <th className="text-left py-2 px-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((log: any) => (
                <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-2 px-2 text-gray-400 whitespace-nowrap text-xs">
                    {new Date(log.createdAt).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2 px-2 text-gray-300 text-xs">
                    {log.userName || log.userEmail || log.userId?.slice(0, 8) || "-"}
                  </td>
                  <td className="py-2 px-2">
                    <Badge className={`text-xs text-white ${actionColor[log.action] || "bg-gray-600"}`}>
                      {log.action}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 text-gray-400 text-xs">
                    {log.resourceType ? `${log.resourceType}${log.resourceId ? `:${log.resourceId}` : ""}` : "-"}
                  </td>
                  <td className="py-2 px-2 text-gray-500 text-xs max-w-[200px] truncate">
                    {log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="border-gray-700 text-gray-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-gray-400 text-sm">
              Hal {page + 1} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="border-gray-700 text-gray-300"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PartnerAnalytics() {
  const { data } = useQuery({
    queryKey: ["admin-partners"],
    queryFn: async () => {
      const res = await fetch("/api/admin/partners", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (!data || data.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Handshake className="w-4 h-4" /> Partner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">Belum ada partner terdaftar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Handshake className="w-4 h-4" /> Partner ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left py-2 px-2">Nama</th>
                <th className="text-left py-2 px-2">Email</th>
                <th className="text-left py-2 px-2">Kode</th>
                <th className="text-left py-2 px-2">Komisi</th>
                <th className="text-left py-2 px-2">Penggunaan</th>
                <th className="text-left py-2 px-2">Total Pendapatan</th>
                <th className="text-left py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-2 px-2 text-white">{p.userName}</td>
                  <td className="py-2 px-2 text-gray-300">{p.userEmail}</td>
                  <td className="py-2 px-2">
                    <code className="bg-gray-800 px-2 py-0.5 rounded text-purple-400 text-xs">{p.code}</code>
                  </td>
                  <td className="py-2 px-2 text-gray-300">{p.commissionPercent}%</td>
                  <td className="py-2 px-2 text-gray-300">{p.usageCount}x</td>
                  <td className="py-2 px-2 text-emerald-400">{formatCurrency(p.totalEarnings || 0)}</td>
                  <td className="py-2 px-2">
                    <Badge variant={p.isActive ? "default" : "secondary"} className="text-xs">
                      {p.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionList() {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data } = useQuery({
    queryKey: ["admin-transactions", page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/transactions?limit=${limit}&offset=${page * limit}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (!data) return null;

  const totalPages = Math.ceil(data.total / limit);
  const statusColor: Record<string, string> = {
    paid: "bg-green-600",
    pending: "bg-yellow-600",
    expired: "bg-gray-600",
    failed: "bg-red-600",
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Transaksi ({data.total})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left py-2 px-2">Tanggal</th>
                <th className="text-left py-2 px-2">User</th>
                <th className="text-left py-2 px-2">Amount</th>
                <th className="text-left py-2 px-2">Gateway</th>
                <th className="text-left py-2 px-2">Referral</th>
                <th className="text-left py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((tx: any) => (
                <tr key={tx.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-2 px-2 text-gray-400 text-xs whitespace-nowrap">
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("id-ID") : "-"}
                  </td>
                  <td className="py-2 px-2 text-gray-300 text-xs">
                    {tx.paymentCustomerName || tx.userId?.slice(0, 8) || "-"}
                  </td>
                  <td className="py-2 px-2 text-white">{formatCurrency(tx.amount)}</td>
                  <td className="py-2 px-2 text-gray-400 text-xs">{tx.paymentGateway}</td>
                  <td className="py-2 px-2 text-gray-400 text-xs">{tx.referralCode || "-"}</td>
                  <td className="py-2 px-2">
                    <Badge className={`text-xs text-white ${statusColor[tx.status] || "bg-gray-600"}`}>
                      {tx.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="border-gray-700 text-gray-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-gray-400 text-sm">
              Hal {page + 1} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="border-gray-700 text-gray-300"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Admin Page
// ============================================

export default function Admin() {
  const queryClient = useQueryClient();

  const { data: adminAuth, isLoading } = useQuery({
    queryKey: ["admin-auth"],
    queryFn: async () => {
      const res = await fetch("/api/admin/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-auth"] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!adminAuth?.authenticated) {
    return (
      <AdminLogin
        onLogin={() => queryClient.invalidateQueries({ queryKey: ["admin-auth"] })}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-8">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 py-4 px-4 mb-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-purple-400" />
            <h1 className="text-white font-bold text-lg">Storify Admin</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            className="text-gray-400 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Stats */}
        <StatsCards />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DailyActivityChart />
          <ActionDistributionChart />
        </div>

        {/* Tabs for detailed views */}
        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="logs" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400">
              <Activity className="w-3 h-3 mr-1" /> Logs
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400">
              <Users className="w-3 h-3 mr-1" /> Users
            </TabsTrigger>
            <TabsTrigger value="partners" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400">
              <Handshake className="w-3 h-3 mr-1" /> Partners
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400">
              <CreditCard className="w-3 h-3 mr-1" /> Transaksi
            </TabsTrigger>
          </TabsList>
          <TabsContent value="logs">
            <ActivityLogs />
          </TabsContent>
          <TabsContent value="users">
            <UserList />
          </TabsContent>
          <TabsContent value="partners">
            <PartnerAnalytics />
          </TabsContent>
          <TabsContent value="transactions">
            <TransactionList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
