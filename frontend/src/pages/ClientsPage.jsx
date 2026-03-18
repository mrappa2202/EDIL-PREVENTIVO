import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { clientsApi, optionsApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Combobox } from "../components/ui/combobox";
import { toast } from "sonner";
import {
    Plus,
    Search,
    Building2,
    Phone,
    Mail,
    MapPin,
    MoreHorizontal,
    Pencil,
    Trash2,
    FileText,
    Loader2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const emptyClient = {
    name: "",
    company_name: "",
    vat_number: "",
    fiscal_code: "",
    address: "",
    city: "",
    cap: "",
    province: "",
    phone: "",
    email: "",
    notes: "",
    bank_name: "",
    iban: "",
    sdi_code: "",
    pec_email: "",
    payment_terms: "",
};

export default function ClientsPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState(emptyClient);
    const [saving, setSaving] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, client: null });
    
    // Saved options for combobox
    const [savedCities, setSavedCities] = useState([]);
    const [savedProvinces, setSavedProvinces] = useState([]);
    const [savedPaymentTerms, setSavedPaymentTerms] = useState([]);

    useEffect(() => {
        loadClients();
        loadSavedOptions();
    }, []);
    
    const loadSavedOptions = async () => {
        try {
            const [citiesRes, provincesRes, paymentRes] = await Promise.all([
                optionsApi.get('cities'),
                optionsApi.get('provinces'),
                optionsApi.get('payment_terms'),
            ]);
            setSavedCities(citiesRes.data || []);
            setSavedProvinces(provincesRes.data || []);
            setSavedPaymentTerms(paymentRes.data || []);
        } catch (error) {
            console.error("Error loading saved options:", error);
        }
    };
    
    const handleSaveOption = async (optionType, value) => {
        try {
            await optionsApi.save({ option_type: optionType, option_value: value });
            // Reload options
            loadSavedOptions();
            toast.success(`"${value}" salvato nelle opzioni`);
        } catch (error) {
            console.error("Error saving option:", error);
        }
    };

    const loadClients = async (searchTerm = "") => {
        try {
            const response = await clientsApi.getAll(searchTerm);
            setClients(response.data);
        } catch (error) {
            toast.error("Errore nel caricamento dei clienti");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        loadClients(value);
    };

    const handleOpenDialog = (client = null) => {
        if (client) {
            setEditingClient(client);
            setFormData(client);
        } else {
            setEditingClient(null);
            setFormData(emptyClient);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingClient(null);
        setFormData(emptyClient);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name && !formData.company_name) {
            toast.error("Inserisci almeno il nome o la ragione sociale");
            return;
        }

        setSaving(true);
        try {
            if (editingClient) {
                await clientsApi.update(editingClient.id, formData);
                toast.success("Cliente aggiornato");
            } else {
                await clientsApi.create(formData);
                toast.success("Cliente creato");
            }
            handleCloseDialog();
            loadClients(search);
        } catch (error) {
            toast.error("Errore nel salvataggio");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.client) return;
        try {
            await clientsApi.delete(deleteDialog.client.id);
            toast.success("Cliente eliminato");
            setDeleteDialog({ open: false, client: null });
            loadClients(search);
        } catch (error) {
            toast.error("Errore nell'eliminazione");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in" data-testid="clients-page">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">Clienti</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestisci l'anagrafica dei tuoi clienti
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} data-testid="new-client-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuovo Cliente
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Cerca per nome, azienda o email..."
                    value={search}
                    onChange={handleSearch}
                    className="pl-10"
                    data-testid="client-search"
                />
            </div>

            {/* Clients Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6 h-48" />
                        </Card>
                    ))}
                </div>
            ) : clients.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Building2 className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            Nessun cliente trovato
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {search ? "Prova a modificare la ricerca" : "Inizia aggiungendo il tuo primo cliente"}
                        </p>
                        {!search && (
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="w-4 h-4 mr-2" />
                                Aggiungi Cliente
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clients.map((client) => (
                        <Card key={client.id} className="card-hover" data-testid={`client-card-${client.id}`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-heading">
                                                {client.company_name || client.name}
                                            </CardTitle>
                                            {client.company_name && client.name && (
                                                <p className="text-sm text-muted-foreground">{client.name}</p>
                                            )}
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link to={`/clienti/${client.id}`}>
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    Dettagli
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenDialog(client)}>
                                                <Pencil className="w-4 h-4 mr-2" />
                                                Modifica
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => setDeleteDialog({ open: true, client })}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Elimina
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {client.vat_number && (
                                    <Badge variant="secondary" className="text-xs">
                                        P.IVA: {client.vat_number}
                                    </Badge>
                                )}
                                <div className="space-y-1.5 text-sm">
                                    {client.phone && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="w-4 h-4" />
                                            <span>{client.phone}</span>
                                        </div>
                                    )}
                                    {client.email && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Mail className="w-4 h-4" />
                                            <span className="truncate">{client.email}</span>
                                        </div>
                                    )}
                                    {(client.city || client.address) && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="w-4 h-4" />
                                            <span className="truncate">
                                                {[client.address, client.city].filter(Boolean).join(", ")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-heading">
                            {editingClient ? "Modifica Cliente" : "Nuovo Cliente"}
                        </DialogTitle>
                        <DialogDescription>
                            Inserisci i dati del cliente
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Dati Anagrafici
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome/Referente</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Mario Rossi"
                                        data-testid="client-name-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company_name">Ragione Sociale</Label>
                                    <Input
                                        id="company_name"
                                        name="company_name"
                                        value={formData.company_name}
                                        onChange={handleChange}
                                        placeholder="Azienda S.r.l."
                                        data-testid="client-company-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vat_number">Partita IVA</Label>
                                    <Input
                                        id="vat_number"
                                        name="vat_number"
                                        value={formData.vat_number}
                                        onChange={handleChange}
                                        placeholder="12345678901"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fiscal_code">Codice Fiscale</Label>
                                    <Input
                                        id="fiscal_code"
                                        name="fiscal_code"
                                        value={formData.fiscal_code}
                                        onChange={handleChange}
                                        placeholder="RSSMRA80A01H501U"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Indirizzo
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="address">Via/Piazza</Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Via Roma 123"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Città</Label>
                                        <Combobox
                                            options={savedCities}
                                            value={formData.city}
                                            onChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                                            onAddNew={(value) => handleSaveOption('cities', value)}
                                            placeholder="Seleziona o digita..."
                                            searchPlaceholder="Cerca città..."
                                            data-testid="client-city-combobox"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cap">CAP</Label>
                                        <Input
                                            id="cap"
                                            name="cap"
                                            value={formData.cap}
                                            onChange={handleChange}
                                            placeholder="20100"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="province">Provincia</Label>
                                        <Combobox
                                            options={savedProvinces}
                                            value={formData.province}
                                            onChange={(value) => setFormData(prev => ({ ...prev, province: value }))}
                                            onAddNew={(value) => handleSaveOption('provinces', value)}
                                            placeholder="Seleziona..."
                                            searchPlaceholder="Cerca provincia..."
                                            data-testid="client-province-combobox"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contacts */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Contatti
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefono</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+39 02 1234567"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="info@azienda.it"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Billing */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Dati Fatturazione
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sdi_code">Codice SDI</Label>
                                    <Input
                                        id="sdi_code"
                                        name="sdi_code"
                                        value={formData.sdi_code}
                                        onChange={handleChange}
                                        placeholder="XXXXXXX"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pec_email">PEC</Label>
                                    <Input
                                        id="pec_email"
                                        name="pec_email"
                                        type="email"
                                        value={formData.pec_email}
                                        onChange={handleChange}
                                        placeholder="azienda@pec.it"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bank_name">Banca</Label>
                                    <Input
                                        id="bank_name"
                                        name="bank_name"
                                        value={formData.bank_name}
                                        onChange={handleChange}
                                        placeholder="Banca Intesa"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="iban">IBAN</Label>
                                    <Input
                                        id="iban"
                                        name="iban"
                                        value={formData.iban}
                                        onChange={handleChange}
                                        placeholder="IT60X0542811101000000123456"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payment_terms">Condizioni di Pagamento</Label>
                                <Combobox
                                    options={savedPaymentTerms}
                                    value={formData.payment_terms}
                                    onChange={(value) => setFormData(prev => ({ ...prev, payment_terms: value }))}
                                    onAddNew={(value) => handleSaveOption('payment_terms', value)}
                                    placeholder="Seleziona o digita..."
                                    searchPlaceholder="Cerca condizioni..."
                                    data-testid="client-payment-terms-combobox"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Note</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Note aggiuntive..."
                                rows={3}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                Annulla
                            </Button>
                            <Button type="submit" disabled={saving} data-testid="client-save-btn">
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {editingClient ? "Salva Modifiche" : "Crea Cliente"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, client: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Conferma Eliminazione</DialogTitle>
                        <DialogDescription>
                            Sei sicuro di voler eliminare il cliente "{deleteDialog.client?.company_name || deleteDialog.client?.name}"?
                            Questa azione non può essere annullata.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, client: null })}>
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
