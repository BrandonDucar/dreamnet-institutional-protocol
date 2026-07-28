export type Digest = `sha256:${string}`;

export type RiskTier = "low" | "medium" | "high" | "critical";

export type ClaimClass =
  | "DIRECT_SOURCE"
  | "SYSTEM_OBSERVATION"
  | "HUMAN_ASSERTION"
  | "MODEL_INFERENCE"
  | "PLANNED_STATE"
  | "DEMONSTRATED_STATE";

export type StandardBinding =
  | "dreamnet-public-core"
  | "dreamloops"
  | "toolgym"
  | "claim-factory"
  | "spore"
  | "git-grid"
  | "temporal"
  | "mcp"
  | "a2a"
  | "w3c-prov"
  | "w3c-vc"
  | "eas"
  | "erc-8004";

export interface SignatureProof {
  suite: string;
  verificationMethod: string;
  value: string;
}

export interface IntegrityBlock {
  canonicalization: "dreamnet.sorted-json.v1";
  digest: Digest;
  signature?: SignatureProof;
}

export interface ArtifactReference {
  artifactId: string;
  artifactType:
    | "competency"
    | "assignment"
    | "receipt"
    | "evidence"
    | "claim"
    | "counterclaim"
    | "verification"
    | "reputation";
  schemaVersion: string;
  uri: string;
  digest: Digest;
}

export interface EvidenceArtifact {
  schemaVersion: "dreamnet.evidence.v1";
  evidenceId: string;
  kind: "artifact" | "test" | "source" | "observation" | "approval";
  uri: string;
  mediaType: string;
  claimClass: ClaimClass;
  assertions: string[];
  observedAt: string;
  integrity: IntegrityBlock;
}

export interface FactoryLineage {
  factoryId: string;
  organismId: string;
  workerIds: string[];
  modelLineages: string[];
  retrievalLineages: string[];
}

export interface CompetencyCredential {
  schemaVersion: "dreamnet.competency.v1";
  credentialId: string;
  issuerId: string;
  subjectAgentId: string;
  capability: string;
  level: "proctored-field-mastery";
  status: "active" | "suspended" | "revoked" | "expired";
  validFrom: string;
  validUntil: string;
  evidence: {
    workoutReceiptDigests: Digest[];
    fieldExam: {
      receiptDigest: Digest;
      reviewerId: string;
      reviewerOrganization: string;
      independentlyAttested: boolean;
      passed: boolean;
    };
  };
  standards: StandardBinding[];
  integrity: IntegrityBlock;
}

export interface InstitutionalAssignment {
  schemaVersion: "dreamnet.institutional-assignment.v1";
  assignmentId: string;
  principalId: string;
  agentId: string;
  goal: string;
  acceptanceCriteria: string[];
  capabilityRequired: string;
  competencyCredentialId: string;
  dreamLoopId: string;
  capsuleId: string;
  riskTier: RiskTier;
  humanApproval: {
    required: boolean;
    approved: boolean;
    approverId?: string;
  };
  idempotencyKey: string;
  authorizedAt: string;
  authorizationDigest: Digest;
}

export interface ExecutionReceipt {
  schemaVersion: "dreamnet.institutional-receipt.v1";
  receiptId: string;
  assignmentId: string;
  agentId: string;
  traceId: string;
  status: "succeeded" | "failed" | "abstained";
  summary: string;
  startedAt: string;
  completedAt: string;
  evidence: ArtifactReference[];
  outputs: ArtifactReference[];
  standards: StandardBinding[];
  integrity: IntegrityBlock;
}

export interface InstitutionalClaim {
  schemaVersion: "dreamnet.institutional-claim.v1";
  claimId: string;
  claimClass: ClaimClass;
  statement: string;
  scope: {
    domain: string;
    capability?: string;
    validFrom?: string;
    validUntil?: string;
  };
  status: "proposed" | "supported" | "verified" | "disputed" | "retracted";
  producer: FactoryLineage;
  receiptDigest: Digest;
  evidence: ArtifactReference[];
  createdAt: string;
  integrity: IntegrityBlock;
}

export interface Counterclaim {
  schemaVersion: "dreamnet.counterclaim.v1";
  counterclaimId: string;
  targetClaimDigest: Digest;
  statement: string;
  producer: FactoryLineage;
  evidence: ArtifactReference[];
  createdAt: string;
  integrity: IntegrityBlock;
}

export interface CounterclaimResolution {
  counterclaimId: string;
  status: "sustained" | "rejected" | "unresolved";
  reason: string;
}

export interface VerificationDecision {
  schemaVersion: "dreamnet.verification.v1";
  verificationId: string;
  targetClaimDigest: Digest;
  verifier: FactoryLineage;
  verdict: "supports" | "challenges" | "inconclusive";
  confidence: number;
  findings: string[];
  evidence: ArtifactReference[];
  counterclaimResolutions: CounterclaimResolution[];
  verifiedAt: string;
  integrity: IntegrityBlock;
}

export interface SporeEnvelope {
  schemaVersion: "dreamnet.spore.v1";
  sporeId: string;
  sourceOrganismId: string;
  targetOrganismId: string;
  artifactRefs: ArtifactReference[];
  protocolBindings: StandardBinding[];
  issuedAt: string;
  integrity: IntegrityBlock;
}

export interface ReputationRecord {
  schemaVersion: "dreamnet.reputation-update.v1";
  updateId: string;
  subjectAgentId: string;
  capability: string;
  previousScore: number;
  delta: number;
  newScore: number;
  policyVersion: string;
  basis: {
    claimDigest: Digest;
    verificationDigest: Digest;
    sporeDigest: Digest;
  };
  appliedAt: string;
  integrity: IntegrityBlock;
}

export interface InstitutionalJourney {
  schemaVersion: "dreamnet.institutional-journey.v1";
  fixtureMode: "synthetic-protocol-demonstration";
  credential: CompetencyCredential;
  assignment: InstitutionalAssignment;
  evidence: EvidenceArtifact[];
  receipt: ExecutionReceipt;
  claim: InstitutionalClaim;
  counterclaim: Counterclaim;
  verification: VerificationDecision;
  spore: SporeEnvelope;
  reputation: ReputationRecord;
  assertions: {
    independentVerification: boolean;
    counterclaimResolved: boolean;
    crossOrganismTransfer: boolean;
    reputationChangedOnlyAfterVerification: boolean;
    externalActionExecuted: false;
  };
}
