"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createContractAction,
  updateContractAction,
} from "@/lib/actions/contracts";
import { CONTRACT_TYPE } from "@/shared/constants/statuses";

const createInitialMilestone = () => ({
  id: Date.now(),
  title: "",
  description: "",
  value: "",
  dueDate: "",
});

const mapContractMilestone = (milestone, index) => ({
  id: milestone?._id || `${Date.now()}-${index}`,
  title: milestone?.title || "",
  description: milestone?.description || "",
  value:
    milestone?.value === undefined || milestone?.value === null
      ? ""
      : String(milestone.value),
  dueDate: milestone?.dueDate
    ? new Date(milestone.dueDate).toISOString().slice(0, 10)
    : "",
});

const buildInitialState = (proposal, contract) => {
  const source = contract || {};
  const initialContractType = source.contractType || CONTRACT_TYPE.FULL_PROJECT;
  const initialMilestones =
    initialContractType === CONTRACT_TYPE.MILESTONE_BASED &&
    Array.isArray(source.milestones) &&
    source.milestones.length > 0
      ? source.milestones.map(mapContractMilestone)
      : [createInitialMilestone()];

  return {
    title: source.title || proposal.job?.title || "",
    description: source.description || proposal.job?.description || "",
    terms: source.terms || proposal.job?.terms || "",
    contractType: initialContractType,
    totalAmount:
      source.totalAmount !== undefined && source.totalAmount !== null
        ? String(source.totalAmount)
        : proposal.amount?.toString() || "",
    milestones: initialMilestones,
  };
};

