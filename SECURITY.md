# Security Policy

## Reporting

Report vulnerabilities privately to the repository owner. Do not publish
credentials, personal data, private infrastructure details, or weaponized
exploits in an issue.

## Non-Negotiable Boundaries

- A valid digest proves integrity, not truth.
- A credential proves an issuer made a claim, not that the claim is correct.
- Raw attestations cannot directly change reputation.
- Reputation is capability-scoped and evidence-derived; no global social score
  is defined.
- Producers cannot verify their own claims.
- Verifier factories must have distinct worker, model, and retrieval lineages.
- Unresolved or sustained counterclaims block positive reputation updates.
- High- and critical-risk assignments require explicit human approval.
- No protocol function executes payments, deploys code, or invokes tools.
- No secrets, private prompts, direct contact data, or customer records belong
  in portable artifacts.

## Dependency Intake

This package has no runtime dependencies. Install development dependencies with
lifecycle scripts disabled:

```bash
npm ci --ignore-scripts
```

New dependencies must pass DreamNet Cerberus and normal maintainer review.

## Cryptography

The reference implementation provides deterministic SHA-256 content digests.
It does not claim to provide signatures, key custody, decentralized identity,
zero-knowledge proofs, or an onchain trust anchor. Production implementations
must add an appropriate signature suite and key-management boundary.
