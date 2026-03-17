import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
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
} from "lucide-react";
import { cn } from "../../lib/utils";

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
    const { user, logout, isAdmin } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="flex h-screen bg-surface" data-testid="main-layout">
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
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
