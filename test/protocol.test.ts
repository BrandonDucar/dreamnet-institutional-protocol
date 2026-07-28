import assert from "node:assert/strict";
import test from "node:test";

import {
  applyReputation,
  authorizeAssignment,
  canonicalJson,
  createCounterclaim,
  createIntegrity,
  sha256,
  verifyClaim,
  verifySpore,
} from "../src/index.js";
import { buildInstitutionalJourney } from "../src/demo.js";
import type { CompetencyCredential, FactoryLineage } from "../src/types.js";

const producer: FactoryLineage = {
  factoryId: "factory:producer",
  organismId: "organism:alpha",
  workerIds: ["worker:producer"],
  modelLineages: ["model:producer"],
  retrievalLineages: ["retrieval:producer"],
};

function activeCredential(
  capability = "repository-supply-chain-review",
): CompetencyCredential {
  const content: Omit<CompetencyCredential, "integrity"> = {
    schemaVersion: "dreamnet.competency.v1",
    credentialId: "credential:test",
    issuerId: "issuer:toolgym",
    subjectAgentId: "agent:test",
    capability,
    level: "proctored-field-mastery",
    status: "active",
    validFrom: "2026-01-01T00:00:00.000Z",
    validUntil: "2027-01-01T00:00:00.000Z",
    evidence: {
      workoutReceiptDigests: [1, 2, 3, 4].map((value) => sha256({ value })),
      fieldExam: {
        receiptDigest: sha256({ exam: true }),
        reviewerId: "reviewer:human",
        reviewerOrganization: "ToolGym",
        independentlyAttested: true,
        passed: true,
      },
    },
    standards: ["toolgym", "w3c-vc"],
  };
  return { ...content, integrity: createIntegrity(content) };
}

test("canonical hashing is deterministic across object key order", () => {
  const left = { beta: 2, alpha: { delta: 4, charlie: 3 } };
  const right = { alpha: { charlie: 3, delta: 4 }, beta: 2 };

  assert.equal(canonicalJson(left), canonicalJson(right));
  assert.equal(sha256(left), sha256(right));
});

test("credential path rejects fewer than four workouts and self attestation", async () => {
  const { issueCompetency } = await import("../src/index.js");

  assert.throws(
    () =>
      issueCompetency({
        issuerId: "issuer:toolgym",
        subjectAgentId: "agent:test",
        capability: "audit",
        validFrom: "2026-01-01T00:00:00.000Z",
        validUntil: "2027-01-01T00:00:00.000Z",
        workoutReceiptDigests: [1, 2, 3].map((value) => sha256({ value })),
        fieldExam: {
          receiptDigest: sha256({ exam: true }),
          reviewerId: "reviewer:human",
          reviewerOrganization: "ToolGym",
          independentlyAttested: true,
          passed: true,
        },
      }),
    /minimum_workout_receipts_not_met/,
  );

  assert.throws(
    () =>
      issueCompetency({
        issuerId: "issuer:toolgym",
        subjectAgentId: "agent:test",
        capability: "audit",
        validFrom: "2026-01-01T00:00:00.000Z",
        validUntil: "2027-01-01T00:00:00.000Z",
        workoutReceiptDigests: [1, 2, 3, 4].map((value) => sha256({ value })),
        fieldExam: {
          receiptDigest: sha256({ exam: true }),
          reviewerId: "agent:test",
          reviewerOrganization: "ToolGym",
          independentlyAttested: true,
          passed: true,
        },
      }),
    /self_attested_field_exam_prohibited/,
  );
});

test("assignment authorization enforces capability and high-risk approval", () => {
  const credential = activeCredential();
  const base = {
    assignmentId: "assignment:test",
    principalId: "principal:test",
    agentId: "agent:test",
    goal: "Review the repository.",
    acceptanceCriteria: ["Produce evidence."],
    capabilityRequired: "repository-supply-chain-review",
    dreamLoopId: "dreamloop:test",
    capsuleId: "capsule:test",
    riskTier: "medium" as const,
    humanApproval: { required: false, approved: false },
    idempotencyKey: "test:v1",
    authorizedAt: "2026-07-28T00:00:00.000Z",
    credential,
  };

  assert.throws(
    () =>
      authorizeAssignment({
        ...base,
        capabilityRequired: "production-deployment",
      }),
    /required_capability_not_proven/,
  );
  assert.throws(
    () =>
      authorizeAssignment({
        ...base,
        riskTier: "high",
        humanApproval: { required: true, approved: false },
      }),
    /human_approval_required/,
  );
});

