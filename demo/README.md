# DreamNet Institutional Journey Demo

Interactive, user-facing demonstration of the public DreamNet Institutional
Protocol.

The experience follows one synthetic agent through:

1. ToolGym competency;
2. bounded assignment authority;
3. evidence and execution receipts;
4. claim production;
5. adversarial counterclaim;
6. independent clean-room verification;
7. cross-organism Spore transfer; and
8. capability-scoped reputation.

The canonical fixture is copied from
`../artifacts/demo/institutional-journey.json`. The demo executes no payment,
deployment, network request, package install, wallet action, or external tool
call.

## Local Development

```bash
npm install --ignore-scripts
npm run dev
npm test
```

## Boundaries

- An integrity digest proves that bytes have not changed. It does not prove a
  claim is true.
- A credential establishes eligibility for a named capability. It is not a
  universal trust score.
- Reputation changes only after independent verification and only for the
  capability supported by the evidence.
- The downloadable proof bundle is deterministic synthetic data.
