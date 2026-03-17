import { useState, useEffect } from "react";
import { employeesApi, paymentsApi, worklogsApi, quotesApi } from "../lib/api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
    UserCog,
    MoreHorizontal,
    Pencil,
    Trash2,
    Loader2,
    Euro,
    Clock,
    CreditCard,
} from "lucide-react";

const paymentMethods = ["Contanti", "Bonifico", "Assegno", "Altro"];
const paymentStatuses = [
    { value: "pending", label: "In Attesa" },
    { value: "partial", label: "Parziale" },
    { value: "paid", label: "Pagato" },
];

const statusStyles = {
    pending: "bg-yellow-100 text-yellow-700",
    partial: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
};

const emptyEmployee = {
    name: "",
    role: "",
    hourly_rate: 0,
    daily_rate: 0,
    tax_info: "",
    phone: "",
    email: "",
    notes: "",
};

const emptyWorklog = {
    employee_id: "",
    quote_id: "",
    date: new Date().toISOString().split("T")[0],
    hours: 0,
    days: 0,
    description: "",
};

const emptyPayment = {
    employee_id: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    payment_method: "",
    notes: "",
    status: "pending",
};

export default function EmployeesPage() {
    const [employees, setEmployees] = useState([]);
    const [payments, setPayments] = useState([]);
    const [worklogs, setWorklogs] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("employees");
    
    // Employee dialog
    const [employeeDialog, setEmployeeDialog] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [employeeForm, setEmployeeForm] = useState(emptyEmployee);
    
    // Worklog dialog
    const [worklogDialog, setWorklogDialog] = useState(false);
    const [worklogForm, setWorklogForm] = useState(emptyWorklog);
    
    // Payment dialog
    const [paymentDialog, setPaymentDialog] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [paymentForm, setPaymentForm] = useState(emptyPayment);
    
    const [saving, setSaving] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, type: "", item: null });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [employeesRes, paymentsRes, worklogsRes, quotesRes] = await Promise.all([
                employeesApi.getAll(),
                paymentsApi.getAll(),
                worklogsApi.getAll(),
                quotesApi.getAll(),
            ]);
            setEmployees(employeesRes.data);
            setPayments(paymentsRes.data);
            setWorklogs(worklogsRes.data);
            setQuotes(quotesRes.data);
        } catch (error) {
            toast.error("Errore nel caricamento dei dati");
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
        return new Date(dateStr).toLocaleDateString("it-IT");
    };

    const getEmployeeName = (employeeId) => {
        const emp = employees.find((e) => e.id === employeeId);
        return emp?.name || "-";
    };

    const getQuoteName = (quoteId) => {
        const quote = quotes.find((q) => q.id === quoteId);
        return quote?.quote_number || "-";
    };

    // Employee handlers
    const handleOpenEmployeeDialog = (employee = null) => {
        if (employee) {
            setEditingEmployee(employee);
            setEmployeeForm(employee);
        } else {
            setEditingEmployee(null);
            setEmployeeForm(emptyEmployee);
        }
        setEmployeeDialog(true);
    };

    const handleSaveEmployee = async (e) => {
        e.preventDefault();
        if (!employeeForm.name) {
            toast.error("Inserisci il nome del dipendente");
            return;
        }
        setSaving(true);
        try {
            if (editingEmployee) {
                await employeesApi.update(editingEmployee.id, employeeForm);
                toast.success("Dipendente aggiornato");
            } else {
                await employeesApi.create(employeeForm);
                toast.success("Dipendente creato");
            }
            setEmployeeDialog(false);
            loadData();
        } catch (error) {
            toast.error("Errore nel salvataggio");
        } finally {
            setSaving(false);
        }
    };

    // Worklog handlers
    const handleOpenWorklogDialog = () => {
        setWorklogForm(emptyWorklog);
        setWorklogDialog(true);
    };

    const handleSaveWorklog = async (e) => {
        e.preventDefault();
        if (!worklogForm.employee_id) {
            toast.error("Seleziona un dipendente");
            return;
        }
        setSaving(true);
        try {
            await worklogsApi.create(worklogForm);
            toast.success("Ore registrate");
            setWorklogDialog(false);
            loadData();
        } catch (error) {
            toast.error("Errore nel salvataggio");
        } finally {
            setSaving(false);
        }
    };

    // Payment handlers
    const handleOpenPaymentDialog = (payment = null) => {
        if (payment) {
            setEditingPayment(payment);
            setPaymentForm(payment);
        } else {
            setEditingPayment(null);
            setPaymentForm(emptyPayment);
        }
        setPaymentDialog(true);
    };

    const handleSavePayment = async (e) => {
        e.preventDefault();
        if (!paymentForm.employee_id || !paymentForm.amount) {
            toast.error("Inserisci dipendente e importo");
            return;
        }
        setSaving(true);
        try {
            if (editingPayment) {
                await paymentsApi.update(editingPayment.id, paymentForm);
                toast.success("Pagamento aggiornato");
            } else {
                await paymentsApi.create(paymentForm);
                toast.success("Pagamento registrato");
            }
            setPaymentDialog(false);
            loadData();
        } catch (error) {
            toast.error("Errore nel salvataggio");
        } finally {
            setSaving(false);
        }
    };

    // Delete handler
    const handleDelete = async () => {
        const { type, item } = deleteDialog;
        try {
            if (type === "employee") {
                await employeesApi.delete(item.id);
            } else if (type === "worklog") {
                await worklogsApi.delete(item.id);
            } else if (type === "payment") {
                await paymentsApi.delete(item.id);
            }
            toast.success("Eliminazione completata");
            setDeleteDialog({ open: false, type: "", item: null });
            loadData();
        } catch (error) {
            toast.error("Errore nell'eliminazione");
        }
    };

    // Calculate stats
    const totalPending = payments
        .filter((p) => p.status === "pending" || p.status === "partial")
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalPaid = payments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    return (
        <div className="space-y-6 animate-fade-in" data-testid="employees-page">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">Dipendenti</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestisci dipendenti, ore lavorate e pagamenti
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Dipendenti</p>
                                <p className="text-2xl font-bold font-heading">{employees.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <UserCog className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Da Pagare</p>
                                <p className="text-2xl font-bold font-heading text-warning">{formatCurrency(totalPending)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-warning" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pagato</p>
                                <p className="text-2xl font-bold font-heading text-success">{formatCurrency(totalPaid)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-success" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="employees">Dipendenti</TabsTrigger>
                        <TabsTrigger value="worklogs">Ore Lavorate</TabsTrigger>
                        <TabsTrigger value="payments">Pagamenti</TabsTrigger>
                    </TabsList>
                    <div>
                        {activeTab === "employees" && (
                            <Button onClick={() => handleOpenEmployeeDialog()} data-testid="new-employee-btn">
                                <Plus className="w-4 h-4 mr-2" />
                                Nuovo Dipendente
                            </Button>
                        )}
                        {activeTab === "worklogs" && (
                            <Button onClick={handleOpenWorklogDialog} data-testid="new-worklog-btn">
                                <Plus className="w-4 h-4 mr-2" />
                                Registra Ore
                            </Button>
                        )}
                        {activeTab === "payments" && (
                            <Button onClick={() => handleOpenPaymentDialog()} data-testid="new-payment-btn">
                                <Plus className="w-4 h-4 mr-2" />
                                Nuovo Pagamento
                            </Button>
                        )}
                    </div>
                </div>

                {/* Employees Tab */}
                <TabsContent value="employees">
                    <Card>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                </div>
                            ) : employees.length === 0 ? (
                                <div className="py-16 text-center">
                                    <UserCog className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                                    <h3 className="text-lg font-medium mb-2">Nessun dipendente</h3>
                                    <Button onClick={() => handleOpenEmployeeDialog()}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Aggiungi Dipendente
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Ruolo</TableHead>
                                            <TableHead>Contatti</TableHead>
                                            <TableHead className="text-right">Tariffa Oraria</TableHead>
                                            <TableHead className="text-right">Tariffa Giornaliera</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {employees.map((emp) => (
                                            <TableRow key={emp.id}>
                                                <TableCell className="font-medium">{emp.name}</TableCell>
                                                <TableCell>{emp.role || "-"}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {emp.phone || emp.email || "-"}
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(emp.hourly_rate)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(emp.daily_rate)}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleOpenEmployeeDialog(emp)}>
                                                                <Pencil className="w-4 h-4 mr-2" />
                                                                Modifica
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => setDeleteDialog({ open: true, type: "employee", item: emp })}
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
                </TabsContent>

                {/* Worklogs Tab */}
                <TabsContent value="worklogs">
                    <Card>
                        <CardContent className="p-0">
                            {worklogs.length === 0 ? (
                                <div className="py-16 text-center">
                                    <Clock className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                                    <h3 className="text-lg font-medium mb-2">Nessuna registrazione</h3>
                                    <Button onClick={handleOpenWorklogDialog}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Registra Ore
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Dipendente</TableHead>
                                            <TableHead>Progetto</TableHead>
                                            <TableHead className="text-center">Ore</TableHead>
                                            <TableHead className="text-center">Giorni</TableHead>
                                            <TableHead>Descrizione</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {worklogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>{formatDate(log.date)}</TableCell>
                                                <TableCell className="font-medium">{getEmployeeName(log.employee_id)}</TableCell>
                                                <TableCell>{getQuoteName(log.quote_id)}</TableCell>
                                                <TableCell className="text-center">{log.hours || "-"}</TableCell>
                                                <TableCell className="text-center">{log.days || "-"}</TableCell>
                                                <TableCell className="text-muted-foreground max-w-xs truncate">
                                                    {log.description || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteDialog({ open: true, type: "worklog", item: log })}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments">
                    <Card>
                        <CardContent className="p-0">
                            {payments.length === 0 ? (
                                <div className="py-16 text-center">
                                    <Euro className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                                    <h3 className="text-lg font-medium mb-2">Nessun pagamento</h3>
                                    <Button onClick={() => handleOpenPaymentDialog()}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Registra Pagamento
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Dipendente</TableHead>
                                            <TableHead className="text-right">Importo</TableHead>
                                            <TableHead>Metodo</TableHead>
                                            <TableHead>Stato</TableHead>
                                            <TableHead>Note</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{formatDate(payment.date)}</TableCell>
                                                <TableCell className="font-medium">{getEmployeeName(payment.employee_id)}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                                                <TableCell>{payment.payment_method || "-"}</TableCell>
                                                <TableCell>
                                                    <Badge className={statusStyles[payment.status]}>
                                                        {paymentStatuses.find((s) => s.value === payment.status)?.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground max-w-xs truncate">
                                                    {payment.notes || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleOpenPaymentDialog(payment)}>
                                                                <Pencil className="w-4 h-4 mr-2" />
                                                                Modifica
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => setDeleteDialog({ open: true, type: "payment", item: payment })}
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
                </TabsContent>
            </Tabs>

            {/* Employee Dialog */}
            <Dialog open={employeeDialog} onOpenChange={setEmployeeDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-heading">
                            {editingEmployee ? "Modifica Dipendente" : "Nuovo Dipendente"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveEmployee} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="emp-name">Nome *</Label>
                                <Input
                                    id="emp-name"
                                    value={employeeForm.name}
                                    onChange={(e) => setEmployeeForm((f) => ({ ...f, name: e.target.value }))}
                                    data-testid="employee-name-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="emp-role">Ruolo</Label>
                                <Input
                                    id="emp-role"
                                    value={employeeForm.role}
                                    onChange={(e) => setEmployeeForm((f) => ({ ...f, role: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="emp-hourly">Tariffa Oraria (€)</Label>
                                <Input
                                    id="emp-hourly"
                                    type="number"
                                    value={employeeForm.hourly_rate}
                                    onChange={(e) => setEmployeeForm((f) => ({ ...f, hourly_rate: parseFloat(e.target.value) || 0 }))}
                                    step="0.01"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="emp-daily">Tariffa Giornaliera (€)</Label>
                                <Input
                                    id="emp-daily"
                                    type="number"
                                    value={employeeForm.daily_rate}
                                    onChange={(e) => setEmployeeForm((f) => ({ ...f, daily_rate: parseFloat(e.target.value) || 0 }))}
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="emp-phone">Telefono</Label>
                                <Input
                                    id="emp-phone"
                                    value={employeeForm.phone}
                                    onChange={(e) => setEmployeeForm((f) => ({ ...f, phone: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="emp-email">Email</Label>
                                <Input
                                    id="emp-email"
                                    type="email"
                                    value={employeeForm.email}
                                    onChange={(e) => setEmployeeForm((f) => ({ ...f, email: e.target.value }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEmployeeDialog(false)}>
                                Annulla
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Salva
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Worklog Dialog */}
            <Dialog open={worklogDialog} onOpenChange={setWorklogDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Registra Ore Lavorate</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveWorklog} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Dipendente *</Label>
                            <Select
                                value={worklogForm.employee_id}
                                onValueChange={(value) => setWorklogForm((f) => ({ ...f, employee_id: value }))}
                            >
                                <SelectTrigger data-testid="worklog-employee-select">
                                    <SelectValue placeholder="Seleziona dipendente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Progetto</Label>
                            <Select
                                value={worklogForm.quote_id}
                                onValueChange={(value) => setWorklogForm((f) => ({ ...f, quote_id: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Nessuno" />
                                </SelectTrigger>
                                <SelectContent>
                                    {quotes.map((q) => (
                                        <SelectItem key={q.id} value={q.id}>{q.quote_number}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input
                                type="date"
                                value={worklogForm.date}
                                onChange={(e) => setWorklogForm((f) => ({ ...f, date: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Ore</Label>
                                <Input
                                    type="number"
                                    value={worklogForm.hours}
                                    onChange={(e) => setWorklogForm((f) => ({ ...f, hours: parseFloat(e.target.value) || 0 }))}
                                    step="0.5"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Giorni</Label>
                                <Input
                                    type="number"
                                    value={worklogForm.days}
                                    onChange={(e) => setWorklogForm((f) => ({ ...f, days: parseFloat(e.target.value) || 0 }))}
                                    step="0.5"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Descrizione</Label>
                            <Textarea
                                value={worklogForm.description}
                                onChange={(e) => setWorklogForm((f) => ({ ...f, description: e.target.value }))}
                                rows={2}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setWorklogDialog(false)}>
                                Annulla
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Salva
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading">
                            {editingPayment ? "Modifica Pagamento" : "Nuovo Pagamento"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSavePayment} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Dipendente *</Label>
                            <Select
                                value={paymentForm.employee_id}
                                onValueChange={(value) => setPaymentForm((f) => ({ ...f, employee_id: value }))}
                            >
                                <SelectTrigger data-testid="payment-employee-select">
                                    <SelectValue placeholder="Seleziona dipendente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Importo (€) *</Label>
                                <Input
                                    type="number"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                                    step="0.01"
                                    data-testid="payment-amount-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Data</Label>
                                <Input
                                    type="date"
                                    value={paymentForm.date}
                                    onChange={(e) => setPaymentForm((f) => ({ ...f, date: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Metodo</Label>
                                <Select
                                    value={paymentForm.payment_method}
                                    onValueChange={(value) => setPaymentForm((f) => ({ ...f, payment_method: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleziona" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map((m) => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Stato</Label>
                                <Select
                                    value={paymentForm.status}
                                    onValueChange={(value) => setPaymentForm((f) => ({ ...f, status: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentStatuses.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Note</Label>
                            <Textarea
                                value={paymentForm.notes}
                                onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
                                rows={2}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setPaymentDialog(false)}>
                                Annulla
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Salva
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, type: "", item: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Conferma Eliminazione</DialogTitle>
                        <DialogDescription>
                            Sei sicuro di voler procedere con l'eliminazione?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, type: "", item: null })}>
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
