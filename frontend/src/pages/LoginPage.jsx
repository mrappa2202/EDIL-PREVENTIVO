import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { authApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { PaintBucket, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuthStore();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            toast.error("Inserisci username e password");
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.login({ username, password });
            login(response.data.token, response.data.user);
            toast.success("Accesso effettuato con successo");
            navigate("/");
        } catch (error) {
            toast.error(error.response?.data?.detail || "Credenziali non valide");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" data-testid="login-page">
            {/* Left side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                            <PaintBucket className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="font-heading text-2xl font-bold text-foreground">Preventivi</h1>
                            <p className="text-sm text-muted-foreground">Pittura Edile</p>
                        </div>
                    </div>

                    <Card className="border-none shadow-xl">
                        <CardHeader className="space-y-1 pb-4">
                            <CardTitle className="text-2xl font-heading">Accedi</CardTitle>
                            <CardDescription>
                                Inserisci le tue credenziali per accedere al sistema
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Inserisci username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        disabled={loading}
                                        data-testid="login-username"
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Inserisci password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={loading}
                                            data-testid="login-password"
                                            className="h-11 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-11 font-medium"
                                    disabled={loading}
                                    data-testid="login-submit"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Accesso in corso...
                                        </>
                                    ) : (
                                        "Accedi"
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <p className="text-center text-sm text-muted-foreground">
                        Credenziali di default: <code className="bg-muted px-2 py-1 rounded">admin / admin123</code>
                    </p>
                </div>
            </div>

            {/* Right side - Hero Image */}
            <div 
                className="hidden lg:flex flex-1 bg-cover bg-center relative"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1717281234297-3def5ae3eee1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwyfHxob3VzZSUyMHBhaW50ZXJ8ZW58MHx8fHwxNzczNzgxNDk5fDA&ixlib=rb-4.1.0&q=85')"
                }}
            >
                <div className="absolute inset-0 bg-primary/60" />
                <div className="relative z-10 flex flex-col justify-end p-12 text-white">
                    <h2 className="text-4xl font-heading font-bold mb-4">
                        Gestione Preventivi Professionale
                    </h2>
                    <p className="text-lg text-white/80 max-w-md">
                        Crea, gestisci e monitora i tuoi preventivi di pittura edile in modo semplice e veloce.
                    </p>
                </div>
            </div>
        </div>
    );
}
