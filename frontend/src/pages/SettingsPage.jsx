import { useState, useEffect, useCallback } from "react";
import { settingsApi, categoriesApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { 
    Save, 
    Building2, 
    FileText, 
    Package, 
    Loader2, 
    Plus, 
    X, 
    GripVertical, 
    Pencil, 
    Trash2,
    Tags,
    ChevronRight,
    ChevronDown
} from "lucide-react";

// Category Form Component
const CategoryForm = ({ category, onSave, onCancel, parentCategories }) => {
    const [formData, setFormData] = useState({
        name: category?.name || "",
        parent_id: category?.parent_id || null,
        color: category?.color || "#005f73",
        default_vat_percent: category?.default_vat_percent || 22.0,
        description: category?.description || "",
        position: category?.position || 0,
    });
    const [saving, setSaving] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Inserisci il nome della categoria");
            return;
        }
        setSaving(true);
        try {
            await onSave(formData);
        } finally {
            setSaving(false);
        }
    };
    
    const colorOptions = [
        "#4CAF50", "#2196F3", "#FF9800", "#795548", "#607D8B",
        "#9C27B0", "#00BCD4", "#8BC34A", "#E91E63", "#FFC107",
        "#3F51B5", "#F44336", "#009688", "#673AB7", "#CDDC39"
    ];
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Nome Categoria *</Label>
                <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Es: Pittura Interni"
                    data-testid="category-name-input"
                />
            </div>
            
            <div className="space-y-2">
                <Label>Categoria Padre (opzionale)</Label>
                <select
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={formData.parent_id || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value || null }))}
                >
                    <option value="">Nessuna (categoria principale)</option>
                    {parentCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>
            
            <div className="space-y-2">
                <Label>Colore Tag</Label>
                <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                        <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-md border-2 transition-all ${
                                formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                        />
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>IVA Default (%)</Label>
                    <Input
                        type="number"
                        step="0.1"
                        value={formData.default_vat_percent}
                        onChange={(e) => setFormData(prev => ({ ...prev, default_vat_percent: parseFloat(e.target.value) || 22 }))}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Posizione</Label>
                    <Input
                        type="number"
                        value={formData.position}
                        onChange={(e) => setFormData(prev => ({ ...prev, position: parseInt(e.target.value) || 0 }))}
                    />
                </div>
            </div>
            
            <div className="space-y-2">
                <Label>Descrizione</Label>
                <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrizione opzionale..."
                    rows={2}
                />
            </div>
            
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Annulla
                </Button>
                <Button type="submit" disabled={saving} data-testid="category-save-btn">
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {category ? "Salva Modifiche" : "Crea Categoria"}
                </Button>
            </DialogFooter>
        </form>
    );
};

