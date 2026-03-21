"use client";

import { useState, useTransition } from "react";
import { raiseTransactionDisputeAction } from "@/lib/actions/contracts";
import { loadWalletFundsAction } from "@/lib/actions/wallet";
import { WalletCoinIcon } from "@/shared/components/WalletCoinIcon";

export function WalletOverviewSection({ initialData, mode = "client" }) {
  const [data, setData] = useState(initialData);
  const [amount, setAmount] = useState("5000");
  const [error, setError] = useState("");
  const [activeDisputeTx, setActiveDisputeTx] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isDisputePending, startDisputeTransition] = useTransition();

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
  const currentBalance = Number(wallet.balance || 0);
  const heldBalance = Number(wallet.heldBalance || 0);
  const totalBalance = currentBalance + heldBalance;
  const availableRatio = totalBalance > 0 ? currentBalance / totalBalance : 0;
  const availableStroke = Math.round(availableRatio * 100);
  const heldStroke = Math.max(0, 100 - availableStroke);

  const transactionLabelMap = {
    wallet_load: "Wallet load",
    contract_funded: "Contract funded",
    contract_funding_adjustment: "Funding adjustment",
    contract_funding_cancelled: "Funding cancelled",
    contract_release: "Contract release",
    contract_refund: "Contract refund",
  };

  const formatAmount = (value) =>
    `${wallet.currency || "NPR"} ${Number(value || 0).toLocaleString()}`;

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

  const handleDisputeSubmit = (transaction) => {
    const txId = String(transaction?._id || "");
    const contractId = String(transaction?.contract || "");

    if (!txId || !contractId) {
      setError("This transaction is not linked to a contract dispute flow.");
      return;
    }

    if (!disputeReason.trim()) {
      setError("Please provide a dispute reason.");
      return;
    }

    setError("");
    startDisputeTransition(async () => {
      try {
        await raiseTransactionDisputeAction(contractId, txId, {
          reason: disputeReason,
          description: disputeDescription,
        });
        setActiveDisputeTx(null);
        setDisputeReason("");
        setDisputeDescription("");
      } catch (actionError) {
        setError(actionError.message || "Failed to raise dispute.");
      }
    });
  };

  const disputeEligibleTypes = new Set([
    "contract_funded",
    "contract_funding_adjustment",
    "contract_funding_cancelled",
    "contract_release",
    "contract_refund",
  ]);

  const canDisputeTransaction = (transaction) =>
    disputeEligibleTypes.has(transaction?.type);

  const recentTransactions = wallet.transactions?.slice(0, 10) || [];

  return (
    <div
      className="card"
      style={{
        padding: "var(--space-8)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,251,248,1) 100%)",
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "var(--text-2xl)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <WalletCoinIcon className="text-primary" height={22} width={22} />
            {mode === "client" ? "Wallet" : "Earnings"}
          </h1>
          <p className="text-muted" style={{ margin: "var(--space-2) 0 0" }}>
            {mode === "client"
              ? "Keep track of available balance and load dummy funds for testing."
              : "Review your wallet balance and the value you have earned through completed contracts."}
          </p>
        </div>
        <span className="badge badge-primary">
          {formatAmount(wallet.balance)}
        </span>
      </div>

      {error ? (
        <div className="card-error" style={{ marginBottom: "var(--space-4)" }}>
          {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: "var(--space-4)",
          gridTemplateColumns: "1.2fr 1fr",
          marginBottom: "var(--space-6)",
        }}
      >
        <div className="card-sm" style={{ marginBottom: 0 }}>
          <div
            className="flex items-center justify-between"
            style={{ gap: "var(--space-3)" }}
          >
            <div>
              <strong>Balance composition</strong>
              <p
                className="text-muted"
                style={{ margin: "var(--space-1) 0 0" }}
              >
                Available vs held funds
              </p>
            </div>
            <svg width="92" height="92" viewBox="0 0 42 42" aria-hidden="true">
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="none"
                stroke="var(--color-border-light)"
                strokeWidth="4"
              />
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="4"
                strokeDasharray={`${availableStroke} ${100 - availableStroke}`}
                strokeDashoffset="25"
              />
              <circle
                cx="21"
                cy="21"
                r="11.915"
                fill="none"
                stroke="var(--color-primary-100)"
                strokeWidth="3"
                strokeDasharray={`${heldStroke} ${100 - heldStroke}`}
                strokeDashoffset="25"
              />
            </svg>
          </div>
          <div
            style={{
              marginTop: "var(--space-3)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-3)",
            }}
          >
            <div>
              <div className="text-muted text-sm">Available</div>
              <div className="font-semibold">
                {formatAmount(wallet.balance)}
              </div>
            </div>
            <div>
              <div className="text-muted text-sm">Held</div>
              <div className="font-semibold">
                {formatAmount(wallet.heldBalance)}
              </div>
            </div>
          </div>
        </div>

        <div className="card-sm" style={{ marginBottom: 0 }}>
          <strong>Contract snapshot</strong>
          <div
            style={{
              marginTop: "var(--space-3)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-3)",
            }}
          >
            <div>
              <div className="text-muted text-sm">Completed</div>
              <div className="font-semibold">{summary.completedContracts}</div>
            </div>
            <div>
              <div className="text-muted text-sm">Active</div>
              <div className="font-semibold">{summary.activeContracts}</div>
            </div>
            {mode === "freelancer" ? (
              <div>
                <div className="text-muted text-sm">Earned</div>
                <div className="font-semibold">
                  {formatAmount(summary.completedContractEarnings)}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-muted text-sm">Committed</div>
                <div className="font-semibold">
                  {formatAmount(summary.activeContractValue)}
                </div>
              </div>
            )}
            <div>
              <div className="text-muted text-sm">
                {mode === "freelancer" ? "Pipeline" : "Spent"}
              </div>
              <div className="font-semibold">
                {mode === "freelancer"
                  ? formatAmount(summary.activeContractValue)
                  : formatAmount(wallet.totalSpent)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "var(--space-3)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div className="card-sm" style={{ marginBottom: 0 }}>
          <div className="text-muted text-sm">Current balance</div>
          <div
            className="font-semibold"
            style={{ marginTop: "var(--space-1)" }}
          >
            {formatAmount(wallet.balance)}
          </div>
        </div>
        {mode === "client" ? (
          <div className="card-sm" style={{ marginBottom: 0 }}>
            <div className="text-muted text-sm">Held funds</div>
            <div
              className="font-semibold"
              style={{ marginTop: "var(--space-1)" }}
            >
              {formatAmount(wallet.heldBalance)}
            </div>
          </div>
        ) : (
          <div className="card-sm" style={{ marginBottom: 0 }}>
            <div className="text-muted text-sm">Total earned</div>
            <div
              className="font-semibold"
              style={{ marginTop: "var(--space-1)" }}
            >
              {formatAmount(wallet.totalEarned)}
            </div>
          </div>
        )}
        <div className="card-sm" style={{ marginBottom: 0 }}>
          <div className="text-muted text-sm">Total loaded</div>
          <div
            className="font-semibold"
            style={{ marginTop: "var(--space-1)" }}
          >
            {formatAmount(wallet.totalLoaded)}
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
        {recentTransactions.length ? (
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {recentTransactions.map((transaction) => {
              const isCredit = transaction.direction === "credit";
              const typeLabel =
                transactionLabelMap[transaction.type] ||
                (transaction.type || "transaction").replaceAll("_", " ");

              return (
                <div key={transaction._id} className="card-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <strong>{transaction.description || typeLabel}</strong>
                      <div className="text-sm text-muted">
                        {new Date(transaction.createdAt).toLocaleString(
                          "en-NP",
                        )}
                      </div>
                    </div>
                    <span
                      className={`badge ${isCredit ? "badge-success" : ""}`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatAmount(transaction.amount)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "var(--space-2)",
                      marginTop: "var(--space-2)",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      className="text-muted text-sm"
                      style={{ textTransform: "capitalize" }}
                    >
                      {typeLabel}
                    </span>
                    {canDisputeTransaction(transaction) ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setActiveDisputeTx(
                            activeDisputeTx === String(transaction._id)
                              ? null
                              : String(transaction._id),
                          );
                          setDisputeReason("");
                          setDisputeDescription("");
                        }}
                      >
                        Raise dispute
                      </button>
                    ) : null}
                  </div>

                  {activeDisputeTx === String(transaction._id) ? (
                    <div
                      style={{
                        marginTop: "var(--space-3)",
                        borderTop: "1px solid var(--color-border-light)",
                        paddingTop: "var(--space-3)",
                        display: "grid",
                        gap: "var(--space-3)",
                      }}
                    >
                      {!transaction?.contract ? (
                        <p className="text-muted text-sm mb-0">
                          This older transaction is missing a contract link, so
                          dispute submission is unavailable.
                        </p>
                      ) : null}
                      <div className="form-group mb-0">
                        <label
                          className="form-label"
                          htmlFor={`wallet-dispute-reason-${transaction._id}`}
                        >
                          Dispute reason
                        </label>
                        <input
                          id={`wallet-dispute-reason-${transaction._id}`}
                          className="form-input"
                          type="text"
                          placeholder="Payment issue, wrong release, etc."
                          value={disputeReason}
                          onChange={(event) =>
                            setDisputeReason(event.target.value)
                          }
                        />
                      </div>
                      <div className="form-group mb-0">
                        <label
                          className="form-label"
                          htmlFor={`wallet-dispute-description-${transaction._id}`}
                        >
                          Details
                        </label>
                        <textarea
                          id={`wallet-dispute-description-${transaction._id}`}
                          className="form-input"
                          rows={3}
                          placeholder="Share what happened and what resolution you need."
                          value={disputeDescription}
                          onChange={(event) =>
                            setDisputeDescription(event.target.value)
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={isDisputePending || !transaction?.contract}
                          onClick={() => handleDisputeSubmit(transaction)}
                        >
                          {isDisputePending
                            ? "Submitting..."
                            : "Submit dispute"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setActiveDisputeTx(null)}
                          disabled={isDisputePending}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted mb-0">No wallet transactions yet.</p>
        )}
      </div>
    </div>
  );
}
