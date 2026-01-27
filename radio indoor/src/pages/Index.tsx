import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();

  // Enquanto verifica a sessão, mostra carregando
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Carregando...
      </div>
    );
  }

  // Se não estiver logado → login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se estiver logado → dashboard
  return <Navigate to="/dashboard" replace />;
};

export default Index;
