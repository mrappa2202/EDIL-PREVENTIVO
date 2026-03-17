import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dashboardApi, clientsApi } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import {
    FileText,
    Users,
    Euro,
    AlertTriangle,
    Plus,
    ArrowRight,
    TrendingUp,
    Clock,
} from "lucide-react";
import { cn } from "../lib/utils";

const statusLabels = {
    draft: "Bozza",
    sent: "Inviato",
    accepted: "Accettato",
    rejected: "Rifiutato",
    invoiced: "Fatturato",
};

const statusStyles = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    accepted: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    invoiced: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, clientsRes] = await Promise.all([
                dashboardApi.getStats(),
                clientsApi.getAll(),
            ]);
            setStats(statsRes.data);
            setClients(clientsRes.data);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
        }).format(value || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="space-y-8" data-testid="dashboard-loading">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in" data-testid="dashboard-page">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Panoramica della tua attività
                    </p>
                </div>
                <Button asChild data-testid="new-quote-btn">
                    <Link to="/preventivi/nuovo">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuovo Preventivo
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="card-hover" data-testid="stat-quotes">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Preventivi Totali
                                </p>
                                <p className="text-3xl font-bold font-heading mt-2">
                                    {stats?.quotes?.total || 0}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-sm">
                                    <span className="text-green-600">{stats?.quotes?.accepted || 0} accettati</span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-yellow-600">{stats?.quotes?.sent || 0} in attesa</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-hover" data-testid="stat-revenue">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Fatturato Mensile
                                </p>
                                <p className="text-3xl font-bold font-heading mt-2">
                                    {formatCurrency(stats?.monthly_revenue)}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-sm text-success">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>Da preventivi accettati</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                                <Euro className="w-6 h-6 text-success" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-hover" data-testid="stat-clients">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Clienti
                                </p>
                                <p className="text-3xl font-bold font-heading mt-2">
                                    {stats?.clients_count || 0}
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Clienti registrati
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center">
                                <Users className="w-6 h-6 text-secondary-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn("card-hover", stats?.low_stock_alerts > 0 && "border-warning")} data-testid="stat-alerts">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Avvisi Scorte
                                </p>
                                <p className="text-3xl font-bold font-heading mt-2">
                                    {stats?.low_stock_alerts || 0}
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Materiali sotto soglia
                                </p>
                            </div>
                            <div className={cn(
                                "w-12 h-12 rounded-lg flex items-center justify-center",
                                stats?.low_stock_alerts > 0 ? "bg-warning/10" : "bg-muted"
                            )}>
                                <AlertTriangle className={cn(
                                    "w-6 h-6",
                                    stats?.low_stock_alerts > 0 ? "text-warning" : "text-muted-foreground"
                                )} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Quotes & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Quotes */}
                <Card className="lg:col-span-2" data-testid="recent-quotes">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="font-heading">Preventivi Recenti</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/preventivi">
                                Vedi tutti
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {stats?.recent_quotes?.length > 0 ? (
                            <div className="space-y-4">
                                {stats.recent_quotes.map((quote) => {
                                    const client = clients.find(c => c.id === quote.client_id);
                                    return (
                                        <Link
                                            key={quote.id}
                                            to={`/preventivi/${quote.id}`}
                                            className="flex items-center justify-between p-4 rounded-lg bg-surface hover:bg-surface-highlight transition-colors"
                                            data-testid={`quote-item-${quote.id}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {quote.quote_number}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {client?.company_name || client?.name || "Cliente"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDate(quote.date)}
                                                    </p>
                                                </div>
                                                <Badge className={statusStyles[quote.status]}>
                                                    {statusLabels[quote.status]}
                                                </Badge>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground">Nessun preventivo ancora</p>
                                <Button asChild className="mt-4">
                                    <Link to="/preventivi/nuovo">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Crea il primo preventivo
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card data-testid="quick-actions">
                    <CardHeader className="pb-4">
                        <CardTitle className="font-heading">Azioni Rapide</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start h-12" asChild>
                            <Link to="/preventivi/nuovo">
                                <Plus className="w-4 h-4 mr-3" />
                                Nuovo Preventivo
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12" asChild>
                            <Link to="/clienti">
                                <Users className="w-4 h-4 mr-3" />
                                Gestisci Clienti
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12" asChild>
                            <Link to="/materiali">
                                <AlertTriangle className="w-4 h-4 mr-3" />
                                Controlla Scorte
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12" asChild>
                            <Link to="/spese">
                                <Euro className="w-4 h-4 mr-3" />
                                Registra Spesa
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Payments Alert */}
            {stats?.pending_payments > 0 && (
                <Card className="border-warning bg-warning/5" data-testid="pending-payments-alert">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-warning" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-foreground">Pagamenti in Sospeso</p>
                                <p className="text-sm text-muted-foreground">
                                    Hai {formatCurrency(stats.pending_payments)} in pagamenti da saldare ai dipendenti
                                </p>
                            </div>
                            <Button variant="outline" asChild>
                                <Link to="/dipendenti">
                                    Gestisci
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
