# Standards Compatibility

DreamNet should compose standards rather than rename them. This document maps
their responsibilities without claiming certification or full compliance.

| Standard or system | Responsibility | DreamNet relationship |
| --- | --- | --- |
| MCP | Tool and context interoperability | Capsules and policy decide whether an exposed tool may be used. |
| A2A | Agent discovery, tasks, messages, and artifacts | Spore envelopes can travel as A2A artifacts. |
| Temporal | Durable workflow execution | Temporal can persist DreamLoop execution and recovery. |
| W3C VC 2.0 | Credential data model | Competency credentials can be expressed as verifiable credentials. |
| W3C PROV-O | Entity/activity/agent provenance | Evidence, receipts, claims, and workers map naturally to PROV objects. |
| EAS | General-purpose attestations | Selected digests can be anchored as attestations. |
| ERC-8004 | Trustless agent identity/reputation/validation registries | DreamNet claims and scoped reputation can be optional registry inputs. |
| Spore | Portable DreamNet evidence package | Carries independently verifiable artifacts across organisms. |

## Composition Model

```text
MCP tools and resources
        |
        v
Capsule authorization
        |
        v
DreamLoop semantics
        |
        v
Temporal durability
        |
        v
PROV-aligned evidence and receipts
        |
        v
VC-compatible competency
        |
        v
A2A-carried Spore
        |
        v
optional EAS / ERC-8004 anchor
```

## Important Boundaries

- W3C VC explicitly separates cryptographic verifiability from the truth of a
  claim. DreamNet therefore requires evidence and independent verification
  before reputation changes.
- MCP and A2A provide interoperability, not authorization.
- Temporal provides durable execution, not institutional policy.
- EAS and ERC-8004 can publish attestations and registry state, but do not
  replace evidence quality or Sybil resistance.
- The current `dreamnet.sorted-json.v1` canonicalizer is a local deterministic
  format. It is not RFC 8785 JSON Canonicalization Scheme compatibility.

## Future Compatibility Work

1. Define an RFC 8785 canonicalization profile.
2. Add Data Integrity or JOSE/COSE signatures with revocation.
3. Publish JSON-LD contexts for VC and PROV-O projections.
4. Define A2A artifact media types for Spore.
5. Add optional EAS and ERC-8004 adapters.
6. Publish test vectors and interop fixtures.

## Primary References

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Google Agent2Agent announcement](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)
- [Temporal](https://temporal.io/)
- [W3C Verifiable Credentials Data Model 2.0](https://www.w3.org/TR/vc-data-model/)
- [W3C PROV-O](https://www.w3.org/TR/prov-o/)
- [Ethereum Attestation Service](https://docs.attest.org/docs/welcome)
- [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004)
