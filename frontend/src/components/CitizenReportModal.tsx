import React, { useState } from 'react';
import { X, MapPin, Send, Zap } from 'lucide-react';
import { submitComplaint } from '../services/api';
import type { Complaint } from '../types';

interface CitizenReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (complaint: Complaint) => void;
}

const PRESETS = [
  { key: 'pothole', label: '🚗 MG Road Pothole', category: 'Road & Potholes', lat: 12.9716, lng: 77.5946, desc: 'Massive dangerous pothole near MG Road Metro pillar 120 causing severe traffic bottleneck.', img: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600' },
  { key: 'garbage', label: '🗑️ Market Garbage', category: 'Sanitation & Garbage', lat: 12.9725, lng: 77.5955, desc: 'Uncollected garbage heap rotting near Ward 80 market entrance creating severe stench.', img: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600' },
  { key: 'light', label: '💡 Dark Streetlights', category: 'Street Lighting', lat: 12.9730, lng: 77.5930, desc: 'Dark stretch with 4 broken streetlights near 10th Main corner. Dangerous for pedestrians at night.', img: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=600' },
  { key: 'water', label: '💧 Water Pipe Burst', category: 'Water & Sewage', lat: 12.9710, lng: 77.5960, desc: 'Major clean water pipeline burst flooding 4th Cross Road. Thousands of liters wasting.', img: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600' },
];

export const CitizenReportModal: React.FC<CitizenReportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Road & Potholes');
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [imageUrl, setImageUrl] = useState('');
  const [userId, setUserId] = useState('citizen_arun');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePreset = (p: typeof PRESETS[0]) => {
    setDescription(p.desc);
    setCategory(p.category);
    setLatitude(p.lat);
    setLongitude(p.lng);
    setImageUrl(p.img);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true);
    try {
      const res = await submitComplaint({ userId, description, category, latitude, longitude, imageUrls: imageUrl ? [imageUrl] : [] });
      setLoading(false);
      onSuccess(res.complaint);
      onClose();
    } catch {
      setLoading(false);
      alert('Error submitting report.');
    }
  };

  return (
    <div className="modal-overlay">
      <div style={{
        width: '100%',
        maxWidth: '580px',
        background: 'var(--white)',
        border: '1px solid var(--border-strong)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 400, letterSpacing: '-0.03em' }}>Report Civic Issue</h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 300, marginTop: '0.15rem' }}>
              AI will verify, cluster, and route your report to the responsible authority.
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.3rem' }}>
            <X size={16} />
          </button>
        </div>

        {/* Quick Presets */}
        <div style={{
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
        }}>
          <div style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}>
            <Zap size={11} />
            Quick Presets
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {PRESETS.map((p) => (
              <button key={p.key} type="button" onClick={() => handlePreset(p)} className="btn btn-sm">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div>
            <label className="form-label">Citizen ID</label>
            <input type="text" value={userId} onChange={e => setUserId(e.target.value)} className="form-input" />
          </div>

          <div>
            <label className="form-label">Issue Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Describe the issue, location details, landmarks..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="form-textarea form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="form-label">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="form-select form-input">
                <option>Road & Potholes</option>
                <option>Sanitation & Garbage</option>
                <option>Water & Sewage</option>
                <option>Street Lighting</option>
                <option>Public Transport</option>
                <option>General Civic Issue</option>
              </select>
            </div>
            <div>
              <label className="form-label">Photo Evidence URL</label>
              <input type="url" placeholder="https://..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="form-input" />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                <MapPin size={10} style={{ display: 'inline', marginRight: '3px' }} />
                Location Coordinates
              </label>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      pos => { setLatitude(parseFloat(pos.coords.latitude.toFixed(4))); setLongitude(parseFloat(pos.coords.longitude.toFixed(4))); },
                      err => alert('GPS error: ' + err.message),
                      { enableHighAccuracy: true, timeout: 5000 }
                    );
                  }
                }}
              >
                📍 Use my GPS
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <input type="number" step="0.0001" value={latitude} onChange={e => setLatitude(parseFloat(e.target.value))} className="form-input" placeholder="Latitude" />
              <input type="number" step="0.0001" value={longitude} onChange={e => setLongitude(parseFloat(e.target.value))} className="form-input" placeholder="Longitude" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" onClick={onClose} className="btn">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-dark" style={{ minWidth: '130px', justifyContent: 'center' }}>
              {loading ? 'Processing...' : <><Send size={14} /> Submit Report</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