// Draggable Category Item
const CategoryItem = ({ category, subCategories, onEdit, onDelete, onDragStart, onDragOver, onDrop, isDragging }) => {
    const [expanded, setExpanded] = useState(true);
    const hasSubCategories = subCategories && subCategories.length > 0;
    
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, category)}
            onDragOver={(e) => onDragOver(e, category)}
            onDrop={(e) => onDrop(e, category)}
            className={`border rounded-lg bg-card transition-all ${isDragging ? 'opacity-50' : ''}`}
            data-testid={`category-item-${category.id}`}
        >
            <div className="flex items-center gap-3 p-3">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {hasSubCategories && (
                            <button
                                type="button"
                                onClick={() => setExpanded(!expanded)}
                                className="p-0.5 hover:bg-muted rounded"
                            >
                                {expanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                            </button>
                        )}
                        <span className="font-medium truncate">{category.name}</span>
                        <Badge variant="outline" className="text-xs">
                            IVA {category.default_vat_percent}%
                        </Badge>
                    </div>
                    {category.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {category.description}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(category)}
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(category)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            
            {/* Sub-categories */}
            {hasSubCategories && expanded && (
                <div className="ml-8 border-t">
                    {subCategories.map((subCat) => (
                        <div
                            key={subCat.id}
                            className="flex items-center gap-3 p-2 border-b last:border-b-0"
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: subCat.color }}
                            />
                            <span className="flex-1 text-sm">{subCat.name}</span>
                            <Badge variant="outline" className="text-xs">
                                IVA {subCat.default_vat_percent}%
                            </Badge>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => onEdit(subCat)}
                            >
                                <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => onDelete(subCat)}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function SettingsPage() {
    const [settings, setSettings] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newUnit, setNewUnit] = useState("");
    const [newVatRate, setNewVatRate] = useState("");
    
    // Category management
    const [categoryDialog, setCategoryDialog] = useState({ open: false, category: null });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, category: null });
    const [draggedCategory, setDraggedCategory] = useState(null);

    useEffect(() => {
        loadData();
    }, []);
    
    const loadData = async () => {
        try {
            const [settingsRes, categoriesRes] = await Promise.all([
                settingsApi.get(),
                categoriesApi.getAll(),
            ]);
            setSettings(settingsRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            toast.error("Errore nel caricamento dei dati");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await settingsApi.update(settings);
            toast.success("Impostazioni salvate");
        } catch (error) {
            toast.error("Errore nel salvataggio");
        } finally {
            setSaving(false);
        }
    };
    
    // Category handlers
    const handleSaveCategory = async (formData) => {
        try {
            if (categoryDialog.category) {
                await categoriesApi.update(categoryDialog.category.id, formData);
                toast.success("Categoria aggiornata");
            } else {
                await categoriesApi.create(formData);
                toast.success("Categoria creata");
            }
            setCategoryDialog({ open: false, category: null });
            loadData();
        } catch (error) {
            toast.error("Errore nel salvataggio della categoria");
        }
    };
    
    const handleDeleteCategory = async () => {
        if (!deleteDialog.category) return;
        try {
            await categoriesApi.delete(deleteDialog.category.id);
            toast.success("Categoria eliminata");
            setDeleteDialog({ open: false, category: null });
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Errore nell'eliminazione");
        }
    };
    
    // Drag and drop handlers
    const handleDragStart = (e, category) => {
        setDraggedCategory(category);
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const handleDragOver = (e, category) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    
    const handleDrop = async (e, targetCategory) => {
        e.preventDefault();
        if (!draggedCategory || draggedCategory.id === targetCategory.id) {
            setDraggedCategory(null);
            return;
        }
        
        // Swap positions
        const newPositions = {};
        newPositions[draggedCategory.id] = targetCategory.position;
        newPositions[targetCategory.id] = draggedCategory.position;
        
        try {
            await categoriesApi.reorder(newPositions);
            loadData();
            toast.success("Ordine aggiornato");
        } catch (error) {
            toast.error("Errore nel riordinamento");
        }
        
        setDraggedCategory(null);
    };

    const addUnit = () => {
        if (newUnit && !settings.units.includes(newUnit)) {
            setSettings((prev) => ({
                ...prev,
                units: [...prev.units, newUnit],
            }));
            setNewUnit("");
        }
    };

    const removeUnit = (unit) => {
        setSettings((prev) => ({
            ...prev,
            units: prev.units.filter((u) => u !== unit),
        }));
    };

    const addVatRate = () => {
        const rate = parseFloat(newVatRate);
        if (!isNaN(rate) && !settings.default_vat_rates.includes(rate)) {
            setSettings((prev) => ({
                ...prev,
                default_vat_rates: [...prev.default_vat_rates, rate].sort((a, b) => b - a),
            }));
            setNewVatRate("");
        }
    };

    const removeVatRate = (rate) => {
        setSettings((prev) => ({
            ...prev,
            default_vat_rates: prev.default_vat_rates.filter((r) => r !== rate),
        }));
    };
    
    // Organize categories by parent
    const mainCategories = categories.filter(c => !c.parent_id).sort((a, b) => a.position - b.position);
    const getSubCategories = (parentId) => categories.filter(c => c.parent_id === parentId).sort((a, b) => a.position - b.position);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in" data-testid="settings-page">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">Impostazioni</h1>
                    <p className="text-muted-foreground mt-1">
                        Configura i parametri dell'applicazione
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving} data-testid="save-settings-btn">
                    {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    Salva Impostazioni
                </Button>
            </div>

            <Tabs defaultValue="company">
                <TabsList>
                    <TabsTrigger value="company">
                        <Building2 className="w-4 h-4 mr-2" />
                        Azienda
                    </TabsTrigger>
                    <TabsTrigger value="categories">
                        <Tags className="w-4 h-4 mr-2" />
                        Categorie
                    </TabsTrigger>
                    <TabsTrigger value="documents">
                        <FileText className="w-4 h-4 mr-2" />
                        Documenti
                    </TabsTrigger>
                    <TabsTrigger value="parameters">
                        <Package className="w-4 h-4 mr-2" />
                        Parametri
                    </TabsTrigger>
                </TabsList>

                {/* Company Tab */}
                <TabsContent value="company" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Dati Aziendali</CardTitle>
                            <CardDescription>
                                Informazioni che appariranno sui preventivi e fatture
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Ragione Sociale</Label>
                                    <Input
                                        value={settings?.company_name || ""}
                                        onChange={(e) => handleChange("company_name", e.target.value)}
                                        placeholder="La Tua Azienda S.r.l."
                                        data-testid="company-name-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Partita IVA</Label>
                                    <Input
                                        value={settings?.company_vat || ""}
                                        onChange={(e) => handleChange("company_vat", e.target.value)}
                                        placeholder="12345678901"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Indirizzo</Label>
                                <Input
                                    value={settings?.company_address || ""}
                                    onChange={(e) => handleChange("company_address", e.target.value)}
                                    placeholder="Via Roma 123"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Città</Label>
                                    <Input
                                        value={settings?.company_city || ""}
                                        onChange={(e) => handleChange("company_city", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>CAP</Label>
                                    <Input
                                        value={settings?.company_cap || ""}
                                        onChange={(e) => handleChange("company_cap", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Provincia</Label>
                                    <Input
                                        value={settings?.company_province || ""}
                                        onChange={(e) => handleChange("company_province", e.target.value)}
                                        placeholder="MI"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Telefono</Label>
                                    <Input
                                        value={settings?.company_phone || ""}
                                        onChange={(e) => handleChange("company_phone", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        value={settings?.company_email || ""}
                                        onChange={(e) => handleChange("company_email", e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>PEC</Label>
                                    <Input
                                        value={settings?.company_pec || ""}
                                        onChange={(e) => handleChange("company_pec", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Codice Fiscale</Label>
                                    <Input
                                        value={settings?.company_fiscal_code || ""}
                                        onChange={(e) => handleChange("company_fiscal_code", e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Coordinate Bancarie</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Banca</Label>
                                    <Input
                                        value={settings?.company_bank || ""}
                                        onChange={(e) => handleChange("company_bank", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>IBAN</Label>
                                    <Input
                                        value={settings?.company_iban || ""}
                                        onChange={(e) => handleChange("company_iban", e.target.value)}
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                {/* Categories Tab - NEW */}
                <TabsContent value="categories" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="font-heading">Gestore Categorie</CardTitle>
                                    <CardDescription>
                                        Trascina per riordinare. Le categorie possono avere sotto-categorie.
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setCategoryDialog({ open: true, category: null })} data-testid="new-category-btn">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Nuova Categoria
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {mainCategories.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Tags className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                        <p>Nessuna categoria creata</p>
                                        <p className="text-sm">Aggiungi la prima categoria per organizzare i tuoi preventivi</p>
                                    </div>
                                ) : (
                                    mainCategories.map((category) => (
                                        <CategoryItem
                                            key={category.id}
                                            category={category}
                                            subCategories={getSubCategories(category.id)}
                                            onEdit={(cat) => setCategoryDialog({ open: true, category: cat })}
                                            onDelete={(cat) => setDeleteDialog({ open: true, category: cat })}
                                            onDragStart={handleDragStart}
                                            onDragOver={handleDragOver}
                                            onDrop={handleDrop}
                                            isDragging={draggedCategory?.id === category.id}
                                        />
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Numerazione Documenti</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Prefisso Preventivi</Label>
                                    <Input
                                        value={settings?.quote_prefix || ""}
                                        onChange={(e) => handleChange("quote_prefix", e.target.value)}
                                        placeholder="PRV"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Es: PRV-2025-001
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Prefisso Fatture</Label>
                                    <Input
                                        value={settings?.invoice_prefix || ""}
                                        onChange={(e) => handleChange("invoice_prefix", e.target.value)}
                                        placeholder="FT"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Es: FT-2025-001
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Contatore Preventivi</Label>
                                    <Input
                                        type="number"
                                        value={settings?.quote_counter || 0}
                                        onChange={(e) => handleChange("quote_counter", parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contatore Fatture</Label>
                                    <Input
                                        type="number"
                                        value={settings?.invoice_counter || 0}
                                        onChange={(e) => handleChange("invoice_counter", parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Testi Predefiniti</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Condizioni di Pagamento</Label>
                                <Textarea
                                    value={settings?.default_payment_terms || ""}
                                    onChange={(e) => handleChange("default_payment_terms", e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Note Standard</Label>
                                <Textarea
                                    value={settings?.default_notes || ""}
                                    onChange={(e) => handleChange("default_notes", e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Timeout Inattività</CardTitle>
                            <CardDescription>
                                Tempo di inattività prima del logout automatico
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="number"
                                    min={5}
                                    max={480}
                                    value={settings?.inactivity_timeout_minutes || 30}
                                    onChange={(e) => handleChange("inactivity_timeout_minutes", parseInt(e.target.value) || 30)}
                                    className="w-24"
                                />
                                <span className="text-muted-foreground">minuti</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Gli utenti con "Ricordami" attivo non saranno disconnessi per inattività.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Parameters Tab */}
                <TabsContent value="parameters" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Unità di Misura</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {settings?.units?.map((unit) => (
                                    <Badge key={unit} variant="secondary" className="text-sm py-1 px-3">
                                        {unit}
                                        <button
                                            onClick={() => removeUnit(unit)}
                                            className="ml-2 hover:text-destructive"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={newUnit}
                                    onChange={(e) => setNewUnit(e.target.value)}
                                    placeholder="Nuova unità..."
                                    onKeyDown={(e) => e.key === "Enter" && addUnit()}
                                />
                                <Button onClick={addUnit} variant="secondary">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Aliquote IVA</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {settings?.default_vat_rates?.map((rate) => (
                                    <Badge key={rate} variant="secondary" className="text-sm py-1 px-3">
                                        {rate}%
                                        <button
                                            onClick={() => removeVatRate(rate)}
                                            className="ml-2 hover:text-destructive"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={newVatRate}
                                    onChange={(e) => setNewVatRate(e.target.value)}
                                    placeholder="Nuova aliquota..."
                                    onKeyDown={(e) => e.key === "Enter" && addVatRate()}
                                />
                                <Button onClick={addVatRate} variant="secondary">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            {/* Category Create/Edit Dialog */}
            <Dialog open={categoryDialog.open} onOpenChange={(open) => setCategoryDialog({ open, category: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-heading">
                            {categoryDialog.category ? "Modifica Categoria" : "Nuova Categoria"}
                        </DialogTitle>
                        <DialogDescription>
                            {categoryDialog.category 
                                ? "Modifica i dati della categoria" 
                                : "Crea una nuova categoria per organizzare le voci dei preventivi"}
                        </DialogDescription>
                    </DialogHeader>
                    <CategoryForm
                        category={categoryDialog.category}
                        parentCategories={mainCategories.filter(c => c.id !== categoryDialog.category?.id)}
                        onSave={handleSaveCategory}
                        onCancel={() => setCategoryDialog({ open: false, category: null })}
                    />
                </DialogContent>
            </Dialog>
            
            {/* Delete Category Confirmation */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, category: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Conferma Eliminazione</DialogTitle>
                        <DialogDescription>
                            Sei sicuro di voler eliminare la categoria "{deleteDialog.category?.name}"?
                            {getSubCategories(deleteDialog.category?.id || '').length > 0 && (
                                <span className="block mt-2 text-amber-600">
                                    Attenzione: verranno eliminate anche le sotto-categorie.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, category: null })}>
                            Annulla
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteCategory} data-testid="confirm-delete-category-btn">
                            Elimina
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
