import { useState, useEffect } from "react";
import { usersApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
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
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Plus, Users, Trash2, Loader2, Shield, User } from "lucide-react";

const roleLabels = {
    admin: "Amministratore",
    operator: "Operatore",
};

const roleStyles = {
    admin: "bg-primary/10 text-primary",
    operator: "bg-secondary text-secondary-foreground",
};

export default function UsersPage() {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        name: "",
        role: "operator",
    });
    const [saving, setSaving] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await usersApi.getAll();
            setUsers(response.data);
        } catch (error) {
            toast.error("Errore nel caricamento degli utenti");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = () => {
        setFormData({
            username: "",
            password: "",
            name: "",
            role: "operator",
        });
        setDialogOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.username || !formData.password) {
            toast.error("Inserisci username e password");
            return;
        }
        if (formData.password.length < 6) {
            toast.error("La password deve essere almeno 6 caratteri");
            return;
        }

        setSaving(true);
        try {
            await usersApi.create(formData);
            toast.success("Utente creato");
            setDialogOpen(false);
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Errore nella creazione");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.user) return;
        if (deleteDialog.user.id === currentUser?.id) {
            toast.error("Non puoi eliminare te stesso");
            return;
        }
        try {
            await usersApi.delete(deleteDialog.user.id);
            toast.success("Utente eliminato");
            setDeleteDialog({ open: false, user: null });
            loadUsers();
        } catch (error) {
            toast.error("Errore nell'eliminazione");
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("it-IT");
    };

    return (
        <div className="space-y-6 animate-fade-in" data-testid="users-page">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">Gestione Utenti</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestisci gli utenti che possono accedere al sistema
                    </p>
                </div>
                <Button onClick={handleOpenDialog} data-testid="new-user-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuovo Utente
                </Button>
            </div>

            {/* Info Card */}
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-medium text-foreground">Ruoli Utente</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                <strong>Amministratore:</strong> Accesso completo a tutte le funzionalità, inclusa gestione utenti e impostazioni.<br />
                                <strong>Operatore:</strong> Può creare e gestire clienti, preventivi, materiali, spese e dipendenti.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="py-16 text-center">
                            <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">
                                Nessun utente trovato
                            </h3>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Utente</TableHead>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Ruolo</TableHead>
                                    <TableHead>Data Creazione</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    {user.role === "admin" ? (
                                                        <Shield className="w-5 h-5 text-primary" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <span className="font-medium">{user.name || user.username}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground font-mono">
                                            {user.username}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={roleStyles[user.role]}>
                                                {roleLabels[user.role]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(user.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            {user.id !== currentUser?.id && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteDialog({ open: true, user })}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Nuovo Utente</DialogTitle>
                        <DialogDescription>
                            Crea un nuovo utente per accedere al sistema
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Mario Rossi"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username *</Label>
                            <Input
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="mario.rossi"
                                data-testid="user-username-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Minimo 6 caratteri"
                                data-testid="user-password-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Ruolo</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                            >
                                <SelectTrigger data-testid="user-role-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="operator">Operatore</SelectItem>
                                    <SelectItem value="admin">Amministratore</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Annulla
                            </Button>
                            <Button type="submit" disabled={saving} data-testid="user-save-btn">
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Crea Utente
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Conferma Eliminazione</DialogTitle>
                        <DialogDescription>
                            Sei sicuro di voler eliminare l'utente "{deleteDialog.user?.name || deleteDialog.user?.username}"?
                            Questa azione non può essere annullata.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })}>
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
