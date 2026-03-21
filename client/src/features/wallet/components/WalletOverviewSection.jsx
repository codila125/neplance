"use client";

import { useState, useTransition } from "react";
import {
  loadWalletFundsAction,
  requestWithdrawalAction,
} from "@/lib/actions/wallet";
import { CloudinaryFileUploader } from "@/shared/components/CloudinaryFileUploader";
import { WalletCoinIcon } from "@/shared/components/WalletCoinIcon";

const PAYMENT_OPTIONS = [
  { id: "esewa", label: "eSewa" },
  { id: "khalti", label: "Khalti" },
  { id: "bank", label: "Bank" },
];

function BrandBadge() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="16" fill="#14a800" />
      <path
        d="M12 10L16 20L20 10"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 15H22"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StaticQrCard() {
  return (
    <div
      style={{
        width: "220px",
        height: "220px",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        background:
          "linear-gradient(135deg, rgba(20,168,0,0.08) 0%, rgba(255,255,255,1) 100%)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          width: "180px",
          height: "180px",
          background:
            "repeating-linear-gradient(0deg, #111 0 10px, #fff 10px 20px), repeating-linear-gradient(90deg, #111 0 10px, #fff 10px 20px)",
          padding: "var(--space-4)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "50% auto auto 50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            padding: "var(--space-2)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <BrandBadge />
        </div>
      </div>
    </div>
  );
}

export function WalletOverviewSection({ initialData, mode = "client" }) {
  const [data, setData] = useState(initialData);
  const [amount, setAmount] = useState("5000");
  const [withdrawAmount, setWithdrawAmount] = useState("1000");
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [withdrawQrAttachment, setWithdrawQrAttachment] = useState(null);
  const [isPending, startTransition] = useTransition();

  const wallet = data?.wallet || {
    balance: 0,
    heldBalance: 0,
    totalLoaded: 0,
    totalSpent: 0,
    totalEarned: 0,
    pendingWithdrawalBalance: 0,
    currency: "NPR",
    transactions: [],
  };
  const summary = data?.summary || {
    completedContractEarnings: 0,
    activeContractValue: 0,
    completedContracts: 0,
    activeContracts: 0,
    canLoadFunds: false,
    canWithdrawFunds: false,
  };
  const pendingLoadRequests = data?.pendingLoadRequests || [];
  const pendingWithdrawalRequests = data?.pendingWithdrawalRequests || [];
  const recentTransactions = wallet.transactions?.slice(0, 10) || [];

  const formatAmount = (value) =>
    `${wallet.currency || "NPR"} ${Number(value || 0).toLocaleString()}`;

  const resetPaymentRequest = () => {
    setSelectedPaymentMethod("");
    setTransactionId("");
    setPaymentScreenshot(null);
    setShowPaymentModal(false);
  };

  const handlePaymentRequest = () => {
    setError("");
    startTransition(async () => {
      try {
        const result = await loadWalletFundsAction({
          amount,
          paymentMethod: selectedPaymentMethod,
          transactionId,
          screenshot: paymentScreenshot,
        });
        setData(result.data);
        resetPaymentRequest();
      } catch (actionError) {
        setError(actionError.message || "Failed to submit payment request.");
      }
    });
  };

  const handleWithdrawalRequest = () => {
    setError("");
    startTransition(async () => {
      try {
        const result = await requestWithdrawalAction({
          amount: withdrawAmount,
          qrAttachment: withdrawQrAttachment,
        });
        setData(result.data);
        setWithdrawAmount("1000");
        setWithdrawQrAttachment(null);
      } catch (actionError) {
        setError(actionError.message || "Failed to request withdrawal.");
      }
    });
  };

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
              ? "Track available balance, pending top-up verification, and funded contracts."
              : "Review your available balance, contract earnings, and withdrawal requests."}
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
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
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
        <div className="card-sm" style={{ marginBottom: 0 }}>
          <div className="text-muted text-sm">Held funds</div>
          <div
            className="font-semibold"
            style={{ marginTop: "var(--space-1)" }}
          >
            {formatAmount(wallet.heldBalance)}
          </div>
        </div>
        <div className="card-sm" style={{ marginBottom: 0 }}>
          <div className="text-muted text-sm">
            {mode === "client" ? "Pending loads" : "Pending withdrawal"}
          </div>
          <div
            className="font-semibold"
            style={{ marginTop: "var(--space-1)" }}
          >
            {mode === "client"
              ? pendingLoadRequests.length
              : formatAmount(wallet.pendingWithdrawalBalance)}
          </div>
        </div>
        <div className="card-sm" style={{ marginBottom: 0 }}>
          <div className="text-muted text-sm">
            {mode === "client" ? "Total loaded" : "Total earned"}
          </div>
          <div
            className="font-semibold"
            style={{ marginTop: "var(--space-1)" }}
          >
            {mode === "client"
              ? formatAmount(wallet.totalLoaded)
              : formatAmount(wallet.totalEarned)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "var(--space-4)",
          gridTemplateColumns: "1fr 1fr",
          marginBottom: "var(--space-6)",
        }}
      >
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
              <div className="text-muted text-sm">Completed contracts</div>
              <div className="font-semibold">{summary.completedContracts}</div>
            </div>
            <div>
              <div className="text-muted text-sm">Active contracts</div>
              <div className="font-semibold">{summary.activeContracts}</div>
            </div>
            <div>
              <div className="text-muted text-sm">
                {mode === "client" ? "Committed" : "Completed earnings"}
              </div>
              <div className="font-semibold">
                {formatAmount(
                  mode === "client"
                    ? summary.activeContractValue
                    : summary.completedContractEarnings,
                )}
              </div>
            </div>
            <div>
              <div className="text-muted text-sm">
                {mode === "client" ? "Spent" : "Pipeline"}
              </div>
              <div className="font-semibold">
                {formatAmount(
                  mode === "client"
                    ? wallet.totalSpent
                    : summary.activeContractValue,
                )}
              </div>
            </div>
          </div>
        </div>

        {mode === "client" && summary.canLoadFunds ? (
          <div className="card-sm" style={{ marginBottom: 0 }}>
            <h3 className="mb-3">Load Wallet</h3>
            <div className="form-group mb-0">
              <label className="form-label" htmlFor="wallet-load-amount">
                Load amount (NPR)
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
            <div
              className="grid grid-cols-3"
              style={{ gap: "var(--space-3)", marginTop: "var(--space-3)" }}
            >
              {PAYMENT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="card-sm"
                  style={{
                    textAlign: "center",
                    cursor: "pointer",
                    marginBottom: 0,
                  }}
                  onClick={() => {
                    setSelectedPaymentMethod(option.id);
                    setShowPaymentModal(true);
                  }}
                >
                  <div className="flex justify-center mb-2">
                    <BrandBadge />
                  </div>
                  <strong>{option.label}</strong>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {mode === "freelancer" && summary.canWithdrawFunds ? (
          <div className="card-sm" style={{ marginBottom: 0 }}>
            <h3 className="mb-3">Withdraw Earnings</h3>
            <div className="form-group mb-0">
              <label className="form-label" htmlFor="wallet-withdraw-amount">
                Withdraw amount (NPR)
              </label>
              <input
                id="wallet-withdraw-amount"
                className="form-input"
                type="number"
                min="1"
                step="1"
                value={withdrawAmount}
                onChange={(event) => setWithdrawAmount(event.target.value)}
              />
            </div>
            <p className="text-muted" style={{ margin: "var(--space-3) 0" }}>
              Requested withdrawals are held from your available balance until
              admin verifies and releases the payout.
            </p>
            <CloudinaryFileUploader
              folder="neplance/withdrawals"
              buttonLabel="Upload QR"
              onUploaded={setWithdrawQrAttachment}
            />
            {withdrawQrAttachment?.url ? (
              <a
                href={withdrawQrAttachment.url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ marginBottom: "var(--space-3)" }}
              >
                View Uploaded QR
              </a>
            ) : null}
            <button
              type="button"
              className="btn btn-primary"
              disabled={isPending}
              onClick={handleWithdrawalRequest}
            >
              {isPending ? "Requesting..." : "Request Withdrawal"}
            </button>
          </div>
        ) : null}
      </div>

      {mode === "client" && pendingLoadRequests.length ? (
        <div className="mb-6">
          <h3 className="mb-3">Pending Load Requests</h3>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {pendingLoadRequests.map((request) => (
              <div key={request._id} className="card-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                  <strong>{formatAmount(request.requestedAmount)}</strong>
                  <span className="badge badge-warning">Pending</span>
                </div>
                <div
                  className="text-sm text-muted"
                  style={{ textTransform: "capitalize" }}
                >
                  {request.paymentMethod} · {request.transactionId}
                </div>
                {request.screenshot?.url ? (
                  <a
                    href={request.screenshot.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: "var(--space-2)" }}
                  >
                    View Screenshot
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {mode === "freelancer" && pendingWithdrawalRequests.length ? (
        <div className="mb-6">
          <h3 className="mb-3">Pending Withdrawal Requests</h3>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {pendingWithdrawalRequests.map((request) => (
              <div key={request._id} className="card-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                  <strong>{formatAmount(request.requestedAmount)}</strong>
                  <span className="badge badge-warning">Pending release</span>
                </div>
                <div className="text-sm text-muted">
                  Submitted{" "}
                  {new Date(request.createdAt).toLocaleString("en-NP")}
                </div>
                {request.qrAttachment?.url ? (
                  <a
                    href={request.qrAttachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: "var(--space-2)" }}
                  >
                    View QR
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <h3 className="mb-3">Recent Transactions</h3>
        {recentTransactions.length ? (
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {recentTransactions.map((transaction) => (
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
                  <span
                    className={`badge ${
                      transaction.direction === "credit" ? "badge-success" : ""
                    }`}
                  >
                    {transaction.direction === "credit" ? "+" : "-"}
                    {formatAmount(transaction.amount)}
                  </span>
                </div>
                {transaction.status !== "completed" ? (
                  <div
                    className="text-sm text-muted"
                    style={{ marginTop: "var(--space-2)" }}
                  >
                    Status: {transaction.status}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted mb-0">No wallet transactions yet.</p>
        )}
      </div>

      {showPaymentModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 20, 30, 0.55)",
            display: "grid",
            placeItems: "center",
            padding: "var(--space-4)",
            zIndex: 60,
          }}
        >
          <div
            className="card"
            style={{ width: "min(540px, 100%)", padding: "var(--space-8)" }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="mb-2" style={{ textTransform: "capitalize" }}>
                  {selectedPaymentMethod} Payment
                </h3>
                <p className="text-muted mb-0">
                  Complete the transfer and submit the payment proof for admin
                  verification.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={resetPaymentRequest}
              >
                Close
              </button>
            </div>

            <div className="flex justify-center mb-4">
              <StaticQrCard />
            </div>
            <p
              className="text-center"
              style={{ marginBottom: "var(--space-4)" }}
            >
              Please send Rs {Number(amount || 0).toLocaleString()} on this QR
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="wallet-transaction-id">
                Transaction ID
              </label>
              <input
                id="wallet-transaction-id"
                className="form-input"
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                placeholder="Enter payment reference"
              />
            </div>

            <CloudinaryFileUploader
              folder="neplance/wallet-loads"
              buttonLabel="Upload Screenshot"
              onUploaded={setPaymentScreenshot}
            />
            {paymentScreenshot?.url ? (
              <a
                href={paymentScreenshot.url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ marginBottom: "var(--space-4)" }}
              >
                View Uploaded Screenshot
              </a>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={resetPaymentRequest}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isPending}
                onClick={handlePaymentRequest}
              >
                {isPending ? "Submitting..." : "Submit for Verification"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
