# Neplance Codebase Guide

This document is a working map of the current codebase. It is written to help future feature work move faster by making the existing responsibilities, domain rules, and data flows explicit.

Neplance is a full-stack freelancing marketplace with three main personas:

- `client`: posts jobs, reviews proposals, funds contracts, approves work
- `freelancer`: browses jobs, submits proposals, completes contract work
- `admin`: reviews verification submissions and dispute outcomes

The implemented product is more than a basic jobs board. The core workflow is:

1. Users authenticate and choose an active role.
2. Clients create jobs and publish them.
3. Freelancers submit proposals.
4. Clients convert one proposal into a funded contract.
5. Freelancers sign the contract and deliver work.
6. Funds move through an internal wallet ledger.
7. Reviews, notifications, chat, and disputes support the lifecycle.

## Current stack

### Frontend

- Next.js 16 App Router
- React 19
- Server Components by default
- Server Actions for mutations
- Zod for form validation
- CSS organized under `client/src/styles`

### Backend

- Express 4
- MongoDB with Mongoose
- JWT auth
- HTTP cookies for refresh token storage
- Service layer for contract, wallet, dispute, review, chat, and job rules

## Repository layout

### `client/`

- `src/app`: route entrypoints and route layouts
- `src/features`: feature-owned UI
- `src/lib/server`: server-side fetch helpers for pages/layouts
- `src/lib/actions`: server actions for mutations
- `src/lib/api`: low-level API request helpers
- `src/shared`: shared UI, constants, auth helpers, validation

### `server/`

- `server.js`: express bootstrap and route mounting
- `src/routes`: route definitions only
- `src/controllers`: HTTP handlers
- `src/services`: business logic and state transitions
- `src/models`: Mongoose schemas
- `src/middlewares`: auth and rate limiting
- `src/utils`: reusable backend helpers and errors

## Architecture at a glance

### Frontend request path

1. A page in `client/src/app` loads server data through `client/src/lib/server/*`.
2. Those helpers call `apiServerCall` or `apiServerRequest` in `client/src/lib/api/server.js`.
3. The access token is read from the `neplanceAccessToken` cookie and forwarded as a bearer token.
4. The backend route/controller/service handles the request.
5. Mutations usually come from `client/src/lib/actions/*`, then trigger `revalidatePath` and sometimes `redirect`.

### Auth shape

- Backend issues:
  - `refreshToken` cookie, `httpOnly`, used for refresh flow
  - `neplanceAccessToken` cookie, readable by frontend middleware and forwarded to backend
- Frontend also stores an `neplanceActiveRole` cookie to decide which dashboard variant to show.
- The same user can carry multiple roles because `User.role` is an array.

## Domain model

### User

Defined in `server/src/models/User.js`.

Key responsibilities:

- authentication identity
- marketplace persona via `role`
- freelancer profile fields:
  - `skills`
  - `hourlyRate`
  - `experienceLevel`
  - `jobTypePreference`
  - `availabilityStatus`
  - `languages`
  - `portfolio`
- verification workflow:
  - `verificationDocuments`
  - `verificationStatus`
  - `verificationReviewedAt`
  - `verificationReviewedBy`
  - `verificationRejectionReason`
- saved jobs for freelancers

Important note:

- `role` is an array of strings, not a single enum value.

### Job

Defined in `server/src/models/Job.js`.

Represents a client-posted opportunity.

Key fields:

- content: `title`, `description`, `category`, `subcategory`
- work shape: `jobType`, `requiredSkills`, `experienceLevel`
- money and time: `budget`, `deadline`, `isUrgent`
- visibility and discovery: `isPublic`, `isFeatured`, `viewCount`
- workflow: `status`
- ownership: `creatorAddress`
- downstream links:
  - `selectedProposal`
  - `activeContract`
  - `hiredFreelancer`

`parties` exists to track creator and contract participants. It is also used by access checks.

### Proposal

Defined in `server/src/models/Proposal.js`.

Represents a freelancer bid on a job.

Key fields:

- `freelancer`
- `job`
- `amount`
- `coverLetter`
- `deliveryDays`
- `revisionsIncluded`
- `attachments`
- `status`

Business rule:

- A freelancer can only have one active non-withdrawn, non-rejected proposal per job.

### Contract

Defined in `server/src/models/Contract.js`.

