import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  applyReputation,
  authorizeAssignment,
  createClaim,
  createCounterclaim,
  createEvidence,
  createExecutionReceipt,
  createSpore,
  evidenceReference,
  issueCompetency,
  sha256,
  verifyClaim,
  verifySpore,
} from "./index.js";
import type {
  FactoryLineage,
  InstitutionalJourney,
} from "./types.js";

const AGENT_ID = "did:dreamnet:agent:weaver-apprentice";
const CAPABILITY = "repository-supply-chain-review";

const producer: FactoryLineage = {
  factoryId: "urn:dreamnet:factory:supply-chain-review",
  organismId: "urn:dreamnet:organism:dreamnet",
  workerIds: [
    "did:dreamnet:worker:lifecycle-auditor",
    "did:dreamnet:worker:hook-auditor",
  ],
  modelLineages: ["model:dreamnet:reviewer-a"],
  retrievalLineages: ["retrieval:dreamnet:repository-snapshot-a"],
};

const challenger: FactoryLineage = {
  factoryId: "urn:zao:factory:adversarial-review",
  organismId: "urn:dreamnet:organism:zao",
  workerIds: ["did:zao:worker:challenge-17"],
  modelLineages: ["model:zao:adversary-b"],
  retrievalLineages: ["retrieval:zao:repository-snapshot-b"],
};

const verifier: FactoryLineage = {
  factoryId: "urn:zao:factory:independent-verification",
  organismId: "urn:dreamnet:organism:zao",
  workerIds: ["did:zao:worker:verifier-31"],
  modelLineages: ["model:zao:verifier-c"],
  retrievalLineages: ["retrieval:zao:clean-room-snapshot-c"],
};

