import { useState, useEffect } from "react";
import { settingsApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Save, Building2, FileText, Package, Loader2, Plus, X } from "lucide-react";

export default function SettingsPage() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newCategory, setNewCategory] = useState("");
    const [newUnit, setNewUnit] = useState("");
    const [newVatRate, setNewVatRate] = useState("");

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await settingsApi.get();
            setSettings(response.data);
        } catch (error) {
            toast.error("Errore nel caricamento delle impostazioni");
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

    const addCategory = () => {
        if (newCategory && !settings.categories.includes(newCategory)) {
            setSettings((prev) => ({
                ...prev,
                categories: [...prev.categories, newCategory],
            }));
            setNewCategory("");
        }
    };

    const removeCategory = (cat) => {
        setSettings((prev) => ({
            ...prev,
            categories: prev.categories.filter((c) => c !== cat),
        }));
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
                </TabsContent>

                {/* Parameters Tab */}
                <TabsContent value="parameters" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Categorie Lavori</CardTitle>
                            <CardDescription>
                                Categorie disponibili per le voci dei preventivi
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {settings?.categories?.map((cat) => (
                                    <Badge key={cat} variant="secondary" className="text-sm py-1 px-3">
                                        {cat}
                                        <button
                                            onClick={() => removeCategory(cat)}
                                            className="ml-2 hover:text-destructive"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="Nuova categoria..."
                                    onKeyDown={(e) => e.key === "Enter" && addCategory()}
                                />
                                <Button onClick={addCategory} variant="secondary">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

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
        </div>
    );
}