Represents the funded agreement created from a proposal.

Key fields:

- links: `job`, `proposal`, `client`, `freelancer`
- commercial terms: `title`, `description`, `terms`, `currency`
- payment tracking:
  - `totalAmount`
  - `fundedAmount`
  - `releasedAmount`
  - `refundedAmount`
  - `fundingStatus`
- execution mode: `contractType`
  - `full_project`
  - `milestone_based`
- lifecycle state: `status`
- signatures:
  - `clientSignature`
  - `freelancerSignature`
- work delivery:
  - `milestones`
  - `deliverySubmission`
- cancellation:
  - `cancellation`
- optional blockchain metadata:
  - `blockchain.network`
  - `blockchain.contractAddress`
  - `blockchain.transactionHash`
  - `blockchain.syncStatus`

Important note:

- Blockchain fields exist in the schema, but current business logic uses an internal wallet ledger rather than chain integration.

### Wallet

Defined in `server/src/models/Wallet.js`.

Each user gets one wallet.

Tracks:

- available `balance`
- `heldBalance` reserved for funded contracts
- rollup totals:
  - `totalLoaded`
  - `totalSpent`
  - `totalEarned`
- transaction history

This is the escrow-like financial layer of the app right now.

### Conversation and Message

Defined in `server/src/models/Conversation.js` and `server/src/models/Message.js`.

Chat is proposal-linked:

- one conversation per proposal
- client must initiate it
- unread counts are tracked separately for client and freelancer

### Notification

Defined in `server/src/models/Notification.js`.

Used for:

- proposal events
- contract events
- dispute events
- chat messages
- review events

### Review

Defined in `server/src/models/Review.js`.

Reviews are contract-scoped and only allowed after completion.

### Dispute

Defined in `server/src/models/Dispute.js`.

Created against a contract and resolved by an admin.

Resolution actions:

- `refund_client`
- `release_freelancer`
- `reject`

## Status model

Shared constants live in:

- `server/src/constants/statuses.js`
- `client/src/shared/constants/statuses.js`

### Job statuses

