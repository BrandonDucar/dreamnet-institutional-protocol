# Contributing

Contributions should improve interoperability, falsifiability, safety, or
conformance without turning the protocol into a framework-specific runtime.

## Requirements

1. Open an issue describing the contract or behavior being changed.
2. Keep protocol logic deterministic and free of model calls.
3. Add tests for success, rejection, tampering, and replay behavior.
4. State whether a field is normative, advisory, or implementation-specific.
5. Do not duplicate contracts already owned by DreamLoops, ToolGym, Claim
   Factory, Public Core, GitGrid, Temporal, or Spore.
6. Run `npm run verify`.

Changes to trust, identity, reputation, or human-approval semantics require an
explicit threat-model note.
