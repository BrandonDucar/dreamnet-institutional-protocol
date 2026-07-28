import {
  assertDigest,
  createIntegrity,
  digestFragment,
  sha256,
  verifyIntegrity,
} from "./canonical.js";
import type {
  ArtifactReference,
  ClaimClass,
  CompetencyCredential,
  Counterclaim,
  CounterclaimResolution,
  Digest,
  EvidenceArtifact,
  ExecutionReceipt,
  FactoryLineage,
  InstitutionalAssignment,
  InstitutionalClaim,
  IntegrityBlock,
  ReputationRecord,
  RiskTier,
  SporeEnvelope,
  StandardBinding,
  VerificationDecision,
} from "./types.js";

type WithoutIntegrity<T extends { integrity: IntegrityBlock }> = Omit<T, "integrity">;

function assertIsoDate(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${field}_invalid_date`);
  }
}

function assertScore(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 1000) {
    throw new Error(`${field}_outside_0_1000`);
  }
}

function assertIntegrityRecord<T extends { integrity: IntegrityBlock }>(
  record: T,
  field: string,
): void {
  const { integrity, ...content } = record;
  if (!verifyIntegrity(content, integrity)) {
    throw new Error(`${field}_integrity_mismatch`);
  }
}

function assertDistinct(values: string[], field: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${field}_contains_duplicates`);
  }
}

function overlaps(left: string[], right: string[]): boolean {
  const rightSet = new Set(right);
  return left.some((value) => rightSet.has(value));
}

function makeArtifactReference(input: {
  artifactId: string;
  artifactType: ArtifactReference["artifactType"];
  schemaVersion: string;
  uri: string;
  digest: string;
}): ArtifactReference {
  assertDigest(input.digest, "artifact");
  return {
    artifactId: input.artifactId,
    artifactType: input.artifactType,
    schemaVersion: input.schemaVersion,
    uri: input.uri,
    digest: input.digest,
  };
}

export interface IssueCompetencyInput {
  issuerId: string;
  subjectAgentId: string;
  capability: string;
  validFrom: string;
  validUntil: string;
  workoutReceiptDigests: Digest[];
  fieldExam: CompetencyCredential["evidence"]["fieldExam"];
}

export function issueCompetency(
  input: IssueCompetencyInput,
): CompetencyCredential {
  assertIsoDate(input.validFrom, "valid_from");
  assertIsoDate(input.validUntil, "valid_until");
  if (Date.parse(input.validUntil) <= Date.parse(input.validFrom)) {
    throw new Error("credential_validity_window_invalid");
  }
  if (input.workoutReceiptDigests.length < 4) {
    throw new Error("minimum_workout_receipts_not_met");
  }
  assertDistinct(input.workoutReceiptDigests, "workout_receipts");
  for (const digest of input.workoutReceiptDigests) {
    assertDigest(digest, "workout_receipt");
  }
  assertDigest(input.fieldExam.receiptDigest, "field_exam_receipt");
  if (!input.fieldExam.independentlyAttested || !input.fieldExam.passed) {
    throw new Error("independent_passing_field_exam_required");
  }
  if (input.fieldExam.reviewerId === input.subjectAgentId) {
    throw new Error("self_attested_field_exam_prohibited");
  }

  const credentialIdentity = sha256({
    issuerId: input.issuerId,
    subjectAgentId: input.subjectAgentId,
    capability: input.capability,
    validFrom: input.validFrom,
  });
  const content: WithoutIntegrity<CompetencyCredential> = {
    schemaVersion: "dreamnet.competency.v1",
    credentialId: `urn:dreamnet:competency:${digestFragment(credentialIdentity)}`,
    issuerId: input.issuerId,
    subjectAgentId: input.subjectAgentId,
    capability: input.capability,
    level: "proctored-field-mastery",
    status: "active",
    validFrom: input.validFrom,
    validUntil: input.validUntil,
    evidence: {
      workoutReceiptDigests: [...input.workoutReceiptDigests],
      fieldExam: { ...input.fieldExam },
    },
    standards: ["toolgym", "w3c-vc"],
  };

  return { ...content, integrity: createIntegrity(content) };
}

export interface AuthorizeAssignmentInput {
  assignmentId: string;
  principalId: string;
  agentId: string;
  goal: string;
  acceptanceCriteria: string[];
  capabilityRequired: string;
  dreamLoopId: string;
  capsuleId: string;
  riskTier: RiskTier;
  humanApproval: InstitutionalAssignment["humanApproval"];
  idempotencyKey: string;
  authorizedAt: string;
  credential: CompetencyCredential;
}

