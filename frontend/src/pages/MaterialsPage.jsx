import { useState, useEffect } from "react";
import { materialsApi, settingsApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
    Search,
    Package,
    MoreHorizontal,
    Pencil,
    Trash2,
    AlertTriangle,
    ArrowUpDown,
    Loader2,
} from "lucide-react";

const emptyMaterial = {
    name: "",
    category: "",
    unit: "lt",
    stock_quantity: 0,
    unit_cost: 0,
    supplier: "",
    min_stock_alert: 10,
    notes: "",
};

export default function MaterialsPage() {
    const [materials, setMaterials] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showLowStock, setShowLowStock] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [adjustDialog, setAdjustDialog] = useState({ open: false, material: null });
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [formData, setFormData] = useState(emptyMaterial);
    const [saving, setSaving] = useState(false);
    const [adjustment, setAdjustment] = useState({ value: 0, reason: "" });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, material: null });

    useEffect(() => {
        loadData();
    }, [showLowStock]);

    const loadData = async () => {
        try {
            const [materialsRes, settingsRes] = await Promise.all([
                materialsApi.getAll({ low_stock: showLowStock }),
                settingsApi.get(),
            ]);
            setMaterials(materialsRes.data);
            setSettings(settingsRes.data);
        } catch (error) {
            toast.error("Errore nel caricamento dei materiali");
        } finally {
            setLoading(false);
        }
    };

    const filteredMaterials = materials.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.category?.toLowerCase().includes(search.toLowerCase()) ||
        m.supplier?.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenDialog = (material = null) => {
        if (material) {
            setEditingMaterial(material);
            setFormData(material);
        } else {
            setEditingMaterial(null);
            setFormData(emptyMaterial);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingMaterial(null);
        setFormData(emptyMaterial);
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
        if (!formData.name) {
            toast.error("Inserisci il nome del materiale");
            return;
        }

        setSaving(true);
        try {
            if (editingMaterial) {
                await materialsApi.update(editingMaterial.id, formData);
                toast.success("Materiale aggiornato");
            } else {
                await materialsApi.create(formData);
                toast.success("Materiale creato");
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
        if (!deleteDialog.material) return;
        try {
            await materialsApi.delete(deleteDialog.material.id);
            toast.success("Materiale eliminato");
            setDeleteDialog({ open: false, material: null });
            loadData();
        } catch (error) {
            toast.error("Errore nell'eliminazione");
        }
    };

    const handleAdjustStock = async () => {
        if (!adjustDialog.material || adjustment.value === 0) return;
        try {
            await materialsApi.adjustStock(adjustDialog.material.id, adjustment.value, adjustment.reason);
            toast.success("Giacenza aggiornata");
            setAdjustDialog({ open: false, material: null });
            setAdjustment({ value: 0, reason: "" });
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Errore nell'aggiornamento");
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
        }).format(value || 0);
    };

    const isLowStock = (material) => {
        return material.stock_quantity <= material.min_stock_alert;
    };

    return (
        <div className="space-y-6 animate-fade-in" data-testid="materials-page">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">Materiali</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestisci l'inventario dei materiali
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} data-testid="new-material-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuovo Materiale
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca materiale..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                        data-testid="material-search"
                    />
                </div>
                <Button
                    variant={showLowStock ? "default" : "outline"}
                    onClick={() => setShowLowStock(!showLowStock)}
                    data-testid="low-stock-filter"
                >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Scorte Basse
                </Button>
            </div>

            {/* Materials Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                        </div>
                    ) : filteredMaterials.length === 0 ? (
                        <div className="py-16 text-center">
                            <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">
                                Nessun materiale trovato
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {search ? "Prova a modificare la ricerca" : "Inizia aggiungendo il tuo primo materiale"}
                            </p>
                            {!search && (
                                <Button onClick={() => handleOpenDialog()}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Aggiungi Materiale
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Fornitore</TableHead>
                                    <TableHead className="text-center">Giacenza</TableHead>
                                    <TableHead className="text-right">Costo Unit.</TableHead>
                                    <TableHead className="text-right">Valore</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMaterials.map((material) => (
                                    <TableRow key={material.id} data-testid={`material-row-${material.id}`}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-primary" />
                                                </div>
                                                <span className="font-medium">{material.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{material.category || "-"}</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {material.supplier || "-"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {isLowStock(material) && (
                                                    <AlertTriangle className="w-4 h-4 text-warning" />
                                                )}
                                                <span className={isLowStock(material) ? "text-warning font-medium" : ""}>
                                                    {material.stock_quantity} {material.unit}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(material.unit_cost)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(material.stock_quantity * material.unit_cost)}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setAdjustDialog({ open: true, material })}>
                                                        <ArrowUpDown className="w-4 h-4 mr-2" />
                                                        Modifica Giacenza
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleOpenDialog(material)}>
                                                        <Pencil className="w-4 h-4 mr-2" />
                                                        Modifica
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => setDeleteDialog({ open: true, material })}
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
                            {editingMaterial ? "Modifica Materiale" : "Nuovo Materiale"}
                        </DialogTitle>
                        <DialogDescription>
                            Inserisci i dati del materiale
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome *</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Es: Idropittura bianca"
                                data-testid="material-name-input"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unità di Misura</Label>
                                <Select
                                    value={formData.unit}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {settings?.units?.map((unit) => (
                                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="stock_quantity">Giacenza</Label>
                                <Input
                                    id="stock_quantity"
                                    name="stock_quantity"
                                    type="number"
                                    value={formData.stock_quantity}
                                    onChange={handleChange}
                                    step="0.01"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unit_cost">Costo Unitario (€)</Label>
                                <Input
                                    id="unit_cost"
                                    name="unit_cost"
                                    type="number"
                                    value={formData.unit_cost}
                                    onChange={handleChange}
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
                                <Label htmlFor="min_stock_alert">Soglia Scorta Minima</Label>
                                <Input
                                    id="min_stock_alert"
                                    name="min_stock_alert"
                                    type="number"
                                    value={formData.min_stock_alert}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                Annulla
                            </Button>
                            <Button type="submit" disabled={saving} data-testid="material-save-btn">
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {editingMaterial ? "Salva Modifiche" : "Crea Materiale"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Stock Adjustment Dialog */}
            <Dialog open={adjustDialog.open} onOpenChange={(open) => setAdjustDialog({ open, material: null })}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Modifica Giacenza</DialogTitle>
                        <DialogDescription>
                            {adjustDialog.material?.name} - Attuale: {adjustDialog.material?.stock_quantity} {adjustDialog.material?.unit}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Variazione</Label>
                            <Input
                                type="number"
                                value={adjustment.value}
                                onChange={(e) => setAdjustment((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                                placeholder="Es: +10 o -5"
                            />
                            <p className="text-xs text-muted-foreground">
                                Usa valori positivi per aggiungere, negativi per sottrarre
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Motivo</Label>
                            <Input
                                value={adjustment.reason}
                                onChange={(e) => setAdjustment((prev) => ({ ...prev, reason: e.target.value }))}
                                placeholder="Es: Rifornimento, Uso cantiere..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAdjustDialog({ open: false, material: null })}>
                            Annulla
                        </Button>
                        <Button onClick={handleAdjustStock}>
                            Conferma
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, material: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Conferma Eliminazione</DialogTitle>
                        <DialogDescription>
                            Sei sicuro di voler eliminare il materiale "{deleteDialog.material?.name}"?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, material: null })}>
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
