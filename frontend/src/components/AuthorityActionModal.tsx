import React, { useState } from "react";
import type { Incident } from "../types";
import {
  X,
  CheckCircle,
  Upload,
  Shield,
  Clock,
  AlertCircle,
  Cloud,
  Check,
  RefreshCw,
} from "lucide-react";
import {
  acknowledgeIncident,
  submitResolution,
  simulateSLABreach,
  uploadEvidenceFile,
} from "../services/api";

interface AuthorityActionModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const AuthorityActionModal: React.FC<AuthorityActionModalProps> = ({
  incident,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [notes, setNotes] = useState("");
  const [resolutionEvidenceUrl, setResolutionEvidenceUrl] = useState(
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600",
  );
  const [loading, setLoading] = useState(false);
  const [uploadingGcp, setUploadingGcp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !incident) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGcp(true);
    try {
      const gcsUrl = await uploadEvidenceFile(file);
      if (gcsUrl) {
        setResolutionEvidenceUrl(gcsUrl);
      } else {
        alert("Could not upload evidence image to Google Cloud Storage.");
      }
    } catch {
      alert("Error uploading file to GCP.");
    } finally {
      setUploadingGcp(false);
    }
  };

  const handleAcknowledge = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await acknowledgeIncident(
        incident.id,
        incident.authorityId,
        notes.trim() || "Work order created by municipal officer.",
      );
      onRefresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to acknowledge incident.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSLA = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await simulateSLABreach(incident.id);
      onRefresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to trigger SLA breach simulation.");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await submitResolution(
        incident.id,
        incident.authorityId,
        notes.trim() ||
          "Resolution evidence verified & submitted by municipal officer.",
        resolutionEvidenceUrl ? [resolutionEvidenceUrl] : [],
      );
      if (res) {
        onRefresh();
        onClose();
      } else {
        setErrorMsg("Resolution submission failed.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Error submitting resolution.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "580px",
          background: "#ffffff",
          color: "#0f172a",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
          padding: "1.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                background: "#111111",
                border: "1px solid #1f2937",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(17, 17, 17, 0.12)",
              }}
            >
              <Shield size={18} />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "999px",
                  }}
                >
                  {incident.authorityId.replace(/_/g, " ")}
                </span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#111827",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    background: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "999px",
                  }}
                >
                  Verified
                </span>
              </div>

              <h2
                style={{
                  marginTop: "0.35rem",
                  fontSize: "1.42rem",
                  fontWeight: 700,
                  color: "#111827",
                  fontFamily: "DM Sans, sans-serif",
                  letterSpacing: "-0.03em",
                }}
              >
                Authority Officer Action
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              padding: "0.45rem",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            padding: "0.9rem 1rem",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            background: "#fafafa",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              fontSize: "0.92rem",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: "0.3rem",
            }}
          >
            {incident.title}
          </div>
          <div
            style={{
              fontSize: "0.78rem",
              color: "#64748b",
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <span>
              Impact score: <strong>{incident.impactScore}</strong> / 100
            </span>
            <span>
              Reports: <strong>{incident.uniqueCitizenCount}</strong>
            </span>
            <span>
              Escalation: <strong>L{incident.escalationLevel}</strong>
            </span>
          </div>

          <div
            style={{
              marginTop: "0.5rem",
              fontSize: "0.76rem",
              color: "#475569",
            }}
          >
            Incident reference:{" "}
            <span
              style={{
                fontFamily: "monospace",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              {incident.id}
            </span>
          </div>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "0.4rem",
              }}
            >
              Action notes / inspection findings
            </label>
            <textarea
              rows={3}
              placeholder="Enter resolution notes, contractor instructions, or completion findings..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                padding: "0.6rem 0.85rem",
                borderRadius: "8px",
                color: "#0f172a",
                fontSize: "0.88rem",
                lineHeight: 1.5,
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "0.4rem",
              }}
            >
              Resolution photo evidence
            </label>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
              }}
            >
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <input
                  type="url"
                  placeholder="https://... or upload below"
                  value={resolutionEvidenceUrl}
                  onChange={(e) => setResolutionEvidenceUrl(e.target.value)}
                  style={{
                    flex: 1,
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    color: "#0f172a",
                    fontSize: "0.85rem",
                  }}
                />
                <label
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#0f172a",
                    cursor: "pointer",
                    fontSize: "0.76rem",
                    fontWeight: 600,
                    padding: "0.4rem 0.75rem",
                    borderRadius: "8px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {uploadingGcp ? (
                    <Upload size={13} className="animate-spin" />
                  ) : (
                    <Cloud size={13} color="#111827" />
                  )}
                  <span>{uploadingGcp ? "Uploading..." : "Upload image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {resolutionEvidenceUrl &&
                (resolutionEvidenceUrl.includes("storage.googleapis.com") ||
                  resolutionEvidenceUrl.includes("evidence_id")) && (
                  <span
                    style={{
                      fontSize: "0.74rem",
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontWeight: 600,
                    }}
                  >
                    <Check size={12} /> Stored on Google Cloud Storage bucket
                  </span>
                )}
            </div>
          </div>

          {errorMsg && (
            <div
              style={{
                padding: "0.6rem 0.8rem",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                color: "#991b1b",
                fontSize: "0.78rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <AlertCircle size={14} color="#dc2626" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "1rem",
              borderTop: "1px solid #f1f5f9",
              marginTop: "0.5rem",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={handleSimulateSLA}
              disabled={loading || uploadingGcp}
              style={{
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                color: "#be123c",
                fontSize: "0.78rem",
                fontWeight: 600,
                padding: "0.5rem 0.85rem",
                borderRadius: "8px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <Clock size={13} /> Simulate SLA breach
            </button>

            <div style={{ display: "flex", gap: "0.6rem" }}>
              {incident.status === "OPEN" && (
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  disabled={loading || uploadingGcp}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#334155",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    cursor: loading || uploadingGcp ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw
                        size={13}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      <span>Acknowledging...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={13} />
                      <span>Acknowledge work</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleResolve}
                disabled={loading || uploadingGcp}
                style={{
                  background: loading ? "#334155" : "#111111",
                  border: "1px solid #111111",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  padding: "0.55rem 1.25rem",
                  borderRadius: "8px",
                  cursor: loading || uploadingGcp ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    <span>Verifying & resolving...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Verify & resolve</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
