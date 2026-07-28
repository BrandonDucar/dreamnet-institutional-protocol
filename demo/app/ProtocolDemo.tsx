"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clipboard,
  Download,
  ExternalLink,
  FileCheck2,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import journey from "./institutional-journey.json";

type Artifact = Record<string, unknown>;

type Step = {
  key: string;
  short: string;
  title: string;
  eyebrow: string;
  summary: string;
  artifactLabel: string;
  artifactId: string;
  artifact: Artifact;
  provenance: string;
  digest: string;
  gate: string;
  trustDecision: string;
  metrics: Array<{ label: string; value: string }>;
  lineage: Array<{ label: string; value: string }>;
};

const compact = (value: string, start = 22, end = 10) =>
  value.length > start + end + 3
    ? `${value.slice(0, start)}...${value.slice(-end)}`
    : value;

const steps: Step[] = [
  {
    key: "competency",
    short: "Competency",
    title: "Competency is earned before authority is granted.",
    eyebrow: "TOOLGYM / CREDENTIAL",
    summary:
      "Weaver Apprentice completes four distinct workouts and an independently attested field exam. The resulting credential is narrow: it proves eligibility for repository supply-chain review, not universal competence.",
    artifactLabel: "Competency credential",
    artifactId: journey.credential.credentialId,
    artifact: journey.credential as Artifact,
    provenance: "DEMONSTRATED_STATE",
    digest: journey.credential.integrity.digest,
    gate:
      "The required capability, credential status, validity window, and independent exam must all pass.",
    trustDecision:
      "No reputation change. A credential permits consideration for work; it does not prove the next task will succeed.",
    metrics: [
      {
        label: "Workouts",
        value: String(journey.credential.evidence.workoutReceiptDigests.length),
      },
      {
        label: "Field exam",
        value: journey.credential.evidence.fieldExam.independentlyAttested
          ? "Independent"
          : "Internal",
      },
      { label: "Capability", value: "Supply-chain review" },
    ],
    lineage: [
      { label: "Issuer", value: journey.credential.issuerId },
      { label: "Subject", value: journey.credential.subjectAgentId },
      {
        label: "Examiner",
        value: journey.credential.evidence.fieldExam.reviewerId,
      },
    ],
  },
  {
    key: "assignment",
    short: "Authority",
    title: "Authority is bounded to one assignment.",
    eyebrow: "PRINCIPAL / ASSIGNMENT",
    summary:
      "The principal authorizes a synthetic, read-only repository review. DreamLoop and Capsule identifiers define the operating pattern and boundary; the idempotency key prevents the same assignment from being replayed as new work.",
    artifactLabel: "Institutional assignment",
    artifactId: journey.assignment.assignmentId,
    artifact: journey.assignment as Artifact,
    provenance: "HUMAN_ASSERTION",
    digest: journey.assignment.authorizationDigest,
    gate:
      "Identity, capability match, risk tier, approval policy, and idempotency are checked before execution.",
    trustDecision:
      "No reputation change. Authorization records who allowed the work and under which constraints; it is not evidence of completion.",
    metrics: [
      { label: "Risk tier", value: journey.assignment.riskTier },
      { label: "Mode", value: "Read-only" },
      { label: "Approval", value: "Policy-cleared" },
    ],
    lineage: [
      { label: "Principal", value: journey.assignment.principalId },
      { label: "DreamLoop", value: journey.assignment.dreamLoopId },
      { label: "Capsule", value: journey.assignment.capsuleId },
    ],
  },
  {
    key: "receipt",
    short: "Receipt",
    title: "Execution produces evidence, not a self-reported success.",
    eyebrow: "EVIDENCE / RECEIPT",
    summary:
      "The agent inspects lifecycle scripts, Git hooks, and fixture tests without installing packages or contacting a network. Three integrity-linked evidence artifacts are attached to a replayable receipt.",
    artifactLabel: "Execution receipt",
    artifactId: journey.receipt.receiptId,
    artifact: journey.receipt as Artifact,
    provenance: "SYSTEM_OBSERVATION",
    digest: journey.receipt.integrity.digest,
    gate:
      "A succeeded status is accepted only when the receipt references authorized work and integrity-linked evidence.",
    trustDecision:
      "No reputation change. The receipt proves the recorded execution path, but the central claim has not been independently tested.",
    metrics: [
      { label: "Evidence", value: String(journey.receipt.evidence.length) },
      { label: "Status", value: journey.receipt.status },
      { label: "External actions", value: "0" },
    ],
    lineage: [
      { label: "Assignment", value: journey.receipt.assignmentId },
      { label: "Agent", value: journey.receipt.agentId },
      { label: "Trace", value: journey.receipt.traceId },
    ],
  },
  {
    key: "claim",
    short: "Claim",
    title: "The Claim Factory states exactly what was learned.",
    eyebrow: "CLAIM FACTORY / PROPOSAL",
    summary:
      "The receipt is crystallized into one atomic, capability-scoped statement. The claim is still proposed: its digest locks the bytes, while its evidence links explain why the statement might deserve belief.",
    artifactLabel: "Institutional claim",
    artifactId: journey.claim.claimId,
    artifact: journey.claim as Artifact,
    provenance: journey.claim.claimClass,
    digest: journey.claim.integrity.digest,
    gate:
      "The statement must stay within the assignment scope and cite the receipt and evidence that produced it.",
    trustDecision:
      "No reputation change. Integrity is not truth, and a producer cannot independently validate its own proposed claim.",
    metrics: [
      { label: "Status", value: journey.claim.status },
      { label: "Workers", value: String(journey.claim.producer.workerIds.length) },
      { label: "Evidence refs", value: String(journey.claim.evidence.length) },
    ],
    lineage: [
      { label: "Factory", value: journey.claim.producer.factoryId },
      { label: "Organism", value: journey.claim.producer.organismId },
      { label: "Receipt", value: journey.claim.receiptDigest },
    ],
  },
  {
    key: "counterclaim",
    short: "Challenge",
    title: "Another organism is invited to disagree.",
    eyebrow: "COUNTERCLAIM / ADVERSARIAL REVIEW",
    summary:
      "ZAO challenges the central result: perhaps lifecycle scripts were omitted. The objection is preserved as a first-class artifact with its own producer lineage, evidence reference, and digest.",
    artifactLabel: "Counterclaim",
    artifactId: journey.counterclaim.counterclaimId,
    artifact: journey.counterclaim as Artifact,
    provenance: "MODEL_INFERENCE",
    digest: journey.counterclaim.integrity.digest,
    gate:
      "The counterclaim must target an exact claim digest and expose its own evidence and producer lineage.",
    trustDecision:
      "No reputation change. Disagreement triggers verification rather than a vote, popularity score, or automatic rejection.",
    metrics: [
      { label: "Challenges", value: "1" },
      { label: "Source organism", value: "ZAO" },
      { label: "Resolution", value: "Pending review" },
    ],
    lineage: [
      { label: "Factory", value: journey.counterclaim.producer.factoryId },
      { label: "Organism", value: journey.counterclaim.producer.organismId },
      {
        label: "Target",
        value: journey.counterclaim.targetClaimDigest,
      },
    ],
  },
  {
    key: "verification",
    short: "Verification",
    title: "A clean-room verifier resolves the challenge.",
    eyebrow: "INDEPENDENT VERIFICATION / CLEAN ROOM",
    summary:
      "A separate ZAO verifier replays the fixture against an independent retrieval lineage. It finds explicit lifecycle evidence, supports the claim at 0.94 confidence, and rejects the counterclaim with a recorded reason.",
    artifactLabel: "Verification result",
    artifactId: journey.verification.verificationId,
    artifact: journey.verification as Artifact,
    provenance: "DEMONSTRATED_STATE",
    digest: journey.verification.integrity.digest,
    gate:
      "The verifier must be organizationally distinct, use an independent lineage, address counterevidence, and publish findings.",
    trustDecision:
      "The claim becomes supportable, but reputation waits until the claim and verification are transferred as a portable evidence package.",
    metrics: [
      {
        label: "Confidence",
        value: `${Math.round(journey.verification.confidence * 100)}%`,
      },
      { label: "Verdict", value: journey.verification.verdict },
      {
        label: "Counterclaim",
        value: journey.verification.counterclaimResolutions[0].status,
      },
    ],
    lineage: [
      { label: "Factory", value: journey.verification.verifier.factoryId },
      { label: "Organism", value: journey.verification.verifier.organismId },
      {
        label: "Retrieval",
        value: journey.verification.verifier.retrievalLineages[0],
      },
    ],
  },
  {
    key: "spore",
    short: "Transfer",
    title: "The verified knowledge crosses an organism boundary.",
    eyebrow: "SPORE / PORTABLE EVIDENCE",
    summary:
      "DreamNet packages the exact claim and verification references into a Spore. ZAO can inspect the portable artifacts without inheriting DreamNet's private memory, tools, or runtime.",
    artifactLabel: "Spore envelope",
    artifactId: journey.spore.sporeId,
    artifact: journey.spore as Artifact,
    provenance: "DEMONSTRATED_STATE",
    digest: journey.spore.integrity.digest,
    gate:
      "The envelope must name source and target organisms, preserve artifact digests, and declare compatible protocol bindings.",
    trustDecision:
      "The evidence is now independently inspectable across organizations. Reputation may change only on the named capability.",
    metrics: [
      { label: "Artifacts", value: String(journey.spore.artifactRefs.length) },
      { label: "Protocols", value: String(journey.spore.protocolBindings.length) },
      { label: "Transfer", value: "Cross-organism" },
    ],
    lineage: [
      { label: "Source", value: journey.spore.sourceOrganismId },
      { label: "Target", value: journey.spore.targetOrganismId },
      {
        label: "Bindings",
        value: journey.spore.protocolBindings.join(", "),
      },
    ],
  },
  {
    key: "reputation",
    short: "Reputation",
    title: "Trust compounds only where evidence earned it.",
    eyebrow: "SCOPED REPUTATION / POLICY",
    summary:
      "The verified, transferred result updates Weaver Apprentice only for repository supply-chain review. The score rises from 500 to 594; no universal trust badge is created.",
    artifactLabel: "Reputation update",
    artifactId: journey.reputation.updateId,
    artifact: journey.reputation as Artifact,
    provenance: "DEMONSTRATED_STATE",
    digest: journey.reputation.integrity.digest,
    gate:
      "A supported claim, independent verification, portable Spore, and matching capability scope are all required.",
    trustDecision:
      "Reputation changes by +94 for repository supply-chain review. Every other capability remains unchanged.",
    metrics: [
      { label: "Previous", value: String(journey.reputation.previousScore) },
      { label: "Change", value: `+${journey.reputation.delta}` },
      { label: "New score", value: String(journey.reputation.newScore) },
    ],
    lineage: [
      { label: "Claim", value: journey.reputation.basis.claimDigest },
      {
        label: "Verification",
        value: journey.reputation.basis.verificationDigest,
      },
      { label: "Spore", value: journey.reputation.basis.sporeDigest },
    ],
  },
];

