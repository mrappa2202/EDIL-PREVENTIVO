import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { clientsApi, quotesApi } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";
import {
    ArrowLeft,
    Building2,
    Phone,
    Mail,
    MapPin,
    FileText,
    CreditCard,
    Plus,
} from "lucide-react";

const statusLabels = {
    draft: "Bozza",
    sent: "Inviato",
    accepted: "Accettato",
    rejected: "Rifiutato",
    invoiced: "Fatturato",
};

const statusStyles = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    invoiced: "bg-purple-100 text-purple-700",
};

export default function ClientDetailPage() {
    const { id } = useParams();
    const [client, setClient] = useState(null);
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [clientRes, quotesRes] = await Promise.all([
                clientsApi.getOne(id),
                quotesApi.getAll({ client_id: id }),
            ]);
            setClient(clientRes.data);
            setQuotes(quotesRes.data);
        } catch (error) {
            toast.error("Errore nel caricamento dei dati");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("it-IT");
    };

    const calculateQuoteTotal = (quote) => {
        return quote.items?.reduce((sum, item) => {
            const lineTotal = item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100);
            const vat = lineTotal * (item.vat_percent || 22) / 100;
            return sum + lineTotal + vat;
        }, 0) || 0;
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
        }).format(value);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!client) {
        return (
            <div className="text-center py-16">
                <p className="text-muted-foreground">Cliente non trovato</p>
                <Button asChild className="mt-4">
                    <Link to="/clienti">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Torna ai clienti
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in" data-testid="client-detail-page">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/clienti">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">
                        {client.company_name || client.name}
                    </h1>
                    {client.company_name && client.name && (
                        <p className="text-muted-foreground">{client.name}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Client Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-heading">
                                <Building2 className="w-5 h-5 text-primary" />
                                Informazioni Aziendali
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-muted-foreground">Partita IVA</p>
                                <p className="font-medium">{client.vat_number || "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Codice Fiscale</p>
                                <p className="font-medium">{client.fiscal_code || "-"}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Indirizzo
                                </p>
                                <p className="font-medium">
                                    {[client.address, client.cap, client.city, client.province].filter(Boolean).join(", ") || "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> Telefono
                                </p>
                                <p className="font-medium">{client.phone || "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Mail className="w-4 h-4" /> Email
                                </p>
                                <p className="font-medium">{client.email || "-"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-heading">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Dati Fatturazione
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-muted-foreground">Codice SDI</p>
                                <p className="font-medium">{client.sdi_code || "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">PEC</p>
                                <p className="font-medium">{client.pec_email || "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Banca</p>
                                <p className="font-medium">{client.bank_name || "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">IBAN</p>
                                <p className="font-medium font-mono text-sm">{client.iban || "-"}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">Condizioni di Pagamento</p>
                                <p className="font-medium">{client.payment_terms || "-"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {client.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-heading">Note</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Quotes */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 font-heading">
                                <FileText className="w-5 h-5 text-primary" />
                                Preventivi
                            </CardTitle>
                            <Button size="sm" asChild>
                                <Link to={`/preventivi/nuovo?client=${id}`}>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Nuovo
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {quotes.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Nessun preventivo per questo cliente
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {quotes.map((quote) => (
                                        <Link
                                            key={quote.id}
                                            to={`/preventivi/${quote.id}`}
                                            className="block p-4 rounded-lg bg-surface hover:bg-surface-highlight transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium">{quote.quote_number}</span>
                                                <Badge className={statusStyles[quote.status]}>
                                                    {statusLabels[quote.status]}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <span>{formatDate(quote.date)}</span>
                                                <span className="font-medium text-foreground">
                                                    {formatCurrency(calculateQuoteTotal(quote))}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