- `DRAFT`
- `OPEN`
- `CONTRACT_PENDING`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`

### Proposal statuses

- `pending`
- `accepted`
- `rejected`
- `withdrawn`

### Contract statuses

- `DRAFT`
- `PENDING_FREELANCER_SIGNATURE`
- `ACTIVE`
- `COMPLETED`
- `CANCELLED`

### Contract funding statuses

- `UNFUNDED`
- `FUNDED`
- `PARTIALLY_RELEASED`
- `RELEASED`
- `PARTIALLY_REFUNDED`
- `REFUNDED`

### Milestone statuses

- `ACTIVE`
- `SUBMITTED`
- `COMPLETED`
- `CANCELLED`

### Dispute statuses

- `OPEN`
- `UNDER_REVIEW`
- `RESOLVED`
- `REJECTED`

## Core backend flows

### 1. Authentication

Files:

- `server/src/controllers/authController.js`
- `server/src/middlewares/authMiddleware.js`
- `client/src/lib/actions/auth.js`
- `client/src/lib/server/auth.js`
- `client/middleware.js`

How it works:

- signup and login hit `/api/auth/register` and `/api/auth/login`
- backend returns an access token in JSON and sets cookies
- frontend server action mirrors `Set-Cookie` headers into Next cookies
- protected pages are gated first by Next middleware and then by backend auth middleware
- `/api/auth/refresh` can mint a new access token using the refresh cookie

Important note:

- the backend marks the access token cookie as `httpOnly: false`, which is intentional in the current implementation because the frontend middleware checks for its presence and server helpers forward it manually

### 2. Job posting and publishing

Files:

- `server/src/controllers/jobController.js`
- `server/src/services/jobService.js`
- `server/src/services/statusTransitions.js`
- `client/src/lib/actions/jobs.js`

Behavior:

- clients create jobs through `/api/jobs`
- draft creation is allowed with lighter validation in the frontend action
- publishing is separate via `/api/jobs/:id/publish`
- published jobs must have a category and a minimum budget
- freelancers can browse only `OPEN` and `isPublic` jobs

### 3. Proposal submission

Files:

- `server/src/controllers/proposalController.js`
- `server/src/services/proposalService.js`
- `client/src/lib/actions/proposals.js`

Behavior:

- only freelancers can submit proposals
- a freelancer cannot propose on their own job
- proposals are only allowed for `OPEN` jobs
- client gets a notification when a proposal is submitted
- freelancers can withdraw only `pending` proposals

### 4. Contract creation and funding

Files:

- `server/src/controllers/contractController.js`
- `server/src/services/contractService.js`
- `server/src/services/walletService.js`
- `client/src/lib/actions/contracts.js`

Behavior:

- client converts one proposal into a contract with `/api/contracts/proposal/:proposalId`
- contract creation reserves wallet funds immediately
- the created contract starts as `PENDING_FREELANCER_SIGNATURE`
- the selected proposal becomes `accepted`
- competing pending proposals for the same job are auto-rejected
- job becomes `CONTRACT_PENDING`, stores `selectedProposal`, `activeContract`, and `hiredFreelancer`

Failure behavior:

- if contract creation fails after funds are reserved, the service rolls the held amount back to the client wallet

### 5. Contract execution

There are two execution modes.

#### Full project

- freelancer submits final delivery
- client can request changes
- client completes the contract
- remaining held funds are released to the freelancer

#### Milestone based

- freelancer submits milestone evidence
- client approves or requests changes
- approved milestones release only that milestone's funds
- when all milestones are completed, the contract is completed

### 6. Cancellation

Files:

- `server/src/services/contractService.js`

Behavior:

- only active contracts can be cancelled
- either participant can request cancellation
- the non-initiator must respond
- accepting cancellation refunds unreleased held funds to the client
- the contract becomes `CANCELLED`
- related job is marked `CANCELLED`

### 7. Reviews

Files:

- `server/src/services/reviewService.js`
- `server/src/controllers/contractController.js`

Behavior:

- only contract participants can leave a review
- only after contract completion
- one review per participant per contract
- ratings are aggregated into summary data shown on freelancer and client surfaces

### 8. Disputes and admin resolution

Files:

- `server/src/services/disputeService.js`
- `server/src/controllers/disputeController.js`
- `client/src/lib/actions/admin.js`

Behavior:

- either participant can open a dispute on eligible contracts
- only one open dispute per contract is allowed
- admin can:
  - refund remaining held funds to the client
  - release remaining held funds to the freelancer
  - reject the dispute

### 9. Chat

Files:

- `server/src/services/chatService.js`
- `server/src/controllers/chatController.js`
- `client/src/lib/actions/chat.js`

Behavior:

- conversations are tied to proposals
- only the client who received the proposal can start the conversation
- both participants can send messages after that
- unread counts are stored on the conversation record

### 10. Verification

Files:

- `server/src/controllers/userController.js`
- `client/src/lib/actions/profile.js`
- `client/src/lib/actions/admin.js`

Behavior:

- users upload verification document metadata through profile editing
- submitting documents flips status to `pending`
- admin reviews via `/api/admin/verification/:id`
- decisions are `approve` or `reject`

## Backend route map

Mounted in `server/server.js`.

### Public-ish utility

- `GET /api`
- `GET /api/health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/logout`
- `GET /api/auth/refresh`
- `GET /api/auth/me`

### Jobs

- `GET /api/jobs/categories`
- `GET /api/jobs/myJobs`
- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/jobs/:id`
- `PATCH /api/jobs/:id`
- `DELETE /api/jobs/:id`
- `PATCH /api/jobs/:id/publish`

### Proposals

- `POST /api/proposals`
- `GET /api/proposals/myProposals`
- `GET /api/proposals/job/:jobId`
- `GET /api/proposals/:id`
- `PATCH /api/proposals/:id/reject`
- `PATCH /api/proposals/:id/withdraw`

### Contracts

- `GET /api/contracts`
- `GET /api/contracts/proposal/:proposalId`
- `POST /api/contracts/proposal/:proposalId`
- `GET /api/contracts/:id`
- `PATCH /api/contracts/:id/sign`
- `PATCH /api/contracts/:id/milestones/:index/submit`
- `PATCH /api/contracts/:id/milestones/:index/approve`
- `PATCH /api/contracts/:id/milestones/:index/request-changes`
- `PATCH /api/contracts/:id/submit`
- `PATCH /api/contracts/:id/submit/request-changes`
- `PATCH /api/contracts/:id/complete`
- `PATCH /api/contracts/:id/cancel`
- `PATCH /api/contracts/:id/cancel/respond`
- `POST /api/contracts/:id/reviews`
- `POST /api/contracts/:id/disputes`

