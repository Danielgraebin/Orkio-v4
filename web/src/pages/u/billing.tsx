import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api } from "../../lib/api";

export default function UserBilling() {
  const router = useRouter();
  const [billing, setBilling] = useState<any>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem("orkio_u_token") : null;

  useEffect(() => {
    if (!token) {
      router.push("/u/login");
      return;
    }
    loadBilling();
  }, [token]);

  async function loadBilling() {
    try {
      const response = await api.get("/u/billing", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBilling(response.data);
    } catch (err) {
      console.error("Failed to load billing", err);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", padding: 20 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 30 }}>
        <div>
          <a href="/u/dashboard" className="btn secondary">← Back</a>
          <h2 style={{ marginTop: 10 }}>Billing</h2>
        </div>
        <img src="/logo-orkio.png" width={120} />
      </div>

      <div className="card">
        <h3>Billing Summary</h3>
        {!billing ? (
          <p style={{ color: "#888", marginTop: 16 }}>Loading...</p>
        ) : (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <strong>Plan:</strong> {billing.plan}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Balance:</strong> ${billing.balance}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Usage (current month):</strong> ${billing.usage_current_month}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

