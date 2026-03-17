import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { quotesApi, clientsApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";
import {
    Plus,
    Search,
    FileText,
    MoreHorizontal,
    Pencil,
    Copy,
    Trash2,
    Download,
    Filter,
    X,
    Loader2,
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
    sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    accepted: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    invoiced: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function QuotesPage() {
    const [quotes, setQuotes] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: "",
        client_id: "",
    });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, quote: null });
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        try {
            const [quotesRes, clientsRes] = await Promise.all([
                quotesApi.getAll(filters),
                clientsApi.getAll(),
            ]);
            setQuotes(quotesRes.data);
            setClients(clientsRes.data);
        } catch (error) {
            toast.error("Errore nel caricamento dei preventivi");
        } finally {
            setLoading(false);
        }
    };

    const getClientName = (clientId) => {
        const client = clients.find((c) => c.id === clientId);
        return client?.company_name || client?.name || "Cliente sconosciuto";
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const calculateTotal = (quote) => {
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

    const handleDuplicate = async (quoteId) => {
        try {
            await quotesApi.duplicate(quoteId);
            toast.success("Preventivo duplicato");
            loadData();
        } catch (error) {
            toast.error("Errore nella duplicazione");
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.quote) return;
        try {
            await quotesApi.delete(deleteDialog.quote.id);
            toast.success("Preventivo eliminato");
            setDeleteDialog({ open: false, quote: null });
            loadData();
        } catch (error) {
            toast.error("Errore nell'eliminazione");
        }
    };

    const handleDownloadPdf = async (quoteId) => {
        setDownloadingId(quoteId);
        try {
            const response = await quotesApi.getPdf(quoteId);
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `preventivo-${quoteId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("PDF scaricato");
        } catch (error) {
            toast.error("Errore nel download del PDF");
        } finally {
            setDownloadingId(null);
        }
    };

    const clearFilters = () => {
        setFilters({ status: "", client_id: "" });
    };

    const hasFilters = filters.status || filters.client_id;

    return (
        <div className="space-y-6 animate-fade-in" data-testid="quotes-page">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">Preventivi</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestisci i tuoi preventivi
                    </p>
                </div>
                <Button asChild data-testid="new-quote-btn">
                    <Link to="/preventivi/nuovo">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuovo Preventivo
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filtra per:</span>
                </div>
                <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters((f) => ({ ...f, status: value }))}
                >
                    <SelectTrigger className="w-40" data-testid="filter-status">
                        <SelectValue placeholder="Stato" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="draft">Bozza</SelectItem>
                        <SelectItem value="sent">Inviato</SelectItem>
                        <SelectItem value="accepted">Accettato</SelectItem>
                        <SelectItem value="rejected">Rifiutato</SelectItem>
                        <SelectItem value="invoiced">Fatturato</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={filters.client_id}
                    onValueChange={(value) => setFilters((f) => ({ ...f, client_id: value }))}
                >
                    <SelectTrigger className="w-48" data-testid="filter-client">
                        <SelectValue placeholder="Cliente" />
                    </SelectTrigger>
                    <SelectContent>
                        {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                                {client.company_name || client.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="w-4 h-4 mr-1" />
                        Rimuovi filtri
                    </Button>
                )}
            </div>

            {/* Quotes List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6 h-24" />
                        </Card>
                    ))}
                </div>
            ) : quotes.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            Nessun preventivo trovato
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {hasFilters ? "Prova a modificare i filtri" : "Inizia creando il tuo primo preventivo"}
                        </p>
                        {!hasFilters && (
                            <Button asChild>
                                <Link to="/preventivi/nuovo">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Crea Preventivo
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {quotes.map((quote) => (
                        <Card key={quote.id} className="card-hover" data-testid={`quote-row-${quote.id}`}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <Link
                                                to={`/preventivi/${quote.id}`}
                                                className="font-medium text-foreground hover:text-primary transition-colors"
                                            >
                                                {quote.quote_number}
                                            </Link>
                                            <p className="text-sm text-muted-foreground">
                                                {getClientName(quote.client_id)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden md:block">
                                            <p className="font-medium">
                                                {formatCurrency(calculateTotal(quote))}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDate(quote.date)}
                                            </p>
                                        </div>
                                        <Badge className={statusStyles[quote.status]}>
                                            {statusLabels[quote.status]}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link to={`/preventivi/${quote.id}`}>
                                                        <Pencil className="w-4 h-4 mr-2" />
                                                        Modifica
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDuplicate(quote.id)}>
                                                    <Copy className="w-4 h-4 mr-2" />
                                                    Duplica
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleDownloadPdf(quote.id)}
                                                    disabled={downloadingId === quote.id}
                                                >
                                                    {downloadingId === quote.id ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Download className="w-4 h-4 mr-2" />
                                                    )}
                                                    Scarica PDF
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => setDeleteDialog({ open: true, quote })}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Elimina
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                {quote.project_description && (
                                    <p className="mt-3 text-sm text-muted-foreground pl-16">
                                        {quote.project_description}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, quote: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Conferma Eliminazione</DialogTitle>
                        <DialogDescription>
                            Sei sicuro di voler eliminare il preventivo "{deleteDialog.quote?.quote_number}"?
                            Questa azione non può essere annullata.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, quote: null })}>
                            Annulla
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-btn">
                            Elimina
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