export function ContractCreatePageClient({
  proposal,
  walletData,
  contract = null,
}) {
  const isEditing = Boolean(contract?._id);
  const action = useMemo(
    () =>
      isEditing
        ? updateContractAction.bind(null, contract._id)
        : createContractAction,
    [contract?._id, isEditing],
  );
  const [formState, setFormState] = useState(() =>
    buildInitialState(proposal, contract),
  );
  const [actionState, formAction, isPending] = useActionState(action, {
    message: "",
    errors: {},
  });

  const handleChange = (field, value) => {
    setFormState((previous) => ({ ...previous, [field]: value }));
  };

  const handleMilestoneChange = (index, field, value) => {
    setFormState((previous) => {
      const milestones = [...previous.milestones];
      milestones[index] = { ...milestones[index], [field]: value };
      return { ...previous, milestones };
    });
  };

  const addMilestone = () => {
    setFormState((previous) => ({
      ...previous,
      milestones: [...previous.milestones, createInitialMilestone()],
    }));
  };

  const removeMilestone = (index) => {
    setFormState((previous) => ({
      ...previous,
      milestones: previous.milestones.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  };

  const payload = {
    proposalId: proposal._id,
    title: formState.title,
    description: formState.description,
    terms: formState.terms,
    contractType: formState.contractType,
    totalAmount: formState.totalAmount,
    milestones:
      formState.contractType === CONTRACT_TYPE.MILESTONE_BASED
        ? formState.milestones
        : [],
  };
  const milestoneTotal = formState.milestones.reduce(
    (total, milestone) => total + (Number(milestone.value) || 0),
    0,
  );
  const wallet = walletData?.wallet || {
    balance: 0,
    heldBalance: 0,
    currency: "NPR",
  };
  const expectedFundingAmount =
    formState.contractType === CONTRACT_TYPE.MILESTONE_BASED
      ? milestoneTotal
      : Number(formState.totalAmount) || 0;
  const hasEnoughFunds = wallet.balance >= expectedFundingAmount;

  return (
    <form action={formAction} className="card">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      <div className="mb-6">
        <h1 className="mb-2">
          {isEditing ? "Edit Contract" : "Create Contract"}
        </h1>
        <p className="text-muted mb-0">
          {isEditing
            ? "Update the contract before the freelancer signs it. Revised terms stay tied to the same proposal."
            : "This accepts the proposal and creates the working agreement. Work starts only after the freelancer signs the contract."}
        </p>
      </div>

      <div className="card-sm mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <strong>Proposal offer</strong>
            <p className="text-muted mb-0">
              NPR {Number(proposal.amount || 0).toLocaleString()} in{" "}
              {proposal.deliveryDays || "N/A"} day(s)
            </p>
          </div>
          <div>
            <strong>Job budget</strong>
            <p className="text-muted mb-0">
              NPR {Number(proposal.job?.budget?.min || 0).toLocaleString()}
              {proposal.job?.budget?.max
                ? ` - NPR ${Number(proposal.job.budget.max).toLocaleString()}`
                : ""}
            </p>
          </div>
          <div>
            <strong>Wallet balance</strong>
            <p className="text-muted mb-0">
              {wallet.currency || "NPR"}{" "}
              {Number(wallet.balance || 0).toLocaleString()}
              {wallet.heldBalance
                ? ` available, ${Number(wallet.heldBalance).toLocaleString()} held`
                : ""}
            </p>
          </div>
        </div>
        {proposal.freelancer ? (
          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              flexWrap: "wrap",
              marginTop: "var(--space-3)",
            }}
          >
            <span className="badge">
              Freelancer:{" "}
              {proposal.freelancer.name || proposal.freelancer.email}
            </span>
            {proposal.freelancer.verificationStatus === "verified" ? (
              <span className="badge badge-success">Verified</span>
            ) : null}
            {Number(proposal.freelancer.reviewSummary?.totalReviews || 0) >
            0 ? (
              <span className="badge">
                {proposal.freelancer.reviewSummary.averageRating}/5 ·{" "}
                {proposal.freelancer.reviewSummary.totalReviews} reviews
              </span>
            ) : null}
            {proposal.attachments?.length > 0 ? (
              <span className="badge">
                {proposal.attachments.length} proposal attachment
                {proposal.attachments.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {actionState?.message ? (
        <div className="card-error mb-4">{actionState.message}</div>
      ) : null}
      {expectedFundingAmount > 0 ? (
        <div className={`card-sm mb-6 ${hasEnoughFunds ? "" : "card-error"}`}>
          <strong>
            Funding required to {isEditing ? "keep" : "create"} this contract
          </strong>
          <p className="text-muted mb-0">
            {wallet.currency || "NPR"}{" "}
            {Number(expectedFundingAmount || 0).toLocaleString()} will be
            reserved from the client wallet{" "}
            {isEditing
              ? "for this revised contract."
              : "when the contract is created."}
          </p>
          {!hasEnoughFunds ? (
            <p className="mb-0" style={{ marginTop: "var(--space-2)" }}>
              Your available balance is too low for this contract.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="form-group">
        <label className="form-label" htmlFor="contract-title">
          Contract Title
        </label>
        <input
          id="contract-title"
          className="form-input"
          value={formState.title}
          onChange={(event) => handleChange("title", event.target.value)}
          disabled={isPending}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="contract-description">
          Project Scope
        </label>
        <textarea
          id="contract-description"
          className="form-input"
          rows={5}
          value={formState.description}
          onChange={(event) => handleChange("description", event.target.value)}
          disabled={isPending}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="contract-terms">
          Terms
        </label>
        <textarea
          id="contract-terms"
          className="form-input"
          rows={4}
          value={formState.terms}
          onChange={(event) => handleChange("terms", event.target.value)}
          disabled={isPending}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="contract-type">
          Payment Structure
        </label>
        <select
          id="contract-type"
          className="form-select"
          value={formState.contractType}
          onChange={(event) => handleChange("contractType", event.target.value)}
          disabled={isPending}
        >
          <option value={CONTRACT_TYPE.FULL_PROJECT}>
            Full project payment
          </option>
          <option value={CONTRACT_TYPE.MILESTONE_BASED}>Milestone based</option>
        </select>
      </div>

      {formState.contractType === CONTRACT_TYPE.FULL_PROJECT ? (
        <div className="form-group">
          <label className="form-label" htmlFor="contract-total-amount">
            Total Amount (NPR)
          </label>
          <input
            id="contract-total-amount"
            className="form-input"
            type="number"
            min="0"
            value={formState.totalAmount}
            onChange={(event) =>
              handleChange("totalAmount", event.target.value)
            }
            disabled={isPending}
          />
        </div>
      ) : (
        <div className="form-group">
          <div className="flex items-center justify-between mb-4">
            <div className="form-label mb-0">Milestones</div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addMilestone}
              disabled={isPending}
            >
              Add Milestone
            </button>
          </div>

          <div className="grid gap-4">
            {formState.milestones.map((milestone, index) => (
              <div key={milestone.id} className="card-sm">
                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor={`contract-milestone-title-${index}`}
                  >
                    Title
                  </label>
                  <input
                    id={`contract-milestone-title-${index}`}
                    className="form-input"
                    value={milestone.title}
                    onChange={(event) =>
                      handleMilestoneChange(index, "title", event.target.value)
                    }
                    disabled={isPending}
                  />
                </div>
                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor={`contract-milestone-description-${index}`}
                  >
                    Description
                  </label>
                  <textarea
                    id={`contract-milestone-description-${index}`}
                    className="form-input"
                    rows={3}
                    value={milestone.description}
                    onChange={(event) =>
                      handleMilestoneChange(
                        index,
                        "description",
                        event.target.value,
                      )
                    }
                    disabled={isPending}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label
                      className="form-label"
                      htmlFor={`contract-milestone-value-${index}`}
                    >
                      Value (NPR)
                    </label>
                    <input
                      id={`contract-milestone-value-${index}`}
                      className="form-input"
                      type="number"
                      min="0"
                      value={milestone.value}
                      onChange={(event) =>
                        handleMilestoneChange(
                          index,
                          "value",
                          event.target.value,
                        )
                      }
                      disabled={isPending}
                    />
                  </div>
                  <div className="form-group">
                    <label
                      className="form-label"
                      htmlFor={`contract-milestone-due-date-${index}`}
                    >
                      Due Date
                    </label>
                    <input
                      id={`contract-milestone-due-date-${index}`}
                      className="form-input"
                      type="date"
                      value={milestone.dueDate}
                      onChange={(event) =>
                        handleMilestoneChange(
                          index,
                          "dueDate",
                          event.target.value,
                        )
                      }
                      disabled={isPending}
                    />
                  </div>
                </div>
                {formState.milestones.length > 1 ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeMilestone(index)}
                    disabled={isPending}
                  >
                    Remove Milestone
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <p className="text-muted mb-0 mt-3">
            Total contract value: NPR {milestoneTotal.toLocaleString()}
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isPending || !hasEnoughFunds}
        >
          {isPending
            ? isEditing
              ? "Saving Changes..."
              : "Creating Contract..."
            : isEditing
              ? "Save Contract Changes"
              : "Create Contract"}
        </button>
      </div>
    </form>
  );
}
