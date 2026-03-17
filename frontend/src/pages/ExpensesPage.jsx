import { useState, useEffect } from "react";
import { expensesApi, quotesApi, settingsApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import {
    Plus,
    Receipt,
    MoreHorizontal,
    Pencil,
    Trash2,
    Loader2,
    Euro,
} from "lucide-react";

const paymentMethods = [
    "Contanti",
    "Bonifico",
    "Carta di Credito",
    "Assegno",
    "Altro",
];

const emptyExpense = {
    date: new Date().toISOString().split("T")[0],
    category: "",
    supplier: "",
    description: "",
    amount: 0,
    vat_amount: 0,
    payment_method: "",
    notes: "",
    quote_id: "",
};

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [formData, setFormData] = useState(emptyExpense);
    const [saving, setSaving] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, expense: null });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [expensesRes, quotesRes, settingsRes] = await Promise.all([
                expensesApi.getAll(),
                quotesApi.getAll(),
                settingsApi.get(),
            ]);
            setExpenses(expensesRes.data);
            setQuotes(quotesRes.data);
            setSettings(settingsRes.data);
        } catch (error) {
            toast.error("Errore nel caricamento delle spese");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (expense = null) => {
        if (expense) {
            setEditingExpense(expense);
            setFormData(expense);
        } else {
            setEditingExpense(null);
            setFormData(emptyExpense);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingExpense(null);
        setFormData(emptyExpense);
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.description && !formData.supplier) {
            toast.error("Inserisci una descrizione o fornitore");
            return;
        }

        setSaving(true);
        try {
            if (editingExpense) {
                await expensesApi.update(editingExpense.id, formData);
                toast.success("Spesa aggiornata");
            } else {
                await expensesApi.create(formData);
                toast.success("Spesa registrata");
            }
            handleCloseDialog();
            loadData();
        } catch (error) {
            toast.error("Errore nel salvataggio");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.expense) return;
        try {
            await expensesApi.delete(deleteDialog.expense.id);
            toast.success("Spesa eliminata");
            setDeleteDialog({ open: false, expense: null });
            loadData();
        } catch (error) {
            toast.error("Errore nell'eliminazione");
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
        return new Date(dateStr).toLocaleDateString("it-IT");
    };

    const getQuoteName = (quoteId) => {
        const quote = quotes.find((q) => q.id === quoteId);
        return quote?.quote_number || "-";
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalVat = expenses.reduce((sum, e) => sum + (e.vat_amount || 0), 0);

    return (
        <div className="space-y-6 animate-fade-in" data-testid="expenses-page">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">Spese</h1>
                    <p className="text-muted-foreground mt-1">
                        Registra e monitora le spese aziendali
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} data-testid="new-expense-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuova Spesa
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Totale Spese</p>
                                <p className="text-2xl font-bold font-heading">{formatCurrency(totalExpenses)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                                <Euro className="w-6 h-6 text-accent" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">IVA Detraibile</p>
                                <p className="text-2xl font-bold font-heading">{formatCurrency(totalVat)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                                <Receipt className="w-6 h-6 text-success" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">N. Registrazioni</p>
                                <p className="text-2xl font-bold font-heading">{expenses.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Receipt className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Expenses Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="py-16 text-center">
                            <Receipt className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">
                                Nessuna spesa registrata
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Inizia registrando la tua prima spesa
                            </p>
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="w-4 h-4 mr-2" />
                                Registra Spesa
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Descrizione</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Fornitore</TableHead>
                                    <TableHead>Progetto</TableHead>
                                    <TableHead className="text-right">Importo</TableHead>
                                    <TableHead className="text-right">IVA</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.map((expense) => (
                                    <TableRow key={expense.id} data-testid={`expense-row-${expense.id}`}>
                                        <TableCell>{formatDate(expense.date)}</TableCell>
                                        <TableCell className="font-medium max-w-xs truncate">
                                            {expense.description || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {expense.category ? (
                                                <Badge variant="secondary">{expense.category}</Badge>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {expense.supplier || "-"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {getQuoteName(expense.quote_id)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(expense.amount)}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {formatCurrency(expense.vat_amount)}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenDialog(expense)}>
                                                        <Pencil className="w-4 h-4 mr-2" />
                                                        Modifica
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => setDeleteDialog({ open: true, expense })}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Elimina
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-heading">
                            {editingExpense ? "Modifica Spesa" : "Nuova Spesa"}
                        </DialogTitle>
                        <DialogDescription>
                            Inserisci i dettagli della spesa
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Data *</Label>
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    data-testid="expense-date"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Categoria</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleziona" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {settings?.categories?.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="supplier">Fornitore</Label>
                            <Input
                                id="supplier"
                                name="supplier"
                                value={formData.supplier}
                                onChange={handleChange}
                                placeholder="Nome fornitore"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descrizione</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Descrizione della spesa..."
                                rows={2}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Importo (€)</Label>
                                <Input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    step="0.01"
                                    data-testid="expense-amount"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vat_amount">IVA (€)</Label>
                                <Input
                                    id="vat_amount"
                                    name="vat_amount"
                                    type="number"
                                    value={formData.vat_amount}
                                    onChange={handleChange}
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="payment_method">Metodo di Pagamento</Label>
                                <Select
                                    value={formData.payment_method}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, payment_method: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleziona" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map((method) => (
                                            <SelectItem key={method} value={method}>{method}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quote_id">Progetto/Preventivo</Label>
                                <Select
                                    value={formData.quote_id}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, quote_id: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Nessuno" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {quotes.map((quote) => (
                                            <SelectItem key={quote.id} value={quote.id}>
                                                {quote.quote_number}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                Annulla
                            </Button>
                            <Button type="submit" disabled={saving} data-testid="expense-save-btn">
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {editingExpense ? "Salva Modifiche" : "Registra Spesa"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, expense: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Conferma Eliminazione</DialogTitle>
                        <DialogDescription>
                            Sei sicuro di voler eliminare questa spesa?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, expense: null })}>
                            Annulla
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Elimina
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