export function authorizeAssignment(
  input: AuthorizeAssignmentInput,
): InstitutionalAssignment {
  assertIntegrityRecord(input.credential, "credential");
  assertIsoDate(input.authorizedAt, "authorized_at");
  if (input.credential.status !== "active") {
    throw new Error("credential_not_active");
  }
  if (
    Date.parse(input.authorizedAt) < Date.parse(input.credential.validFrom)
    || Date.parse(input.authorizedAt) >= Date.parse(input.credential.validUntil)
  ) {
    throw new Error("credential_outside_validity_window");
  }
  if (input.credential.subjectAgentId !== input.agentId) {
    throw new Error("credential_subject_mismatch");
  }
  if (input.credential.capability !== input.capabilityRequired) {
    throw new Error("required_capability_not_proven");
  }
  if (input.acceptanceCriteria.length === 0) {
    throw new Error("acceptance_criteria_required");
  }
  const approvalRequired = input.riskTier === "high" || input.riskTier === "critical";
  if (approvalRequired && (!input.humanApproval.approved || !input.humanApproval.approverId)) {
    throw new Error("human_approval_required");
  }

  const authorizationMaterial = {
    assignmentId: input.assignmentId,
    principalId: input.principalId,
    agentId: input.agentId,
    capabilityRequired: input.capabilityRequired,
    competencyCredentialId: input.credential.credentialId,
    dreamLoopId: input.dreamLoopId,
    capsuleId: input.capsuleId,
    riskTier: input.riskTier,
    humanApproval: input.humanApproval,
    idempotencyKey: input.idempotencyKey,
    authorizedAt: input.authorizedAt,
  };

  return {
    schemaVersion: "dreamnet.institutional-assignment.v1",
    assignmentId: input.assignmentId,
    principalId: input.principalId,
    agentId: input.agentId,
    goal: input.goal,
    acceptanceCriteria: [...input.acceptanceCriteria],
    capabilityRequired: input.capabilityRequired,
    competencyCredentialId: input.credential.credentialId,
    dreamLoopId: input.dreamLoopId,
    capsuleId: input.capsuleId,
    riskTier: input.riskTier,
    humanApproval: { ...input.humanApproval },
    idempotencyKey: input.idempotencyKey,
    authorizedAt: input.authorizedAt,
    authorizationDigest: sha256(authorizationMaterial),
  };
}

export interface CreateEvidenceInput {
  evidenceId: string;
  kind: EvidenceArtifact["kind"];
  uri: string;
  mediaType: string;
  claimClass: ClaimClass;
  assertions: string[];
  observedAt: string;
}

export function createEvidence(input: CreateEvidenceInput): EvidenceArtifact {
  assertIsoDate(input.observedAt, "evidence_observed_at");
  if (input.assertions.length === 0) {
    throw new Error("evidence_assertions_required");
  }
  const content: WithoutIntegrity<EvidenceArtifact> = {
    schemaVersion: "dreamnet.evidence.v1",
    evidenceId: input.evidenceId,
    kind: input.kind,
    uri: input.uri,
    mediaType: input.mediaType,
    claimClass: input.claimClass,
    assertions: [...input.assertions],
    observedAt: input.observedAt,
  };
  return { ...content, integrity: createIntegrity(content) };
}

export interface CreateReceiptInput {
  assignment: InstitutionalAssignment;
  agentId: string;
  traceId: string;
  status: ExecutionReceipt["status"];
  summary: string;
  startedAt: string;
  completedAt: string;
  evidence: EvidenceArtifact[];
  outputs?: ArtifactReference[];
}