export function buildInstitutionalJourney(): InstitutionalJourney {
  const workoutReceiptDigests = [1, 2, 3, 4].map((workout) =>
    sha256({
      fixtureMode: "synthetic-protocol-demonstration",
      workout,
      capability: CAPABILITY,
      passed: true,
    }),
  );

  const credential = issueCompetency({
    issuerId: "did:dreamnet:university:toolgym",
    subjectAgentId: AGENT_ID,
    capability: CAPABILITY,
    validFrom: "2026-07-28T12:00:00.000Z",
    validUntil: "2027-07-28T12:00:00.000Z",
    workoutReceiptDigests,
    fieldExam: {
      receiptDigest: sha256({
        fixtureMode: "synthetic-protocol-demonstration",
        exam: "supply-chain-field-exam",
        passed: true,
      }),
      reviewerId: "did:dreamnet:human:examiner-7",
      reviewerOrganization: "DreamNet ToolGym",
      independentlyAttested: true,
      passed: true,
    },
  });

  const assignment = authorizeAssignment({
    assignmentId: "assignment:supply-chain-fixture-001",
    principalId: "did:dreamnet:principal:protocol-lab",
    agentId: AGENT_ID,
    goal: "Audit a synthetic repository for seeded supply-chain risks.",
    acceptanceCriteria: [
      "Inspect package lifecycle scripts.",
      "Inspect Git hooks.",
      "Identify dangerous dynamic execution APIs.",
      "Produce evidence without executing external code.",
    ],
    capabilityRequired: CAPABILITY,
    dreamLoopId: "dreamloop:supply-chain-review-v1",
    capsuleId: "capsule:bounded-read-only-review-v1",
    riskTier: "medium",
    humanApproval: {
      required: false,
      approved: false,
    },
    idempotencyKey: "fixture:supply-chain-fixture-001:v1",
    authorizedAt: "2026-07-28T13:00:00.000Z",
    credential,
  });

  const lifecycleEvidence = createEvidence({
    evidenceId: "evidence:lifecycle-scan-001",
    kind: "observation",
    uri: "urn:dreamnet:fixture:lifecycle-scan-001",
    mediaType: "application/json",
    claimClass: "SYSTEM_OBSERVATION",
    assertions: [
      "package.json lifecycle scripts were enumerated.",
      "A seeded postinstall network-execution pattern was detected.",
    ],
    observedAt: "2026-07-28T13:04:00.000Z",
  });
  const hookEvidence = createEvidence({
    evidenceId: "evidence:hook-scan-001",
    kind: "observation",
    uri: "urn:dreamnet:fixture:hook-scan-001",
    mediaType: "application/json",
    claimClass: "SYSTEM_OBSERVATION",
    assertions: [
      "Git and Husky hooks were enumerated.",
      "A seeded remote payload execution pattern was detected.",
    ],
    observedAt: "2026-07-28T13:05:00.000Z",
  });
  const testEvidence = createEvidence({
    evidenceId: "evidence:fixture-tests-001",
    kind: "test",
    uri: "urn:dreamnet:fixture:test-report-001",
    mediaType: "application/json",
    claimClass: "DEMONSTRATED_STATE",
    assertions: [
      "All seeded lifecycle, hook, and dynamic execution risks were identified.",
      "No package install, network request, tool call, or external action occurred.",
    ],
    observedAt: "2026-07-28T13:08:00.000Z",
  });
  const evidence = [lifecycleEvidence, hookEvidence, testEvidence];

  const receipt = createExecutionReceipt({
    assignment,
    agentId: AGENT_ID,
    traceId: "trace:institutional-demo-001",
    status: "succeeded",
    summary: "Completed a read-only review and identified all seeded risks.",
    startedAt: "2026-07-28T13:01:00.000Z",
    completedAt: "2026-07-28T13:09:00.000Z",
    evidence,
  });

  const claim = createClaim({
    claimClass: "DEMONSTRATED_STATE",
    statement:
      "The agent completed the repository supply-chain review and identified every seeded risk without executing external code.",
    scope: {
      domain: "software-supply-chain-security",
      capability: CAPABILITY,
      validFrom: "2026-07-28T13:09:00.000Z",
    },
    producer,
    receipt,
    evidence: evidence.map(evidenceReference),
    createdAt: "2026-07-28T13:10:00.000Z",
  });

  const counterclaim = createCounterclaim({
    targetClaim: claim,
    statement:
      "The review may have omitted package lifecycle-script analysis.",
    producer: challenger,
    evidence: [evidenceReference(lifecycleEvidence)],
    createdAt: "2026-07-28T13:12:00.000Z",
  });

  const verification = verifyClaim({
    claim,
    counterclaims: [counterclaim],
    verifier,
    verdict: "supports",
    confidence: 0.94,
    findings: [
      "The lifecycle evidence explicitly enumerates package scripts.",
      "The independent fixture replay found every seeded risk.",
      "The counterclaim is contradicted by integrity-verified evidence.",
    ],
    evidence: [
      evidenceReference(lifecycleEvidence),
      evidenceReference(testEvidence),
    ],
    counterclaimResolutions: [
      {
        counterclaimId: counterclaim.counterclaimId,
        status: "rejected",
        reason:
          "Lifecycle-script analysis is explicitly recorded in the evidence artifact.",
      },
    ],
    verifiedAt: "2026-07-28T13:20:00.000Z",
  });

  const spore = createSpore({
    sourceOrganismId: "urn:dreamnet:organism:dreamnet",
    targetOrganismId: "urn:dreamnet:organism:zao",
    claim,
    verification,
    issuedAt: "2026-07-28T13:22:00.000Z",
  });

  if (!verifySpore(spore)) {
    throw new Error("synthetic_spore_verification_failed");
  }

  const reputation = applyReputation({
    subjectAgentId: AGENT_ID,
    capability: CAPABILITY,
    previousScore: 500,
    claim,
    verification,
    spore,
    policyVersion: "dreamnet.scoped-reputation.v1",
    minimumConfidence: 0.9,
    maximumPositiveDelta: 100,
    appliedAt: "2026-07-28T13:23:00.000Z",
  });

  return {
    schemaVersion: "dreamnet.institutional-journey.v1",
    fixtureMode: "synthetic-protocol-demonstration",
    credential,
    assignment,
    evidence,
    receipt,
    claim,
    counterclaim,
    verification,
    spore,
    reputation,
    assertions: {
      independentVerification:
        verification.verifier.organismId !== claim.producer.organismId,
      counterclaimResolved:
        verification.counterclaimResolutions[0]?.status === "rejected",
      crossOrganismTransfer:
        spore.sourceOrganismId !== spore.targetOrganismId,
      reputationChangedOnlyAfterVerification:
        verification.verdict === "supports" && reputation.delta > 0,
      externalActionExecuted: false,
    },
  };
}

async function main(): Promise<void> {
  const journey = buildInstitutionalJourney();
  const summary = {
    fixtureMode: journey.fixtureMode,
    credentialId: journey.credential.credentialId,
    assignmentId: journey.assignment.assignmentId,
    receiptStatus: journey.receipt.status,
    claimId: journey.claim.claimId,
    counterclaimStatus:
      journey.verification.counterclaimResolutions[0]?.status,
    verificationVerdict: journey.verification.verdict,
    crossOrganismTransfer: journey.assertions.crossOrganismTransfer,
    capability: journey.reputation.capability,
    reputation: {
      before: journey.reputation.previousScore,
      delta: journey.reputation.delta,
      after: journey.reputation.newScore,
    },
    externalActionExecuted: journey.assertions.externalActionExecuted,
  };

  if (process.argv.includes("--write")) {
    const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
    const target = resolve(
      projectRoot,
      "artifacts/demo/institutional-journey.json",
    );
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify(journey, null, 2)}\n`, "utf8");
    console.log(`Wrote ${target}`);
  }

  console.log(JSON.stringify(summary, null, 2));
}

const invokedPath = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : undefined;

if (invokedPath === import.meta.url) {
  await main();
}