test("verification requires independent factory, workers, model, and retrieval", () => {
  const journey = buildInstitutionalJourney();
  const verifyWith = (candidate: FactoryLineage) =>
    verifyClaim({
      claim: journey.claim,
      counterclaims: [],
      verifier: candidate,
      verdict: "supports",
      confidence: 0.9,
      findings: ["Would otherwise support."],
      evidence: [journey.claim.evidence[0]!],
      counterclaimResolutions: [],
      verifiedAt: "2026-07-28T14:00:00.000Z",
    });
  const independent: FactoryLineage = {
    factoryId: "factory:independent",
    organismId: "organism:independent",
    workerIds: ["worker:independent"],
    modelLineages: ["model:independent"],
    retrievalLineages: ["retrieval:independent"],
  };

  assert.throws(
    () =>
      verifyWith({
        ...independent,
        factoryId: journey.claim.producer.factoryId,
      }),
    /self_verification_prohibited/,
  );
  assert.throws(
    () =>
      verifyWith({
        ...independent,
        workerIds: [journey.claim.producer.workerIds[0]!],
      }),
    /verifier_worker_lineage_overlap/,
  );
  assert.throws(
    () =>
      verifyWith({
        ...independent,
        modelLineages: [journey.claim.producer.modelLineages[0]!],
      }),
    /verifier_model_lineage_overlap/,
  );
  assert.throws(
    () =>
      verifyWith({
        ...independent,
        retrievalLineages: [journey.claim.producer.retrievalLineages[0]!],
      }),
    /verifier_retrieval_lineage_overlap/,
  );
});

test("support verdict cannot leave a counterclaim unresolved", () => {
  const journey = buildInstitutionalJourney();
  const independentCounterclaim = createCounterclaim({
    targetClaim: journey.claim,
    statement: "The evidence might be incomplete.",
    producer,
    evidence: [journey.claim.evidence[0]!],
    createdAt: "2026-07-28T14:00:00.000Z",
  });

  assert.throws(
    () =>
      verifyClaim({
        claim: journey.claim,
        counterclaims: [independentCounterclaim],
        verifier: {
          factoryId: "factory:independent",
          organismId: "organism:independent",
          workerIds: ["worker:independent"],
          modelLineages: ["model:independent"],
          retrievalLineages: ["retrieval:independent"],
        },
        verdict: "supports",
        confidence: 0.9,
        findings: ["Evidence reviewed."],
        evidence: [journey.claim.evidence[0]!],
        counterclaimResolutions: [
          {
            counterclaimId: independentCounterclaim.counterclaimId,
            status: "unresolved",
            reason: "More evidence required.",
          },
        ],
        verifiedAt: "2026-07-28T14:05:00.000Z",
      }),
    /support_verdict_requires_resolved_counterclaims/,
  );
});

test("positive reputation rejects a challenged decision", () => {
  const journey = buildInstitutionalJourney();
  const challenged = {
    ...journey.verification,
    verdict: "challenges" as const,
  };
  const challengedContent = {
    schemaVersion: challenged.schemaVersion,
    verificationId: challenged.verificationId,
    targetClaimDigest: challenged.targetClaimDigest,
    verifier: challenged.verifier,
    verdict: challenged.verdict,
    confidence: challenged.confidence,
    findings: challenged.findings,
    evidence: challenged.evidence,
    counterclaimResolutions: challenged.counterclaimResolutions,
    verifiedAt: challenged.verifiedAt,
  };
  const integrityCorrected = {
    ...challenged,
    integrity: createIntegrity(challengedContent),
  };

  assert.throws(
    () =>
      applyReputation({
        subjectAgentId: journey.credential.subjectAgentId,
        capability: journey.credential.capability,
        previousScore: 500,
        claim: journey.claim,
        verification: integrityCorrected,
        spore: journey.spore,
        policyVersion: "test",
        minimumConfidence: 0.8,
        maximumPositiveDelta: 100,
        appliedAt: "2026-07-28T14:10:00.000Z",
      }),
    /positive_reputation_requires_support_verdict/,
  );
});

test("full institutional journey crosses organisms before scoped reputation changes", () => {
  const journey = buildInstitutionalJourney();

  assert.equal(journey.fixtureMode, "synthetic-protocol-demonstration");
  assert.equal(journey.credential.evidence.workoutReceiptDigests.length, 4);
  assert.equal(journey.receipt.status, "succeeded");
  assert.equal(journey.verification.verdict, "supports");
  assert.equal(
    journey.verification.counterclaimResolutions[0]?.status,
    "rejected",
  );
  assert.equal(journey.assertions.independentVerification, true);
  assert.equal(journey.assertions.crossOrganismTransfer, true);
  assert.equal(journey.reputation.previousScore, 500);
  assert.equal(journey.reputation.delta, 94);
  assert.equal(journey.reputation.newScore, 594);
  assert.equal(journey.assertions.externalActionExecuted, false);
});

test("tampering invalidates a Spore envelope", () => {
  const journey = buildInstitutionalJourney();
  const tampered = {
    ...journey.spore,
    targetOrganismId: "urn:dreamnet:organism:attacker",
  };

  assert.equal(verifySpore(tampered), false);
});