export function createExecutionReceipt(
  input: CreateReceiptInput,
): ExecutionReceipt {
  assertIsoDate(input.startedAt, "receipt_started_at");
  assertIsoDate(input.completedAt, "receipt_completed_at");
  if (Date.parse(input.completedAt) < Date.parse(input.startedAt)) {
    throw new Error("receipt_time_order_invalid");
  }
  if (input.assignment.agentId !== input.agentId) {
    throw new Error("receipt_agent_not_authorized");
  }
  if (input.status === "succeeded" && input.evidence.length === 0) {
    throw new Error("successful_receipt_requires_evidence");
  }
  for (const evidence of input.evidence) {
    assertIntegrityRecord(evidence, "evidence");
  }

  const evidenceRefs = input.evidence.map((evidence) =>
    makeArtifactReference({
      artifactId: evidence.evidenceId,
      artifactType: "evidence",
      schemaVersion: evidence.schemaVersion,
      uri: evidence.uri,
      digest: evidence.integrity.digest,
    }),
  );
  const receiptIdentity = sha256({
    assignmentId: input.assignment.assignmentId,
    traceId: input.traceId,
    status: input.status,
    evidence: evidenceRefs,
  });
  const content: WithoutIntegrity<ExecutionReceipt> = {
    schemaVersion: "dreamnet.institutional-receipt.v1",
    receiptId: `urn:dreamnet:receipt:${digestFragment(receiptIdentity)}`,
    assignmentId: input.assignment.assignmentId,
    agentId: input.agentId,
    traceId: input.traceId,
    status: input.status,
    summary: input.summary,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    evidence: evidenceRefs,
    outputs: input.outputs ? [...input.outputs] : [],
    standards: ["dreamnet-public-core", "dreamloops", "w3c-prov", "temporal"],
  };

  return { ...content, integrity: createIntegrity(content) };
}

export interface CreateClaimInput {
  claimClass: ClaimClass;
  statement: string;
  scope: InstitutionalClaim["scope"];
  producer: FactoryLineage;
  receipt: ExecutionReceipt;
  evidence: ArtifactReference[];
  createdAt: string;
}

export function createClaim(input: CreateClaimInput): InstitutionalClaim {
  assertIntegrityRecord(input.receipt, "receipt");
  assertIsoDate(input.createdAt, "claim_created_at");
  if (input.receipt.status !== "succeeded") {
    throw new Error("claim_requires_successful_receipt");
  }
  if (input.statement.trim().length === 0 || input.evidence.length === 0) {
    throw new Error("claim_statement_and_evidence_required");
  }
  const claimIdentity = sha256({
    claimClass: input.claimClass,
    statement: input.statement.trim(),
    scope: input.scope,
  });
  const content: WithoutIntegrity<InstitutionalClaim> = {
    schemaVersion: "dreamnet.institutional-claim.v1",
    claimId: `urn:dreamnet:claim:${digestFragment(claimIdentity)}`,
    claimClass: input.claimClass,
    statement: input.statement.trim(),
    scope: { ...input.scope },
    status: "proposed",
    producer: {
      ...input.producer,
      workerIds: [...input.producer.workerIds],
      modelLineages: [...input.producer.modelLineages],
      retrievalLineages: [...input.producer.retrievalLineages],
    },
    receiptDigest: input.receipt.integrity.digest,
    evidence: [...input.evidence],
    createdAt: input.createdAt,
  };
  return { ...content, integrity: createIntegrity(content) };
}

export interface CreateCounterclaimInput {
  targetClaim: InstitutionalClaim;
  statement: string;
  producer: FactoryLineage;
  evidence: ArtifactReference[];
  createdAt: string;
}

export function createCounterclaim(
  input: CreateCounterclaimInput,
): Counterclaim {
  assertIntegrityRecord(input.targetClaim, "target_claim");
  assertIsoDate(input.createdAt, "counterclaim_created_at");
  if (input.statement.trim().length === 0 || input.evidence.length === 0) {
    throw new Error("counterclaim_statement_and_evidence_required");
  }
  const identity = sha256({
    targetClaimDigest: input.targetClaim.integrity.digest,
    statement: input.statement.trim(),
    producerFactoryId: input.producer.factoryId,
  });
  const content: WithoutIntegrity<Counterclaim> = {
    schemaVersion: "dreamnet.counterclaim.v1",
    counterclaimId: `urn:dreamnet:counterclaim:${digestFragment(identity)}`,
    targetClaimDigest: input.targetClaim.integrity.digest,
    statement: input.statement.trim(),
    producer: {
      ...input.producer,
      workerIds: [...input.producer.workerIds],
      modelLineages: [...input.producer.modelLineages],
      retrievalLineages: [...input.producer.retrievalLineages],
    },
    evidence: [...input.evidence],
    createdAt: input.createdAt,
  };
  return { ...content, integrity: createIntegrity(content) };
}

function assertIndependent(
  producer: FactoryLineage,
  verifier: FactoryLineage,
): void {
  if (producer.factoryId === verifier.factoryId) {
    throw new Error("self_verification_prohibited");
  }
  if (overlaps(producer.workerIds, verifier.workerIds)) {
    throw new Error("verifier_worker_lineage_overlap");
  }
  if (overlaps(producer.modelLineages, verifier.modelLineages)) {
    throw new Error("verifier_model_lineage_overlap");
  }
  if (overlaps(producer.retrievalLineages, verifier.retrievalLineages)) {
    throw new Error("verifier_retrieval_lineage_overlap");
  }
}

