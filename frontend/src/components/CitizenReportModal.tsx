import React, { useState } from "react";
import { X, MapPin, Send, Zap, Cloud, Upload, Check } from "lucide-react";
import { submitComplaint, uploadEvidenceFile } from "../services/api";
import type { Complaint } from "../types";

interface CitizenReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (complaint: Complaint) => void;
}

const PRESETS = [
  {
    key: "pothole",
    label: "Pothole",
    category: "Road & Potholes",
    lat: 12.9716,
    lng: 77.5946,
    desc: "Massive dangerous pothole near MG Road Metro pillar 120 causing severe traffic bottleneck.",
    img: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600",
  },
  {
    key: "garbage",
    label: "Market Garbage",
    category: "Sanitation & Garbage",
    lat: 12.9725,
    lng: 77.5955,
    desc: "Uncollected garbage heap rotting near Ward 80 market entrance creating severe stench.",
    img: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600",
  },
  {
    key: "light",
    label: "Dark Streetlights",
    category: "Street Lighting",
    lat: 12.973,
    lng: 77.593,
    desc: "Dark stretch with 4 broken streetlights near 10th Main corner. Dangerous for pedestrians at night.",
    img: "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=600",
  },
  {
    key: "water",
    label: "Water Pipe Burst",
    category: "Water & Sewage",
    lat: 12.971,
    lng: 77.596,
    desc: "Major clean water pipeline burst flooding 4th Cross Road. Thousands of liters wasting.",
    img: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600",
  },
];

export const CitizenReportModal: React.FC<CitizenReportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Road & Potholes");
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [imageUrl, setImageUrl] = useState("");
  const [userId, setUserId] = useState("citizen_arun");
  const [loading, setLoading] = useState(false);
  const [uploadingGcp, setUploadingGcp] = useState(false);

  if (!isOpen) return null;

  const handlePreset = (p: (typeof PRESETS)[0]) => {
    setDescription(p.desc);
    setCategory(p.category);
    setLatitude(p.lat);
    setLongitude(p.lng);
    setImageUrl(p.img);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGcp(true);
    try {
      const gcsUrl = await uploadEvidenceFile(file);
      if (gcsUrl) {
        setImageUrl(gcsUrl);
      } else {
        alert("Could not upload image to Google Cloud Storage.");
      }
    } catch {
      alert("Error uploading file to GCP.");
    } finally {
      setUploadingGcp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    try {
      const res = await submitComplaint({
        userId,
        description,
        category,
        latitude,
        longitude,
        imageUrls: imageUrl ? [imageUrl] : [],
      });
      setLoading(false);
      if (res && res.complaint) {
        onSuccess(res.complaint);
      }
      onClose();
    } catch {
      setLoading(false);
      alert("Error submitting report.");
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
          maxWidth: "620px",
          padding: "1.75rem",
          background: "#ffffff",
          color: "#0f172a",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "1rem",
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
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(17, 17, 17, 0.12)",
              }}
            >
              <MapPin size={18} />
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
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#6b7280",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "999px",
                  }}
                >
                  Civic report
                </span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#111827",
                    background: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "999px",
                  }}
                >
                  GCP verified
                </span>
              </div>

              <h2
                style={{
                  marginTop: "0.35rem",
                  fontSize: "1.45rem",
                  fontWeight: 700,
                  color: "#111827",
                  fontFamily: "DM Sans, sans-serif",
                  letterSpacing: "-0.03em",
                }}
              >
                Report Civic Issue
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
            marginBottom: "1.25rem",
            background: "#fafafa",
            padding: "0.75rem 0.9rem",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "#64748b",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <Zap size={13} color="#111827" /> Sample issues
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                style={{
                  fontSize: "0.76rem",
                  padding: "0.35rem 0.7rem",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  color: "#1f2937",
                  borderRadius: "6px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
                onClick={() => handlePreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
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
              Reporter citizen ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{
                width: "100%",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                padding: "0.6rem 0.85rem",
                borderRadius: "8px",
                color: "#0f172a",
                fontSize: "0.88rem",
                fontWeight: 500,
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
              Issue description
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the issue, location details, landmarks, or any visible condition..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.9rem",
            }}
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
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "8px",
                  color: "#0f172a",
                  fontSize: "0.88rem",
                }}
              >
                <option>Road & Potholes</option>
                <option>Sanitation & Garbage</option>
                <option>Water & Sewage</option>
                <option>Street Lighting</option>
                <option>Public Transport</option>
                <option>General Civic Issue</option>
              </select>
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
                Photo evidence
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
                    placeholder="https://... or upload image"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    style={{
                      flex: 1,
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "8px",
                      color: "#0f172a",
                      fontSize: "0.82rem",
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
                    <span>
                      {uploadingGcp ? "Uploading..." : "Upload image"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>

                {imageUrl && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginTop: "0.3rem",
                      background: "#f8fafc",
                      padding: "0.35rem 0.5rem",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt="Uploaded Preview"
                      style={{
                        width: "60px",
                        height: "42px",
                        objectFit: "cover",
                        borderRadius: "4px",
                        border: "1px solid #cbd5e1",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600";
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "#16a34a",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.2rem",
                      }}
                    >
                      <Check size={12} /> Image ready for report
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.4rem",
              }}
            >
              <label
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                <MapPin
                  size={12}
                  style={{ display: "inline", marginRight: "4px" }}
                />
                Location coordinates
              </label>

              <button
                type="button"
                style={{
                  fontSize: "0.72rem",
                  padding: "0.25rem 0.55rem",
                  color: "#111827",
                  background: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setLatitude(parseFloat(pos.coords.latitude.toFixed(4)));
                        setLongitude(
                          parseFloat(pos.coords.longitude.toFixed(4)),
                        );
                      },
                      (err) => alert("GPS error: " + err.message),
                      { enableHighAccuracy: true, timeout: 5000 },
                    );
                  }
                }}
              >
                <MapPin size={12} />
                Use my GPS
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.9rem",
              }}
            >
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "8px",
                  color: "#0f172a",
                  fontSize: "0.88rem",
                }}
                placeholder="Latitude"
              />
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "8px",
                  color: "#0f172a",
                  fontSize: "0.88rem",
                }}
                placeholder="Longitude"
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              paddingTop: "1rem",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                color: "#334155",
                fontSize: "0.85rem",
                fontWeight: 600,
                padding: "0.5rem 1.1rem",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingGcp}
              style={{
                background: "#111111",
                border: "1px solid #111111",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 600,
                padding: "0.55rem 1.3rem",
                borderRadius: "8px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <Send size={15} /> Submit report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
