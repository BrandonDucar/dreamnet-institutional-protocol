# DreamNet Institutional Protocol v0.1

## Purpose

The protocol defines a minimum path by which an agent may earn authority,
perform bounded work, produce evidence, participate in a disputed knowledge
process, and accumulate portable capability-scoped reputation.

It is an institutional contract, not an agent runtime.

## Normative Terms

The words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY describe protocol
requirements.

## Object Ownership

| Object | Canonical owner | Institutional use |
| --- | --- | --- |
| Assignment, receipt, claim | DreamNet Public Core | Shared base envelopes |
| DreamLoop | DreamLoops | Durable operating policy |
| Capsule | DreamLoops/Public Core | Capability and resource boundary |
| Competency | ToolGym | Evidence that an agent passed training and examination |
| Claim and verification lineage | Claim Factory | Knowledge-production boundary |
| Portable artifact | Spore SDK | Cross-organism transfer |
| Append-only event | GitGrid | Durable event and provenance projection |
| Workflow execution | DreamNet Temporal | Restart-safe execution substrate |

## Protocol Stages

### 1. Competency

An active credential MUST:

- identify issuer, subject, capability, and validity window;
- reference at least four unique workout receipts;
- reference a passing field examination;
- show that the field examiner is not the subject agent;
- carry an integrity digest;
- remain revocable by its issuer.

A credential proves that the issuer attested to the listed evidence. It does
not prove the underlying claims are objectively true.

### 2. Assignment Authorization

An assignment MUST:

- match the subject and capability in an active credential;
- fall inside the credential validity window;
- contain explicit acceptance criteria;
- name its DreamLoop and Capsule;
- assign a risk tier and idempotency key;
- require identified human approval for high and critical risk.

Authorization MUST NOT execute the assignment.

### 3. Evidence and Receipts

Evidence MUST declare a provenance class. Successful receipts MUST reference at
least one integrity-verified evidence object and MUST identify the authorized
agent, assignment, trace, times, status, and outputs.

`PLANNED_STATE` and `MODEL_INFERENCE` evidence MUST NOT be promoted to
`DEMONSTRATED_STATE` without new execution evidence.

### 4. Claims and Counterclaims

A claim MUST:

- declare its provenance class;
- reference a successful receipt;
- identify its producing factory and worker/model/retrieval lineages;
- state its scope and evidence.

Any organism MAY issue a counterclaim. Counterclaims MUST target the digest of
the original claim and include evidence.

### 5. Independent Verification

A supporting verdict MUST be produced by a verifier with:

- a different factory;
- no overlapping worker identities;
- no overlapping model lineage;
- no overlapping retrieval lineage.

Every counterclaim MUST receive exactly one resolution. A support verdict MUST
NOT coexist with a sustained or unresolved counterclaim.

These rules establish operational independence, not philosophical certainty.
Adopters SHOULD add stronger domain-specific independence policies.

### 6. Federation

A Spore MUST transfer a claim and its verification between distinct organisms.
The receiving organism MUST verify the envelope integrity and SHOULD resolve
every referenced artifact independently before use.

Transport MAY use A2A, MCP resources, HTTP, a message bus, Git, object storage,
or an offline medium. Transport does not change the trust rules.

### 7. Reputation

Positive reputation MUST:

- be scoped to one capability;
- cite the claim, verification, and Spore digests;
- require a supporting verdict above policy confidence;
- require all counterclaims to be rejected;
- use a bounded policy delta;
- be replay-protected by the receiving institution.

Raw attestations, popularity, wallet balance, model confidence, and agent count
MUST NOT directly alter reputation.

## Strategic Claims Gate

External communications, including federal submissions, SHOULD be checked by
an independent Claims Gate:

```text
draft statement
      |
      v
provenance class
      |
      v
evidence and receipt lookup
      |
      v
readiness classification
      |
      v
independent wording review
      |
      v
human approval
      |
      v
send receipt
```

Recommended readiness classifications are:

- demonstrated;
- prototype;
- partner-dependent;
- planned;
- exploratory.

A Strategic Intelligence Operator such as Gemini Spark MAY prepare a draft,
but MUST NOT be the only system that validates its own claims.

## Explicit Non-Goals

Version 0.1 does not:

- provide key custody or digital signatures;
- assert W3C, EAS, ERC-8004, defense, financial, or legal compliance;
- execute tools, deploy code, transfer money, or transmit operational messages;
- create a universal truth oracle;
- create a global reputation score;
- replace human authority for high-impact decisions.