export interface VerifyClaimInput {
  claim: InstitutionalClaim;
  counterclaims: Counterclaim[];
  verifier: FactoryLineage;
  verdict: VerificationDecision["verdict"];
  confidence: number;
  findings: string[];
  evidence: ArtifactReference[];
  counterclaimResolutions: CounterclaimResolution[];
  verifiedAt: string;
}

export function verifyClaim(input: VerifyClaimInput): VerificationDecision {
  assertIntegrityRecord(input.claim, "claim");
  assertIndependent(input.claim.producer, input.verifier);
  assertIsoDate(input.verifiedAt, "verified_at");
  if (input.confidence < 0 || input.confidence > 1) {
    throw new Error("verification_confidence_outside_0_1");
  }
  if (input.findings.length === 0 || input.evidence.length === 0) {
    throw new Error("verification_findings_and_evidence_required");
  }

  const counterclaimIds = new Set<string>();
  for (const counterclaim of input.counterclaims) {
    assertIntegrityRecord(counterclaim, "counterclaim");
    if (counterclaim.targetClaimDigest !== input.claim.integrity.digest) {
      throw new Error("counterclaim_target_mismatch");
    }
    counterclaimIds.add(counterclaim.counterclaimId);
  }
  const resolutionIds = new Set(
    input.counterclaimResolutions.map((resolution) => resolution.counterclaimId),
  );
  if (
    resolutionIds.size !== counterclaimIds.size
    || [...counterclaimIds].some((id) => !resolutionIds.has(id))
  ) {
    throw new Error("every_counterclaim_requires_one_resolution");
  }
  if (
    input.verdict === "supports"
    && input.counterclaimResolutions.some((resolution) => resolution.status !== "rejected")
  ) {
    throw new Error("support_verdict_requires_resolved_counterclaims");
  }

  const identity = sha256({
    targetClaimDigest: input.claim.integrity.digest,
    verifierFactoryId: input.verifier.factoryId,
    verifiedAt: input.verifiedAt,
  });
  const content: WithoutIntegrity<VerificationDecision> = {
    schemaVersion: "dreamnet.verification.v1",
    verificationId: `urn:dreamnet:verification:${digestFragment(identity)}`,
    targetClaimDigest: input.claim.integrity.digest,
    verifier: {
      ...input.verifier,
      workerIds: [...input.verifier.workerIds],
      modelLineages: [...input.verifier.modelLineages],
      retrievalLineages: [...input.verifier.retrievalLineages],
    },
    verdict: input.verdict,
    confidence: input.confidence,
    findings: [...input.findings],
    evidence: [...input.evidence],
    counterclaimResolutions: input.counterclaimResolutions.map((resolution) => ({
      ...resolution,
    })),
    verifiedAt: input.verifiedAt,
  };
  return { ...content, integrity: createIntegrity(content) };
}

export interface CreateSporeInput {
  sourceOrganismId: string;
  targetOrganismId: string;
  claim: InstitutionalClaim;
  verification: VerificationDecision;
  issuedAt: string;
}

export function createSpore(input: CreateSporeInput): SporeEnvelope {
  assertIntegrityRecord(input.claim, "claim");
  assertIntegrityRecord(input.verification, "verification");
  assertIsoDate(input.issuedAt, "spore_issued_at");
  if (input.sourceOrganismId === input.targetOrganismId) {
    throw new Error("spore_requires_distinct_organisms");
  }
  if (input.verification.targetClaimDigest !== input.claim.integrity.digest) {
    throw new Error("spore_claim_verification_mismatch");
  }
  const artifactRefs: ArtifactReference[] = [
    makeArtifactReference({
      artifactId: input.claim.claimId,
      artifactType: "claim",
      schemaVersion: input.claim.schemaVersion,
      uri: `urn:dreamnet:artifact:${input.claim.claimId}`,
      digest: input.claim.integrity.digest,
    }),
    makeArtifactReference({
      artifactId: input.verification.verificationId,
      artifactType: "verification",
      schemaVersion: input.verification.schemaVersion,
      uri: `urn:dreamnet:artifact:${input.verification.verificationId}`,
      digest: input.verification.integrity.digest,
    }),
  ];
  const identity = sha256({
    sourceOrganismId: input.sourceOrganismId,
    targetOrganismId: input.targetOrganismId,
    artifactRefs,
  });
  const protocolBindings: StandardBinding[] = [
    "spore",
    "a2a",
    "w3c-prov",
    "w3c-vc",
  ];
  const content: WithoutIntegrity<SporeEnvelope> = {
    schemaVersion: "dreamnet.spore.v1",
    sporeId: `urn:dreamnet:spore:${digestFragment(identity)}`,
    sourceOrganismId: input.sourceOrganismId,
    targetOrganismId: input.targetOrganismId,
    artifactRefs,
    protocolBindings,
    issuedAt: input.issuedAt,
  };
  return { ...content, integrity: createIntegrity(content) };
}

