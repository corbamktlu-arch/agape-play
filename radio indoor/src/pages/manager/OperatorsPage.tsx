import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { Dialog,DialogContent,DialogHeader,DialogTitle,} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ManagerLimitRow = Database["public"]["Tables"]["manager_limits"]["Row"];

export default function OperatorsPage() {
  const [loading, setLoading] = useState(true);
  const [maxUsers, setMaxUsers] = useState<number>(0);
  const [operators, setOperators] = useState<ProfileRow[]>([]);

  // (vamos usar já já no modal)
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name")
        .order("name");

      if (error) throw error;

      const list = (data ?? []).map((s) => ({
        id: String((s as any).id),
        name: String((s as any).name),
      }));

      setStores(list);

      // se ainda não tem nenhuma selecionada, marca a primeira
      if (list.length > 0 && selectedStoreIds.length === 0) {
        setSelectedStoreIds([list[0].id]);
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar lojas");
    }
  };

  async function loadData() {
    try {
      setLoading(true);

      // ✅ carrega lojas para usar no modal
      await loadStores();

      // 1) user logado
      const { data: u, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;

      const userId = u.user?.id;
      if (!userId) {
        toast.error("Você precisa estar logado.");
        return;
      }

      // 2) limite do manager
      const { data: lim, error: limErr } = await supabase
        .from("manager_limits")
        .select("max_users")
        .eq("manager_user_id", userId)
        .maybeSingle();

      if (limErr) throw limErr;

      const max = (lim as ManagerLimitRow | null)?.max_users ?? 0;
      setMaxUsers(Number(max));

      // 3) operadores criados por esse manager
      const { data: ops, error: opsErr } = await supabase
        .from("profiles")
        .select(
          "user_id, full_name, email, store_id, created_by, created_at, account_status"
        )
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

      if (opsErr) throw opsErr;

      setOperators((ops ?? []) as unknown as ProfileRow[]);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao carregar operadores");
    } finally {
      setLoading(false);
    }
  }
const handleCreateOperator = async () => {
  try {
    if (!email.trim()) {
      toast.error("Informe um email");
      return;
    }
    if (selectedStoreIds.length === 0) {
      toast.error("Selecione pelo menos 1 loja");
      return;
    }

    setCreating(true);

    const { data, error } = await supabase.functions.invoke("manager-create-operator", {
      body: {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        store_ids: selectedStoreIds,
      },
    });

    if (error) {
      toast.error(error.message || "Erro ao criar operador");
      return;
    }

    toast.success("Operador criado com sucesso!");
    // se vier senha temporária, mostra
    if (data?.temp_password) {
      toast.message(`Senha temporária: ${data.temp_password}`);
    }

    // limpa campos e fecha modal
    setEmail("");
    setName("");
    setOpenCreate(false);

    // recarrega lista
    await loadData();
  } catch (e: any) {
    toast.error(e.message || "Erro ao criar operador");
  } finally {
    setCreating(false);
  }
};

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const used = operators.length;
  const reachedLimit = maxUsers > 0 && used >= maxUsers;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Meus Operadores</h1>
          <div className="text-sm opacity-70">
            Usados: <b>{used}</b> / <b>{maxUsers}</b>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            Atualizar
          </Button>

          <Button
                 onClick={() => setOpenCreate(true)}
                  disabled={loading || reachedLimit}
>
                                          Criar Operador
                                                 </Button>

        </div>
      </div>

      {reachedLimit && (
        <div className="rounded-md border p-3 text-sm">
          Você atingiu seu limite de criação de operadores.
        </div>
      )}

      {loading ? (
        <div className="text-sm opacity-70">Carregando...</div>
      ) : operators.length === 0 ? (
        <div className="rounded-md border p-4 text-sm opacity-70">
          Nenhum operador criado ainda.
        </div>
      ) : (
        <div className="space-y-2">
          {operators.map((op) => (
            <div
              key={op.user_id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {op.full_name ?? "Sem nome"}
                </div>
                <div className="text-sm opacity-70 truncate">{op.email ?? "-"}</div>
              </div>

              <div className="text-sm opacity-70">
                {op.created_at ? new Date(op.created_at).toLocaleString() : "-"}
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Criar Operador</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      {/* Email */}
      <div className="space-y-1">
        <Label>Email</Label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="operador@empresa.com"
        />
      </div>

      {/* Nome */}
      <div className="space-y-1">
        <Label>Nome</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do Operador"
        />
      </div>

      {/* Lojas */}
      <div className="space-y-2">
        <Label>Lojas</Label>

        <div className="max-h-40 overflow-auto rounded-md border p-2 space-y-2">
          {stores.map((s) => {
            const checked = selectedStoreIds.includes(s.id);

            return (
              <label
                key={s.id}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStoreIds((prev) => [...prev, s.id]);
                    } else {
                      setSelectedStoreIds((prev) =>
                        prev.filter((x) => x !== s.id)
                      );
                    }
                  }}
                />
                {s.name}
              </label>
            );
          })}
        </div>

        <p className="text-xs opacity-70">
          Selecione pelo menos 1 loja.
        </p>
      </div>

      {/* Botão */}
     <Button
  className="w-full"
  onClick={handleCreateOperator}
  disabled={creating}
>
  {creating ? "Criando..." : "Criar Operador"}
</Button>

    </div>
  </DialogContent>
</Dialog>

    </div>
  );
}