### Users and profiles

- `GET /api/users/freelancers`
- `GET /api/users/freelancers/:id`
- `GET /api/users`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `DELETE /api/users/me`
- `GET /api/users/me/check-delete-eligibility`
- `GET /api/users/me/saved-jobs`
- `PATCH /api/users/me/saved-jobs/:jobId`

### Chat

- `GET /api/chat`
- `GET /api/chat/summary`
- `GET /api/chat/proposal/:proposalId`
- `POST /api/chat/proposal/:proposalId`
- `GET /api/chat/:id`
- `GET /api/chat/:id/messages`
- `POST /api/chat/:id/messages`
- `PATCH /api/chat/:id/read`

### Notifications

- `GET /api/notifications`
- `GET /api/notifications/summary`
- `PATCH /api/notifications/read-all`
- `PATCH /api/notifications/:id/read`

### Wallet

- `GET /api/wallet`
- `POST /api/wallet/load`

### Uploads

- `POST /api/uploads/sign`

### Admin

- `GET /api/admin/jobs`
- `GET /api/admin/verification`
- `PATCH /api/admin/verification/:id`
- `GET /api/admin/disputes`
- `PATCH /api/admin/disputes/:id`

## Frontend route map

The app uses thin route files in `client/src/app`.

### Marketing and auth

- `/`: landing page
- `/login`
- `/signup`

### Marketplace

- `/jobs`: freelancer job browsing
- `/jobs/[id]`: job details and proposal entry point
- `/jobs/[id]/edit`: client job editing
- `/talent`: freelancer directory
- `/freelancers/[id]`: freelancer profile

### User space

- `/dashboard`: redirects by active role
- `/dashboard/client/*`: client dashboard
- `/dashboard/freelancer/*`: freelancer dashboard
- `/profile`
- `/profile/edit`
- `/proposals/[id]`
- `/contracts/[id]`
- `/messages`
- `/messages/[id]`
- `/notifications`

### Admin space

- `/admin`
- `/admin/jobs`
- `/admin/users`
- `/admin/pending-verification`
- `/admin/disputes`
- `/admin/problems`

## Dashboard breakdown

### Client dashboard

Implemented routes:

- `/dashboard/client/my-contracts`
- `/dashboard/client/my-jobs`
- `/dashboard/client/post-job`
- `/dashboard/client/proposals`
- `/dashboard/client/wallet`

Purpose:

- manage posted jobs
- review incoming proposals
- create contracts
- inspect active/completed contracts
- load wallet funds

### Freelancer dashboard

Implemented routes:

- `/dashboard/freelancer/my-contracts`
- `/dashboard/freelancer/ongoing-jobs`
- `/dashboard/freelancer/active-proposals`
- `/dashboard/freelancer/earnings`

Purpose:

- track submitted proposals
- inspect active and completed contracts
- see wallet earnings summary

## Server-side data boundaries

These files are the main data-loading layer for frontend pages:

- `client/src/lib/server/auth.js`
- `client/src/lib/server/jobs.js`
- `client/src/lib/server/proposals.js`
- `client/src/lib/server/contracts.js`
- `client/src/lib/server/chat.js`
- `client/src/lib/server/notifications.js`
- `client/src/lib/server/users.js`
- `client/src/lib/server/wallet.js`
- `client/src/lib/server/admin.js`
- `client/src/lib/server/dashboard.js`

These files are the main mutation boundary:

- `client/src/lib/actions/auth.js`
- `client/src/lib/actions/jobs.js`
- `client/src/lib/actions/proposals.js`
- `client/src/lib/actions/contracts.js`
- `client/src/lib/actions/profile.js`
- `client/src/lib/actions/chat.js`
- `client/src/lib/actions/wallet.js`
- `client/src/lib/actions/admin.js`

When adding a feature, the preferred pattern is:

1. add or update backend model, service, controller, route
2. add a `lib/server/*` helper for reads
3. add a `lib/actions/*` server action for writes
4. keep `app/*` route files thin
5. place most view logic in `features/*`

## Validation and access rules

### Frontend validation

Shared schemas live in `client/src/shared/validation.js`.

Current schemas cover:

