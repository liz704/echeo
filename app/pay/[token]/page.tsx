"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const money = (v: any) =>
  v == null || v === "" ? "—" : `${Number(v).toLocaleString("fr-FR")} FCFA`;

export default function PaymentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState("");
  const [data, setData] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    params.then(async (p) => {
      setToken(p.token);
      try {
        let r: Response;
        try {
          r = await fetch(`${API}/payment/verify/${p.token}`);
        } catch {
          throw new Error(
            "Le serveur Échéo est actuellement injoignable. Vérifiez qu'il est bien démarré, puis réessayez."
          );
        }
        if (!r.ok) throw new Error((await r.text()) || "Lien invalide ou expiré");
        const json = await r.json();
        setData(json);
        if (json.expectedAmount != null) {
          setAmount(String(json.expectedAmount));
        }
      } catch (e: any) {
        setMessage(e.message || "Lien invalide ou expiré");
      } finally {
        setLoading(false);
      }
    });
  }, [params]);

  const confirm = async () => {
    setBusy(true);
    setMessage("");
    try {
      let r: Response;
      try {
        r = await fetch(`${API}/payment/confirm/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Number(amount) }),
        });
      } catch {
        throw new Error(
          "Le serveur Échéo est actuellement injoignable. Vérifiez qu'il est bien démarré, puis réessayez."
        );
      }
      const txt = await r.text();
      if (!r.ok) throw new Error(txt);
      let body: any = {};
      try {
        body = JSON.parse(txt);
      } catch {
        body = { message: txt };
      }
      setMessage(body.message || "Paiement enregistré avec succès. Vous pouvez fermer cette page.");
      setOk(true);
      setData((d: any) => ({
        ...d,
        used: true,
        amountPaid: Number(amount),
      }));
    } catch (e: any) {
      setMessage(e.message || "Impossible d'enregistrer le paiement");
      setOk(false);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="payPage">
        <section className="payCard">
          <p>Chargement du lien…</p>
        </section>
      </main>
    );
  }

  return (
    <main className="payPage">
      <section className="payCard">
        <div className="payBrand">É</div>
        <p className="eyebrow">ÉCHÉO · PAIEMENT</p>
        <h1>Paiement sécurisé</h1>
        {data ? (
          <>
            <div className="payInfo">
              <span>Montant attendu</span>
              <strong>{money(data.expectedAmount)}</strong>
            </div>
            {data.used || ok ? (
              <p className="ok">
                {ok
                  ? "Paiement enregistré. Merci !"
                  : "Ce lien a déjà été utilisé."}
              </p>
            ) : (
              <>
                <label>Montant payé (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Montant en FCFA"
                />
                <button
                  disabled={busy || amount === "" || Number(amount) < 0}
                  onClick={confirm}
                >
                  {busy ? "Enregistrement…" : "Confirmer le paiement"}
                </button>
                <p className="hint" style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
                  Simulation — aucune vraie transaction bancaire n’est effectuée.
                </p>
              </>
            )}
            {message && (
              <p className={ok || data.used ? "ok" : "payMessage"}>{message}</p>
            )}
          </>
        ) : (
          <p className="error">{message}</p>
        )}
      </section>
    </main>
  );
}
