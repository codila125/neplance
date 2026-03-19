"use client";

import { useState, useTransition } from "react";
import { loadWalletFundsAction } from "@/lib/actions/wallet";

export function WalletOverviewSection({ initialData, mode = "client" }) {
  const [data, setData] = useState(initialData);
  const [amount, setAmount] = useState("5000");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const wallet = data?.wallet || {
    balance: 0,
    heldBalance: 0,
    totalLoaded: 0,
    totalSpent: 0,
    totalEarned: 0,
    currency: "NPR",
    transactions: [],
  };
  const summary = data?.summary || {
    completedContractEarnings: 0,
    activeContractValue: 0,
    completedContracts: 0,
    activeContracts: 0,
    canLoadFunds: false,
  };

  const handleLoadFunds = () => {
    setError("");
    startTransition(async () => {
      try {
        const result = await loadWalletFundsAction(amount);
        setData(result.data);
      } catch (actionError) {
        setError(actionError.message || "Failed to load wallet.");
      }
    });
  };

  return (
    <div className="card" style={{ padding: "var(--space-8)" }}>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--text-2xl)" }}>
            {mode === "client" ? "Wallet" : "Earnings"}
          </h1>
          <p className="text-muted" style={{ margin: "var(--space-2) 0 0" }}>
            {mode === "client"
              ? "Keep track of available balance and load dummy funds for testing."
              : "Review your wallet balance and the value you have earned through completed contracts."}
          </p>
        </div>
        <span className="badge badge-primary">
          {wallet.currency || "NPR"}{" "}
          {Number(wallet.balance || 0).toLocaleString()}
        </span>
      </div>

      {error ? (
        <div className="card-error" style={{ marginBottom: "var(--space-4)" }}>
          {error}
        </div>
      ) : null}

      <div className="cards-list" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card-sm">
          <strong>Available balance</strong>
          <div className="text-muted mt-2">
            {wallet.currency || "NPR"}{" "}
            {Number(wallet.balance || 0).toLocaleString()}
          </div>
        </div>
        <div className="card-sm">
          <strong>Completed earnings</strong>
          <div className="text-muted mt-2">
            {wallet.currency || "NPR"}{" "}
            {Number(summary.completedContractEarnings || 0).toLocaleString()}
          </div>
        </div>
        <div className="card-sm">
          <strong>Held funds</strong>
          <div className="text-muted mt-2">
            {wallet.currency || "NPR"}{" "}
            {Number(wallet.heldBalance || 0).toLocaleString()}
          </div>
        </div>
        <div className="card-sm">
          <strong>Active contract value</strong>
          <div className="text-muted mt-2">
            {wallet.currency || "NPR"}{" "}
            {Number(summary.activeContractValue || 0).toLocaleString()}
          </div>
        </div>
        <div className="card-sm">
          <strong>Completed contracts</strong>
          <div className="text-muted mt-2">
            {Number(summary.completedContracts || 0)}
          </div>
        </div>
      </div>

      {mode === "client" && summary.canLoadFunds ? (
        <div className="card-sm" style={{ marginBottom: "var(--space-6)" }}>
          <h3 className="mb-3">Load Wallet</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 220px) auto",
              gap: "var(--space-3)",
              alignItems: "end",
            }}
          >
            <div className="form-group mb-0">
              <label className="form-label" htmlFor="wallet-load-amount">
                Amount (NPR)
              </label>
              <input
                id="wallet-load-amount"
                className="form-input"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isPending}
              onClick={handleLoadFunds}
            >
              {isPending ? "Loading..." : "Load Funds"}
            </button>
          </div>
        </div>
      ) : null}

      <div>
        <h3 className="mb-3">Recent Transactions</h3>
        {wallet.transactions?.length ? (
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {wallet.transactions.slice(0, 8).map((transaction) => (
              <div key={transaction._id} className="card-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <strong>
                      {transaction.description || transaction.type}
                    </strong>
                    <div className="text-sm text-muted">
                      {new Date(transaction.createdAt).toLocaleString("en-NP")}
                    </div>
                  </div>
                  <span className="badge">
                    {transaction.direction === "credit" ? "+" : "-"}
                    {wallet.currency || "NPR"}{" "}
                    {Number(transaction.amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted mb-0">No wallet transactions yet.</p>
        )}
      </div>
    </div>
  );
}
