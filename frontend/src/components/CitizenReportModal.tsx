import React, { useState } from 'react';
import { X, MapPin, Send, Upload, Check, Loader2 } from 'lucide-react';
import { submitComplaint, uploadEvidenceFile } from '../services/api';
import type { Complaint } from '../types';

interface CitizenReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (complaint: Complaint) => void;
}

const PRESETS = [
  { key: 'pothole',  label: 'Pothole',          category: 'Road & Potholes',      lat: 12.9716, lng: 77.5946, desc: 'Massive dangerous pothole near MG Road Metro pillar 120 causing severe traffic bottleneck.',       img: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600' },
  { key: 'garbage',  label: 'Market Garbage',    category: 'Sanitation & Garbage', lat: 12.9725, lng: 77.5955, desc: 'Uncollected garbage heap rotting near Ward 80 market entrance creating severe stench.',             img: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600' },
  { key: 'light',    label: 'Broken Streetlights', category: 'Street Lighting',   lat: 12.9730, lng: 77.5930, desc: 'Dark stretch with 4 broken streetlights near 10th Main corner. Dangerous for pedestrians at night.', img: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=600' },
  { key: 'water',    label: 'Water Pipe Burst',  category: 'Water & Sewage',       lat: 12.9710, lng: 77.5960, desc: 'Major clean water pipeline burst flooding 4th Cross Road. Thousands of liters wasting.',             img: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--surface)',
  border: '1px solid var(--border-strong)',
  padding: '8px 10px',
  borderRadius: '0',
  color: 'var(--text-primary)',
  fontSize: '13px',
  fontFamily: 'Inter, system-ui, sans-serif',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px', fontWeight: 700,
  color: 'var(--text-tertiary)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: '6px',
};

export const CitizenReportModal: React.FC<CitizenReportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [description, setDescription]   = useState('');
  const [category, setCategory]         = useState('Road & Potholes');
  const [latitude, setLatitude]         = useState(12.9716);
  const [longitude, setLongitude]       = useState(77.5946);
  const [imageUrl, setImageUrl]         = useState('');
  const [userId, setUserId]             = useState('citizen_arun');
  const [loading, setLoading]           = useState(false);
  const [uploadingGcp, setUploadingGcp] = useState(false);

  if (!isOpen) return null;

  const handlePreset = (p: typeof PRESETS[0]) => {
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
      if (gcsUrl) { setImageUrl(gcsUrl); }
      else { alert('Could not upload image to storage.'); }
    } catch { alert('Error uploading file.'); }
    finally { setUploadingGcp(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true);
    try {
      const res = await submitComplaint({ userId, description, category, latitude, longitude, imageUrls: imageUrl ? [imageUrl] : [] });
      setLoading(false);
      if (res?.complaint) onSuccess(res.complaint);
      onClose();
    } catch {
      setLoading(false);
      alert('Error submitting report.');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        width: '100%', maxWidth: '580px',
        background: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: '0',
        boxShadow: 'var(--shadow-lg)',
        fontFamily: 'Inter, system-ui, sans-serif',
        maxHeight: '92vh', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <span style={{
              display: 'inline-block', marginBottom: '6px',
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--text-tertiary)',
              background: 'var(--bg-subtle)', border: '1px solid var(--border)',
              padding: '2px 8px',
            }}>
              Citizen Report
            </span>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Report a Civic Issue
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 400 }}>
              AI will aggregate, cluster, and route your report to responsible authorities.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', flexShrink: 0,
              background: 'none', border: '1px solid var(--border)',
              cursor: 'pointer', color: 'var(--text-tertiary)',
              borderRadius: '0', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; }}
          >
            <X style={{ width: '13px', height: '13px' }} />
          </button>
        </div>

        {/* Quick Presets */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
            Sample Issues
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePreset(p)}
                style={{
                  fontSize: '11px', fontWeight: 500,
                  padding: '4px 10px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-secondary)',
                  borderRadius: '0', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Reporter ID */}
          <div>
            <label style={labelStyle}>Reporter Citizen ID</label>
            <input
              type="text" value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Issue Description *</label>
            <textarea
              required rows={3}
              placeholder="Describe the issue, location details, landmarks…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, lineHeight: '1.6', resize: 'vertical' }}
            />
          </div>

          {/* Category + Photo row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={inputStyle}
              >
                <option>Road &amp; Potholes</option>
                <option>Sanitation &amp; Garbage</option>
                <option>Water &amp; Sewage</option>
                <option>Street Lighting</option>
                <option>Public Transport</option>
                <option>General Civic Issue</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Photo Evidence</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="url"
                  placeholder="https://… or upload"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                />
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '0 10px', flexShrink: 0,
                  background: 'var(--surface)', border: '1px solid var(--border-strong)',
                  color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600,
                  cursor: 'pointer', borderRadius: '0', whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}>
                  {uploadingGcp
                    ? <Loader2 style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} />
                    : <Upload style={{ width: '12px', height: '12px' }} />
                  }
                  {uploadingGcp ? 'Uploading…' : 'Upload'}
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>

              {imageUrl && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginTop: '6px', padding: '6px 8px',
                  background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                }}>
                  <img
                    src={imageUrl} alt="Evidence preview"
                    style={{ width: '52px', height: '36px', objectFit: 'cover', border: '1px solid var(--border)' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600'; }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                    <Check style={{ width: '11px', height: '11px' }} /> Image ready
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ ...labelStyle, marginBottom: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin style={{ width: '11px', height: '11px' }} /> Location Coordinates
              </label>
              <button
                type="button"
                style={{
                  fontSize: '11px', fontWeight: 500,
                  padding: '3px 8px',
                  background: 'none', border: '1px solid var(--border-strong)',
                  color: 'var(--text-secondary)', borderRadius: '0',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setLatitude(parseFloat(pos.coords.latitude.toFixed(4)));
                        setLongitude(parseFloat(pos.coords.longitude.toFixed(4)));
                      },
                      (err) => alert('GPS error: ' + err.message),
                      { enableHighAccuracy: true, timeout: 5000 }
                    );
                  }
                }}
              >
                📍 Use my GPS
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="number" step="0.0001" placeholder="Latitude"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                style={inputStyle}
              />
              <input
                type="number" step="0.0001" placeholder="Longitude"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Footer actions */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '8px',
            paddingTop: '12px', borderTop: '1px solid var(--border)',
          }}>
            <button
              type="button" onClick={onClose}
              style={{
                padding: '7px 16px', background: 'var(--surface)',
                border: '1px solid var(--border-strong)', color: 'var(--text-secondary)',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer', borderRadius: '0',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingGcp}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 18px',
                background: (loading || uploadingGcp) ? 'var(--bg-subtle)' : 'var(--text-primary)',
                border: '1px solid transparent',
                color: (loading || uploadingGcp) ? 'var(--text-tertiary)' : 'var(--surface)',
                fontSize: '12px', fontWeight: 600, cursor: (loading || uploadingGcp) ? 'not-allowed' : 'pointer',
                borderRadius: '0', transition: 'all 0.15s',
                opacity: (loading || uploadingGcp) ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (!loading && !uploadingGcp) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
              onMouseLeave={e => { if (!loading && !uploadingGcp) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            >
              {loading
                ? <><Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> Processing…</>
                : <><Send style={{ width: '13px', height: '13px' }} /> Submit Report</>
              }
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
