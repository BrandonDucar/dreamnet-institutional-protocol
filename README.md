# DreamNet Institutional Protocol

Open contracts for persistent, accountable agent institutions and portable
verified knowledge.

This repository is a public composition layer for the DreamNet ecosystem. It
does not replace an agent runtime, model router, workflow engine, database, or
blockchain. It defines how those systems can produce evidence that another
organization can inspect without inheriting the producer's private memory,
tools, or infrastructure.

[Launch the five-minute guided demo](https://dreamnet-institutional-journey-demo.dreamnet-intel.workers.dev)
to watch one synthetic agent move from tested competency through bounded work,
receipts, disputed claims, independent verification, federation, and
capability-scoped reputation.

## The Institutional Journey

```text
ToolGym workouts + independent field exam
                         |
                         v
                competency credential
                         |
                         v
principal -> bounded assignment -> DreamLoop + Capsule
                                  |
                                  v
                         evidence + receipt
                                  |
                                  v
                              claim
                                  |
                    counterclaim + clean-room review
                                  |
                                  v
                    independent verification
                                  |
                                  v
                     cross-organism Spore
                                  |
                                  v
                  capability-scoped reputation
```

Reputation is not assigned because an issuer is important. It may change only
after evidence-backed work survives independent verification. One failed
capability does not contaminate every other capability, and one successful task
does not create a universal trust score.

## What Runs Today

The reference implementation includes:

- deterministic sorted-JSON integrity digests;
- ToolGym-style competency issuance with four distinct workout receipts and an
  independently attested field exam;
- capability, identity, validity-window, risk, approval, and idempotency gates;
- evidence classes that prevent plans and model inferences from becoming facts;
- receipts tied to authorized assignments;
- claims, counterclaims, and independent clean-room verification;
- portable Spore envelopes between distinct organisms;
- capability-scoped reputation changes gated by verification;
- adversarial tests and a deterministic end-to-end demonstration.

Run the protocol:

```bash
npm ci --ignore-scripts
npm run verify
npm run demo:write
```

The generated fixture is written to
`artifacts/demo/institutional-journey.json`.

The demonstration is synthetic. It executes no payment, deployment, network
request, package install, wallet action, or external tool call.

## Provenance Classes

Every evidence object and claim MUST identify its epistemic class:

| Class | Meaning |
| --- | --- |
| `DIRECT_SOURCE` | An official document, email, contract, commit, or primary source states it directly. |
| `SYSTEM_OBSERVATION` | A system observed a condition and recorded evidence. |
| `HUMAN_ASSERTION` | A person stated it; independent verification is not implied. |
| `MODEL_INFERENCE` | A model inferred it from other material. |
| `PLANNED_STATE` | It is intended but is not complete. |
| `DEMONSTRATED_STATE` | It was executed and is supported by evidence and receipts. |

An integrity digest proves that bytes have not changed. It does not prove a
statement is true. A credential proves that an issuer made an assertion. It
does not make that assertion correct.

## Repository Boundaries

This repository composes the public contracts already owned by:

- [DreamNet Public Core](https://github.com/BrandonDucar/Dreamnet)
- [DreamLoops](https://github.com/BrandonDucar/dreamloops)
- [ToolGym](https://github.com/BrandonDucar/toolgym)
- [DreamNet Claim Factory](https://github.com/BrandonDucar/dreamnet-claim-factory)
- [DreamNet Spore SDK](https://github.com/BrandonDucar/dreamnet-spore-sdk)
- [DreamNet GitGrid](https://github.com/BrandonDucar/dreamnet-git-grid)
- [DreamNet Temporal](https://github.com/BrandonDucar/dreamnet-temporal)

The protocol owns the institutional journey and its trust gates. The source
repositories remain canonical for their individual object models.

## Read More

- [Institutional protocol](docs/INSTITUTIONAL-PROTOCOL.md)
- [Standards compatibility](docs/STANDARDS-COMPATIBILITY.md)
- [Landscape analysis](docs/LANDSCAPE.md)
- [Civilization-readiness benchmark](docs/CIVILIZATION-READINESS-BENCHMARK.md)
- [Source provenance](docs/PROVENANCE.md)
- [Security policy](SECURITY.md)

## Status

Version `0.1.0` is a reference contract and executable demonstration. It is not
a production identity provider, signing service, defense accreditation,
financial system, or source of objective truth. Production adopters must add
key custody, cryptographic signatures, authorization, privacy controls,
revocation, operational monitoring, and domain-specific validation.

Licensed under Apache-2.0.