const stageNodes = [
  "ToolGym",
  "Agent",
  "Assignment",
  "Evidence",
  "Claim",
  "Verifier",
  "Spore",
  "Reputation",
];

export function ProtocolDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [tab, setTab] = useState<"summary" | "lineage" | "json">("summary");
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const step = steps[activeIndex];
  const isLast = activeIndex === steps.length - 1;
  const progress = ((activeIndex + 1) / steps.length) * 100;

  const goTo = useCallback((nextIndex: number) => {
    setActiveIndex(Math.min(Math.max(nextIndex, 0), steps.length - 1));
    setTab("summary");
    setCopied(false);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(() => {
      if (isLast) {
        setIsPlaying(false);
      } else {
        goTo(activeIndex + 1);
      }
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [activeIndex, goTo, isLast, isPlaying]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") goTo(activeIndex + 1);
      if (event.key === "ArrowLeft") goTo(activeIndex - 1);
      if (event.key === "Home") goTo(0);
      if (event.key === "End") goTo(steps.length - 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, goTo]);

  const artifactJson = useMemo(
    () => JSON.stringify(step.artifact, null, 2),
    [step],
  );

  const copyDigest = async () => {
    await navigator.clipboard.writeText(step.digest);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const restart = () => {
    goTo(0);
    setIsPlaying(true);
  };

  return (
    <main className="protocol-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            DN
          </span>
          <div>
            <strong>DreamNet</strong>
            <span>Institutional Journey</span>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="fixture-status">
            <span aria-hidden="true" />
            Synthetic demonstration
          </span>
          <a
            className="icon-link"
            href="https://github.com/BrandonDucar/dreamnet-institutional-protocol"
            target="_blank"
            rel="noreferrer"
            aria-label="Open protocol repository"
            title="Open protocol repository"
          >
            <ExternalLink size={17} aria-hidden="true" />
          </a>
        </div>
      </header>

      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="workspace">
        <nav className="step-rail" aria-label="Institutional journey">
          <p className="rail-label">Journey</p>
          <ol>
            {steps.map((item, index) => (
              <li key={item.key}>
                <button
                  className={index === activeIndex ? "active" : ""}
                  onClick={() => goTo(index)}
                  aria-current={index === activeIndex ? "step" : undefined}
                >
                  <span className="step-number">
                    {index < activeIndex ? (
                      <Check size={13} aria-hidden="true" />
                    ) : (
                      String(index + 1).padStart(2, "0")
                    )}
                  </span>
                  <span>
                    <strong>{item.short}</strong>
                    <small>{item.eyebrow.split(" / ")[0]}</small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="rail-proof">
            <ShieldCheck size={18} aria-hidden="true" />
            <div>
              <strong>No external action</strong>
              <span>Fixture-only execution</span>
            </div>
          </div>
        </nav>

        <section className="stage" aria-live="polite">
          <div className="stage-heading">
            <div>
              <p className="eyebrow">{step.eyebrow}</p>
              <h1>{step.title}</h1>
              <p className="stage-summary">{step.summary}</p>
            </div>
            <div className="stage-count">
              <span>{String(activeIndex + 1).padStart(2, "0")}</span>
              <small>/ {String(steps.length).padStart(2, "0")}</small>
            </div>
          </div>

          <div className="journey-visual" aria-label="Institutional artifact flow">
            <div className="organism-label source">DreamNet organism</div>
            <div className="organism-label target">ZAO organism</div>
            <div className="flow-line">
              <span
                className="flow-progress"
                style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
              />
            </div>
            <div className="node-grid">
              {stageNodes.map((node, index) => (
                <div
                  className={`flow-node ${
                    index === activeIndex
                      ? "active"
                      : index < activeIndex
                        ? "complete"
                        : ""
                  } ${index >= 5 ? "external" : ""}`}
                  key={node}
                >
                  <span>{index < activeIndex ? <Check size={14} /> : index + 1}</span>
                  <strong>{node}</strong>
                </div>
              ))}
            </div>
            <div className="score-band">
              <div>
                <span>Capability reputation</span>
                <strong>repository-supply-chain-review</strong>
              </div>
              <div className="score-readout">
                <span className={isLast ? "previous" : ""}>500</span>
                <ArrowRight size={18} aria-hidden="true" />
                <strong className={isLast ? "earned" : ""}>
                  {isLast ? "594" : "locked"}
                </strong>
              </div>
            </div>
          </div>

          <div className="metric-grid">
            {step.metrics.map((metric) => (
              <div className="metric" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>

          <div className="decision-band">
            <FileCheck2 size={21} aria-hidden="true" />
            <div>
              <span>Trust decision</span>
              <p>{step.trustDecision}</p>
            </div>
          </div>
        </section>

        <aside className="inspector">
          <div className="inspector-heading">
            <div>
              <p className="eyebrow">ARTIFACT INSPECTOR</p>
              <h2>{step.artifactLabel}</h2>
            </div>
            <span className={`class-badge class-${step.provenance.toLowerCase()}`}>
              {step.provenance.replaceAll("_", " ")}
            </span>
          </div>

          <div className="tabs" role="tablist" aria-label="Artifact views">
            {(["summary", "lineage", "json"] as const).map((item) => (
              <button
                key={item}
                role="tab"
                aria-selected={tab === item}
                onClick={() => setTab(item)}
              >
                {item === "json" ? "JSON" : item}
              </button>
            ))}
          </div>

          <div className="inspector-content">
            {tab === "summary" && (
              <>
                <dl className="artifact-facts">
                  <div>
                    <dt>Artifact ID</dt>
                    <dd title={step.artifactId}>{compact(step.artifactId)}</dd>
                  </div>
                  <div>
                    <dt>Integrity digest</dt>
                    <dd title={step.digest}>{compact(step.digest)}</dd>
                  </div>
                </dl>
                <div className="gate-block">
                  <span>Gate</span>
                  <p>{step.gate}</p>
                </div>
                <button className="copy-button" onClick={copyDigest}>
                  {copied ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    <Clipboard size={16} aria-hidden="true" />
                  )}
                  {copied ? "Digest copied" : "Copy digest"}
                </button>
              </>
            )}

            {tab === "lineage" && (
              <dl className="lineage-list">
                {step.lineage.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd title={item.value}>{compact(item.value, 28, 12)}</dd>
                  </div>
                ))}
              </dl>
            )}

            {tab === "json" && (
              <pre className="json-view">
                <code>{artifactJson}</code>
              </pre>
            )}
          </div>

          <div className="inspector-footer">
            <span>Canonicalization</span>
            <strong>dreamnet.sorted-json.v1</strong>
          </div>
        </aside>
      </div>

      <footer className="controlbar">
        <div className="control-group">
          <button
            className="icon-button"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Previous step"
            title="Previous step"
          >
            <ArrowLeft size={19} aria-hidden="true" />
          </button>
          <button
            className="play-button"
            onClick={() => {
              if (isLast && !isPlaying) goTo(0);
              setIsPlaying((current) => !current);
            }}
          >
            {isPlaying ? (
              <Pause size={17} aria-hidden="true" />
            ) : (
              <Play size={17} aria-hidden="true" />
            )}
            {isPlaying ? "Pause journey" : isLast ? "Replay journey" : "Run journey"}
          </button>
          <button
            className="icon-button"
            onClick={() => goTo(activeIndex + 1)}
            disabled={isLast}
            aria-label="Next step"
            title="Next step"
          >
            <ArrowRight size={19} aria-hidden="true" />
          </button>
          {isLast && (
            <button
              className="icon-button reset-button"
              onClick={restart}
              aria-label="Restart journey"
              title="Restart journey"
            >
              <RotateCcw size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="step-caption">
          <span>{step.short}</span>
          <small>{Math.round(progress)}% complete</small>
        </div>

        <a
          className="download-button"
          href="/institutional-journey.json"
          download="dreamnet-institutional-journey-proof-bundle.json"
        >
          <Download size={17} aria-hidden="true" />
          Download proof bundle
        </a>
      </footer>
    </main>
  );
}
