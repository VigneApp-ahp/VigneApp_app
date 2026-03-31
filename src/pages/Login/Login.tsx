import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo03.svg";
import BackgroundGradient from "@/components/shared/BackgroundGradient";

export default function Login() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate("/");
    } catch {
      setError("Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await loginWithGoogle();
      navigate("/");
    } catch {
      setError("Erreur de connexion Google");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <BackgroundGradient />

      <div
        className="relative z-10 w-full max-w-md rounded-2xl p-8 border border-white/10"
        style={{
          background: "rgba(15, 15, 25, 0.1)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="rounded-2xl p-4 mb-4 flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <img
              src={logo}
              alt="VigneApp logo"
              className="w-10 h-10 object-contain opacity-90"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">VigneApp</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestion de l'exploitation viticole
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        {/* Séparateur */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-muted-foreground text-xs">ou</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Google */}
        <Button variant="outline" className="w-full" onClick={handleGoogle}>
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-4 h-4 mr-2"
          />
          Continuer avec Google
        </Button>
      </div>
    </div>
  );
}
