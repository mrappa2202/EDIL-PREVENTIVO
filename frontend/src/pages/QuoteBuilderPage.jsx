import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { quotesApi, clientsApi, settingsApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import {
    ArrowLeft,
    Save,
    Download,
    Plus,
    Trash2,
    GripVertical,
    Loader2,
    FileText,
} from "lucide-react";
import { cn } from "../lib/utils";

const statusOptions = [
    { value: "draft", label: "Bozza" },
    { value: "sent", label: "Inviato" },
    { value: "accepted", label: "Accettato" },
    { value: "rejected", label: "Rifiutato" },
    { value: "invoiced", label: "Fatturato" },
];

const emptyItem = {
    id: "",
    category: "",
    description: "",
    unit: "mq",
    quantity: 1,
    unit_price: 0,
    discount_percent: 0,
    vat_percent: 22,
    position: 0,
};

export default function QuoteBuilderPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [clients, setClients] = useState([]);
    const [settings, setSettings] = useState(null);
    const [quote, setQuote] = useState({
        client_id: searchParams.get("client") || "",
        project_description: "",
        site_address: "",
        validity_days: 30,
        status: "draft",
        notes: "",
        special_conditions: "",
        items: [],
    });

    const isEditing = Boolean(id);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [clientsRes, settingsRes] = await Promise.all([
                clientsApi.getAll(),
                settingsApi.get(),
            ]);
            setClients(clientsRes.data);
            setSettings(settingsRes.data);

            if (id) {
                const quoteRes = await quotesApi.getOne(id);
                setQuote(quoteRes.data);
            }
        } catch (error) {
            toast.error("Errore nel caricamento dei dati");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setQuote((prev) => ({ ...prev, [field]: value }));
    };

    const handleItemChange = (index, field, value) => {
        setQuote((prev) => {
            const items = [...prev.items];
            items[index] = { ...items[index], [field]: value };
            return { ...prev, items };
        });
    };

    const addItem = () => {
        const newItem = {
            ...emptyItem,
            id: `temp-${Date.now()}`,
            position: quote.items.length,
        };
        setQuote((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const removeItem = (index) => {
        setQuote((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index).map((item, i) => ({ ...item, position: i })),
        }));
    };

    const calculateLineTotal = (item) => {
        const subtotal = item.quantity * item.unit_price;
        const discount = subtotal * (item.discount_percent || 0) / 100;
        const net = subtotal - discount;
        const vat = net * (item.vat_percent || 22) / 100;
        return { subtotal, discount, net, vat, total: net + vat };
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let totalDiscount = 0;
        const vatBreakdown = {};

        quote.items.forEach((item) => {
            const line = calculateLineTotal(item);
            subtotal += line.subtotal;
            totalDiscount += line.discount;
            const vatRate = item.vat_percent || 22;
            vatBreakdown[vatRate] = (vatBreakdown[vatRate] || 0) + line.vat;
        });

        const netTotal = subtotal - totalDiscount;
        const totalVat = Object.values(vatBreakdown).reduce((a, b) => a + b, 0);
        const grandTotal = netTotal + totalVat;

        return { subtotal, totalDiscount, netTotal, vatBreakdown, totalVat, grandTotal };
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
        }).format(value || 0);
    };

    const handleSave = async () => {
        if (!quote.client_id) {
            toast.error("Seleziona un cliente");
            return;
        }

        setSaving(true);
        try {
            if (isEditing) {
                await quotesApi.update(id, quote);
                toast.success("Preventivo aggiornato");
            } else {
                const response = await quotesApi.create(quote);
                toast.success("Preventivo creato");
                navigate(`/preventivi/${response.data.id}`);
            }
        } catch (error) {
            toast.error("Errore nel salvataggio");
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!id) {
            toast.error("Salva prima il preventivo");
            return;
        }
        setDownloading(true);
        try {
            const response = await quotesApi.getPdf(id);
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `preventivo-${quote.quote_number || id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("PDF scaricato");
        } catch (error) {
            toast.error("Errore nel download del PDF");
        } finally {
            setDownloading(false);
        }
    };

    const totals = calculateTotals();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in" data-testid="quote-builder-page">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/preventivi">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-foreground">
                            {isEditing ? `Preventivo ${quote.quote_number}` : "Nuovo Preventivo"}
                        </h1>
                        {isEditing && (
                            <p className="text-muted-foreground">Modifica i dettagli del preventivo</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isEditing && (
                        <Button variant="outline" onClick={handleDownloadPdf} disabled={downloading}>
                            {downloading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4 mr-2" />
                            )}
                            Scarica PDF
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={saving} data-testid="save-quote-btn">
                        {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Salva
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Main Content */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    {/* Quote Header */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Intestazione</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="client">Cliente *</Label>
                                    <Select
                                        value={quote.client_id}
                                        onValueChange={(value) => handleChange("client_id", value)}
                                    >
                                        <SelectTrigger data-testid="quote-client-select">
                                            <SelectValue placeholder="Seleziona cliente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map((client) => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.company_name || client.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Stato</Label>
                                    <Select
                                        value={quote.status}
                                        onValueChange={(value) => handleChange("status", value)}
                                    >
                                        <SelectTrigger data-testid="quote-status-select">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="project_description">Oggetto del Lavoro</Label>
                                <Input
                                    id="project_description"
                                    value={quote.project_description}
                                    onChange={(e) => handleChange("project_description", e.target.value)}
                                    placeholder="Es: Pittura interna appartamento"
                                    data-testid="quote-description"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="site_address">Indirizzo Cantiere</Label>
                                    <Input
                                        id="site_address"
                                        value={quote.site_address}
                                        onChange={(e) => handleChange("site_address", e.target.value)}
                                        placeholder="Via Roma 123, Milano"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="validity_days">Validità (giorni)</Label>
                                    <Input
                                        id="validity_days"
                                        type="number"
                                        value={quote.validity_days}
                                        onChange={(e) => handleChange("validity_days", parseInt(e.target.value) || 30)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Line Items */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="font-heading">Voci del Preventivo</CardTitle>
                            <Button size="sm" onClick={addItem} data-testid="add-item-btn">
                                <Plus className="w-4 h-4 mr-1" />
                                Aggiungi Voce
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {quote.items.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground mb-4">
                                        Nessuna voce aggiunta
                                    </p>
                                    <Button onClick={addItem}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Aggiungi Prima Voce
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                                        <div className="col-span-1"></div>
                                        <div className="col-span-4">Descrizione</div>
                                        <div className="col-span-1">U.M.</div>
                                        <div className="col-span-1">Q.tà</div>
                                        <div className="col-span-1">Prezzo</div>
                                        <div className="col-span-1">Sconto</div>
                                        <div className="col-span-1">IVA</div>
                                        <div className="col-span-1 text-right">Totale</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {/* Items */}
                                    {quote.items.map((item, index) => {
                                        const lineTotal = calculateLineTotal(item);
                                        return (
                                            <div
                                                key={item.id || index}
                                                className="grid grid-cols-12 gap-2 items-start py-3 px-2 rounded-lg bg-surface hover:bg-surface-highlight transition-colors"
                                                data-testid={`quote-item-${index}`}
                                            >
                                                <div className="col-span-1 flex items-center justify-center pt-2">
                                                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                                                </div>
                                                <div className="col-span-4 space-y-2">
                                                    <Select
                                                        value={item.category}
                                                        onValueChange={(value) => handleItemChange(index, "category", value)}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue placeholder="Categoria" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {settings?.categories?.map((cat) => (
                                                                <SelectItem key={cat} value={cat}>
                                                                    {cat}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Textarea
                                                        value={item.description}
                                                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                                        placeholder="Descrizione voce..."
                                                        className="min-h-[60px] text-sm resize-none"
                                                        data-testid={`item-description-${index}`}
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Select
                                                        value={item.unit}
                                                        onValueChange={(value) => handleItemChange(index, "unit", value)}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {settings?.units?.map((unit) => (
                                                                <SelectItem key={unit} value={unit}>
                                                                    {unit}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="col-span-1">
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                                                        className="h-8 text-xs text-center"
                                                        step="0.01"
                                                        data-testid={`item-quantity-${index}`}
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Input
                                                        type="number"
                                                        value={item.unit_price}
                                                        onChange={(e) => handleItemChange(index, "unit_price", parseFloat(e.target.value) || 0)}
                                                        className="h-8 text-xs text-right"
                                                        step="0.01"
                                                        data-testid={`item-price-${index}`}
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Input
                                                        type="number"
                                                        value={item.discount_percent}
                                                        onChange={(e) => handleItemChange(index, "discount_percent", parseFloat(e.target.value) || 0)}
                                                        className="h-8 text-xs text-center"
                                                        placeholder="%"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Select
                                                        value={String(item.vat_percent)}
                                                        onValueChange={(value) => handleItemChange(index, "vat_percent", parseFloat(value))}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {settings?.default_vat_rates?.map((rate) => (
                                                                <SelectItem key={rate} value={String(rate)}>
                                                                    {rate}%
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="col-span-1 text-right pt-2">
                                                    <span className="text-sm font-medium">
                                                        {formatCurrency(lineTotal.total)}
                                                    </span>
                                                </div>
                                                <div className="col-span-1 flex justify-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => removeItem(index)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Note e Condizioni</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="notes">Note</Label>
                                <Textarea
                                    id="notes"
                                    value={quote.notes}
                                    onChange={(e) => handleChange("notes", e.target.value)}
                                    placeholder="Note aggiuntive per il cliente..."
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="special_conditions">Condizioni Particolari</Label>
                                <Textarea
                                    id="special_conditions"
                                    value={quote.special_conditions}
                                    onChange={(e) => handleChange("special_conditions", e.target.value)}
                                    placeholder="Condizioni particolari del lavoro..."
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Totals */}
                <div className="col-span-12 lg:col-span-4">
                    <Card className="sticky top-8">
                        <CardHeader>
                            <CardTitle className="font-heading">Riepilogo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Imponibile</span>
                                    <span>{formatCurrency(totals.subtotal)}</span>
                                </div>
                                {totals.totalDiscount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Sconto totale</span>
                                        <span>-{formatCurrency(totals.totalDiscount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Netto</span>
                                    <span>{formatCurrency(totals.netTotal)}</span>
                                </div>
                                {Object.entries(totals.vatBreakdown).map(([rate, amount]) => (
                                    <div key={rate} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">IVA {rate}%</span>
                                        <span>{formatCurrency(amount)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-heading font-bold">Totale</span>
                                    <span className="text-2xl font-heading font-bold text-primary">
                                        {formatCurrency(totals.grandTotal)}
                                    </span>
                                </div>
                            </div>
                            <div className="pt-4 space-y-3">
                                <Button className="w-full" onClick={handleSave} disabled={saving}>
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Salva Preventivo
                                </Button>
                                {isEditing && (
                                    <Button variant="outline" className="w-full" onClick={handleDownloadPdf} disabled={downloading}>
                                        {downloading ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Download className="w-4 h-4 mr-2" />
                                        )}
                                        Scarica PDF
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