export function verifySpore(spore: SporeEnvelope): boolean {
  const { integrity, ...content } = spore;
  if (!verifyIntegrity(content, integrity)) return false;
  if (spore.sourceOrganismId === spore.targetOrganismId) return false;
  return spore.artifactRefs.every((artifact) =>
    /^sha256:[a-f0-9]{64}$/.test(artifact.digest),
  );
}

export interface ApplyReputationInput {
  subjectAgentId: string;
  capability: string;
  previousScore: number;
  claim: InstitutionalClaim;
  verification: VerificationDecision;
  spore: SporeEnvelope;
  policyVersion: string;
  minimumConfidence: number;
  maximumPositiveDelta: number;
  appliedAt: string;
}

export function applyReputation(
  input: ApplyReputationInput,
): ReputationRecord {
  assertScore(input.previousScore, "previous_score");
  assertIsoDate(input.appliedAt, "reputation_applied_at");
  assertIntegrityRecord(input.claim, "claim");
  assertIntegrityRecord(input.verification, "verification");
  if (!verifySpore(input.spore)) {
    throw new Error("spore_integrity_invalid");
  }
  if (input.verification.targetClaimDigest !== input.claim.integrity.digest) {
    throw new Error("reputation_claim_verification_mismatch");
  }
  if (input.verification.verdict !== "supports") {
    throw new Error("positive_reputation_requires_support_verdict");
  }
  if (input.verification.confidence < input.minimumConfidence) {
    throw new Error("verification_confidence_below_policy");
  }
  if (
    input.verification.counterclaimResolutions.some(
      (resolution) => resolution.status !== "rejected",
    )
  ) {
    throw new Error("unresolved_counterclaim_blocks_reputation");
  }
  if (input.claim.scope.capability !== input.capability) {
    throw new Error("reputation_scope_mismatch");
  }
  const sporeDigests = new Set(
    input.spore.artifactRefs.map((artifact) => artifact.digest),
  );
  if (
    !sporeDigests.has(input.claim.integrity.digest)
    || !sporeDigests.has(input.verification.integrity.digest)
  ) {
    throw new Error("spore_missing_reputation_basis");
  }
  if (
    !Number.isInteger(input.maximumPositiveDelta)
    || input.maximumPositiveDelta < 1
    || input.maximumPositiveDelta > 100
  ) {
    throw new Error("maximum_positive_delta_outside_1_100");
  }

  const calculatedDelta = Math.max(
    1,
    Math.floor(input.verification.confidence * 100),
  );
  const delta = Math.min(input.maximumPositiveDelta, calculatedDelta);
  const newScore = Math.min(1000, input.previousScore + delta);
  const identity = sha256({
    subjectAgentId: input.subjectAgentId,
    capability: input.capability,
    verificationDigest: input.verification.integrity.digest,
    policyVersion: input.policyVersion,
  });
  const content: WithoutIntegrity<ReputationRecord> = {
    schemaVersion: "dreamnet.reputation-update.v1",
    updateId: `urn:dreamnet:reputation:${digestFragment(identity)}`,
    subjectAgentId: input.subjectAgentId,
    capability: input.capability,
    previousScore: input.previousScore,
    delta,
    newScore,
    policyVersion: input.policyVersion,
    basis: {
      claimDigest: input.claim.integrity.digest,
      verificationDigest: input.verification.integrity.digest,
      sporeDigest: input.spore.integrity.digest,
    },
    appliedAt: input.appliedAt,
  };
  return { ...content, integrity: createIntegrity(content) };
}

export function evidenceReference(evidence: EvidenceArtifact): ArtifactReference {
  assertIntegrityRecord(evidence, "evidence");
  return makeArtifactReference({
    artifactId: evidence.evidenceId,
    artifactType: "evidence",
    schemaVersion: evidence.schemaVersion,
    uri: evidence.uri,
    digest: evidence.integrity.digest,
  });
}