- login
- signup
- profile update
- proposal create
- job create/update
- contract create
- review create

### Backend access control

Files:

- `server/src/middlewares/authMiddleware.js`
- `server/src/utils/jobAccess.js`
- `server/src/utils/userFields.js`

Important behaviors:

- backend is the final authority even if frontend route guards exist
- `restrictTo` works against role arrays
- profile field updates are filtered by role
- non-public jobs are only visible to the creator or listed parties

## Notifications currently emitted

The backend creates notifications for:

- proposal submitted
- proposal rejected
- contract created
- contract signed
- milestone submitted
- milestone approved
- milestone changes requested
- final delivery submitted
- final delivery changes requested
- contract completed
- contract cancellation requested
- contract cancellation accepted or rejected
- contract review submitted
- dispute created
- dispute resolved or closed
- chat message sent

## Admin capabilities vs placeholders

Implemented:

- verification review queue
- dispute review queue
- admin job list
- admin user list

Placeholder or partial:

- `/admin/problems` is a placeholder page
- `/admin/page.jsx` still labels some cards as `Soon` even though dispute review exists
- upload signing exists, but this guide did not trace a full upload provider implementation from backend to storage

## Important implementation notes

### 1. This codebase is role-aware, not account-type isolated

A single user may be both client and freelancer. The frontend active role cookie determines dashboard behavior, but authorization still checks the full role array on the backend.

### 2. The wallet is a ledger, not a payment gateway

`loadWalletFunds` is currently a dummy balance load. It is enough for development and feature work around escrow flows, but not a real payment integration.

### 3. Chat starts only after client intent

Freelancers do not automatically get message threads when they submit a proposal. The client must create the conversation from the proposal detail flow.

### 4. Contracts are the real source of execution truth

Jobs and proposals are discovery and matching entities. Once a contract exists, delivery, payment release, reviews, disputes, and cancellation all hang off the contract.

### 5. Some older docs are stale

The current frontend uses App Router, `lib/server`, and server actions. Older references to client-side auth contexts or `services/api.js` are not the current architecture.

## Recommended trace paths for future work

### If changing auth

- `client/src/lib/actions/auth.js`
- `client/src/lib/server/auth.js`
- `client/middleware.js`
- `server/src/controllers/authController.js`
- `server/src/middlewares/authMiddleware.js`

### If changing jobs

- `client/src/lib/actions/jobs.js`
- `client/src/lib/server/jobs.js`
- `client/src/features/jobs/*`
- `server/src/controllers/jobController.js`
- `server/src/services/jobService.js`

### If changing proposals

- `client/src/lib/actions/proposals.js`
- `client/src/lib/server/proposals.js`
- `client/src/features/proposals/*`
- `server/src/controllers/proposalController.js`
- `server/src/services/proposalService.js`

### If changing contracts, escrow, reviews, or disputes

- `client/src/lib/actions/contracts.js`
- `client/src/lib/server/contracts.js`
- `client/src/features/contracts/*`
- `server/src/controllers/contractController.js`
- `server/src/services/contractService.js`
- `server/src/services/walletService.js`
- `server/src/services/reviewService.js`
- `server/src/services/disputeService.js`

### If changing chat or notifications

- `client/src/lib/actions/chat.js`
- `client/src/lib/server/chat.js`
- `client/src/lib/server/notifications.js`
- `client/src/features/chat/*`
- `server/src/controllers/chatController.js`
- `server/src/services/chatService.js`
- `server/src/services/notificationService.js`

## Environment variables

### Server

- `NEPLANCE_MONGODB_URI`
- `SERVER_PORT`
- `FRONTEND_BASE_URL`
- `AUTH_JWT_SECRET`
- `AUTH_ACCESS_TOKEN_EXPIRY`
- `AUTH_REFRESH_TOKEN_EXPIRY`

### Client

- `NEXT_PUBLIC_API_BASE_URL`

## Summary mental model

If you need one compact way to think about the system, use this:

- `jobs` are public opportunities
- `proposals` are bids from freelancers
- `contracts` are funded execution agreements
- `wallets` hold and release money around contracts
- `chat` is proposal-scoped communication
- `reviews` and `verification` build trust
- `disputes` are admin-mediated exceptions
- `dashboard` and `activeRole` determine which persona view the same user is operating in

That is the main context future Codex feature work should build on.
