import { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { searchApi, authApi } from "../../lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "../ui/command";
import {
    LayoutDashboard,
    Users,
    FileText,
    Package,
    Receipt,
    UserCog,
    Settings,
    LogOut,
    Sun,
    Moon,
    PaintBucket,
    ChevronRight,
    Search,
    Building2,
    AlertTriangle,
    Clock,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/clienti", icon: Users, label: "Clienti" },
    { path: "/preventivi", icon: FileText, label: "Preventivi" },
    { path: "/materiali", icon: Package, label: "Materiali" },
    { path: "/spese", icon: Receipt, label: "Spese" },
    { path: "/dipendenti", icon: UserCog, label: "Dipendenti" },
];

const adminItems = [
    { path: "/utenti", icon: Users, label: "Gestione Utenti" },
];

export const MainLayout = () => {
    const navigate = useNavigate();
    const { user, logout, isAdmin, updateActivity, inactivityTimeout, rememberMe, lastActivity } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    
    // Global search state
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState({ clients: [], quotes: [], materials: [] });
    const [searching, setSearching] = useState(false);
    
    // Inactivity state
    const [showInactivityWarning, setShowInactivityWarning] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const warningShownRef = useRef(false);
    const activityTimeoutRef = useRef(null);
    const warningTimeoutRef = useRef(null);

    // Handle logout
    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (e) {
            // Ignore errors on logout
        }
        logout();
        navigate("/login");
    };
    
    // Track user activity
    const handleUserActivity = useCallback(() => {
        updateActivity();
        warningShownRef.current = false;
        setShowInactivityWarning(false);
    }, [updateActivity]);
    
    // Setup activity listeners
    useEffect(() => {
        if (rememberMe) return; // No timeout for "remember me"
        
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, handleUserActivity, { passive: true });
        });
        
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleUserActivity);
            });
        };
    }, [handleUserActivity, rememberMe]);
    
    // Check for inactivity
    useEffect(() => {
        if (rememberMe) return;
        
        const checkInactivity = () => {
            if (!lastActivity) return;
            
            const elapsed = (Date.now() - lastActivity) / 1000 / 60; // minutes
            const remaining = inactivityTimeout - elapsed;
            
            if (remaining <= 0) {
                // Session expired
                toast.error("Sessione scaduta per inattività");
                handleLogout();
            } else if (remaining <= 2 && !warningShownRef.current) {
                // Show warning 2 minutes before timeout
                warningShownRef.current = true;
                setShowInactivityWarning(true);
                setTimeRemaining(Math.ceil(remaining * 60));
            }
        };
        
        const interval = setInterval(checkInactivity, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, [lastActivity, inactivityTimeout, rememberMe, handleLogout]);
    
    // Update countdown timer
    useEffect(() => {
        if (!showInactivityWarning) return;
        
        const countdown = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(countdown);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        return () => clearInterval(countdown);
    }, [showInactivityWarning]);
    
    // Global search handler
    const handleSearch = useCallback(async (query) => {
        if (!query || query.length < 2) {
            setSearchResults({ clients: [], quotes: [], materials: [] });
            return;
        }
        
        setSearching(true);
        try {
            const response = await searchApi.search(query);
            setSearchResults(response.data);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setSearching(false);
        }
    }, []);
    
    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);
    
    // Keyboard shortcut for search (Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === 'Escape') {
                setSearchOpen(false);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    const handleSearchSelect = (type, item) => {
        setSearchOpen(false);
        setSearchQuery("");
        
        switch (type) {
            case 'client':
                navigate(`/clienti/${item.id}`);
                break;
            case 'quote':
                navigate(`/preventivi/${item.id}`);
                break;
            case 'material':
                navigate('/materiali');
                break;
            default:
                break;
        }
    };
    
    const totalResults = searchResults.clients.length + searchResults.quotes.length + searchResults.materials.length;

    return (
        <div className="flex h-screen bg-surface" data-testid="main-layout">
            {/* Global Search Dialog */}
            <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                <DialogContent className="max-w-2xl p-0 gap-0">
                    <DialogTitle className="sr-only">Ricerca Globale</DialogTitle>
                    <Command className="rounded-lg border-none" shouldFilter={false}>
                        <CommandInput 
                            placeholder="Cerca clienti, preventivi, materiali..." 
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            data-testid="global-search-input"
                        />
                        <CommandList className="max-h-[400px]">
                            {!searchQuery && (
                                <CommandEmpty>
                                    Digita per cercare...
                                </CommandEmpty>
                            )}
                            {searchQuery && totalResults === 0 && !searching && (
                                <CommandEmpty>
                                    Nessun risultato per "{searchQuery}"
                                </CommandEmpty>
                            )}
                            {searchResults.clients.length > 0 && (
                                <CommandGroup heading="Clienti">
                                    {searchResults.clients.map((client) => (
                                        <CommandItem
                                            key={client.id}
                                            value={`client-${client.id}`}
                                            onSelect={() => handleSearchSelect('client', client)}
                                            className="cursor-pointer"
                                        >
                                            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <div className="flex flex-col">
                                                <span>{client.company_name || client.name}</span>
                                                {client.email && (
                                                    <span className="text-xs text-muted-foreground">{client.email}</span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            {searchResults.quotes.length > 0 && (
                                <CommandGroup heading="Preventivi">
                                    {searchResults.quotes.map((quote) => (
                                        <CommandItem
                                            key={quote.id}
                                            value={`quote-${quote.id}`}
                                            onSelect={() => handleSearchSelect('quote', quote)}
                                            className="cursor-pointer"
                                        >
                                            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <div className="flex flex-col">
                                                <span>{quote.quote_number}</span>
                                                {quote.project_description && (
                                                    <span className="text-xs text-muted-foreground truncate max-w-[400px]">
                                                        {quote.project_description}
                                                    </span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            {searchResults.materials.length > 0 && (
                                <CommandGroup heading="Materiali">
                                    {searchResults.materials.map((material) => (
                                        <CommandItem
                                            key={material.id}
                                            value={`material-${material.id}`}
                                            onSelect={() => handleSearchSelect('material', material)}
                                            className="cursor-pointer"
                                        >
                                            <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <div className="flex flex-col">
                                                <span>{material.name}</span>
                                                {material.supplier && (
                                                    <span className="text-xs text-muted-foreground">{material.supplier}</span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </DialogContent>
            </Dialog>
            
            {/* Inactivity Warning Dialog */}
            <Dialog open={showInactivityWarning} onOpenChange={setShowInactivityWarning}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            Sessione in scadenza
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-muted-foreground mb-4">
                            La tua sessione scadrà tra <span className="font-bold text-foreground">{timeRemaining}</span> secondi per inattività.
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Muovi il mouse o premi un tasto per continuare.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleLogout}>
                            Esci ora
                        </Button>
                        <Button onClick={handleUserActivity}>
                            Continua a lavorare
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border z-50 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                            <PaintBucket className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="font-heading font-bold text-foreground">Preventivi</h1>
                            <p className="text-xs text-muted-foreground">Pittura Edile</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 py-4">
                    <nav className="px-3 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === "/"}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:bg-surface-highlight hover:text-foreground"
                                    )
                                }
                                data-testid={`nav-${item.label.toLowerCase()}`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                                <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100" />
                            </NavLink>
                        ))}

                        {isAdmin() && (
                            <>
                                <Separator className="my-4" />
                                <p className="px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                                    Amministrazione
                                </p>
                                {adminItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                                                isActive
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-muted-foreground hover:bg-surface-highlight hover:text-foreground"
                                            )
                                        }
                                        data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </NavLink>
                                ))}
                            </>
                        )}
                    </nav>
                </ScrollArea>

                {/* Settings & User */}
                <div className="p-4 border-t border-border space-y-2">
                    <NavLink
                        to="/impostazioni"
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-surface-highlight hover:text-foreground"
                            )
                        }
                        data-testid="nav-impostazioni"
                    >
                        <Settings className="w-5 h-5" />
                        Impostazioni
                    </NavLink>

                    <div className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                    {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
                                </span>
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-foreground truncate max-w-[100px]">
                                    {user?.name || user?.username}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                className="h-8 w-8"
                                data-testid="theme-toggle"
                            >
                                {theme === "light" ? (
                                    <Moon className="h-4 w-4" />
                                ) : (
                                    <Sun className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                data-testid="logout-btn"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 overflow-auto">
                {/* Top Header with Search */}
                <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
                    <div className="flex items-center justify-between px-8 h-14">
                        <Button
                            variant="outline"
                            className="relative w-64 justify-start text-sm text-muted-foreground"
                            onClick={() => setSearchOpen(true)}
                            data-testid="global-search-btn"
                        >
                            <Search className="mr-2 h-4 w-4" />
                            Cerca...
                            <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </Button>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {!rememberMe && (
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Timeout: {inactivityTimeout}min
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
