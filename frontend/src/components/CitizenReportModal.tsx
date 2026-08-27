import React, { useState } from 'react';
import { X, MapPin, Send, Zap } from 'lucide-react';
import { submitComplaint } from '../services/api';
import type { Complaint } from '../types';

interface CitizenReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (complaint: Complaint) => void;
}

export const CitizenReportModal: React.FC<CitizenReportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Road & Potholes');
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [imageUrl, setImageUrl] = useState('');
  const [userId, setUserId] = useState('citizen_arun');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFillPreset = (presetType: string) => {
    switch (presetType) {
      case 'pothole':
        setDescription('Massive dangerous pothole near MG Road Metro pillar 120 causing severe traffic bottleneck.');
        setCategory('Road & Potholes');
        setLatitude(12.9716);
        setLongitude(77.5946);
        setImageUrl('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600');
        break;
      case 'garbage':
        setDescription('Uncollected garbage heap rotting near Ward 80 market entrance creating severe stench.');
        setCategory('Sanitation & Garbage');
        setLatitude(12.9725);
        setLongitude(77.5955);
        setImageUrl('https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600');
        break;
      case 'light':
        setDescription('Dark stretch with 4 broken streetlights near 10th Main corner. Dangerous for pedestrians at night.');
        setCategory('Street Lighting');
        setLatitude(12.9730);
        setLongitude(77.5930);
        setImageUrl('https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=600');
        break;
      case 'water':
        setDescription('Major clean water pipeline burst flooding 4th Cross Road. Thousands of liters wasting.');
        setCategory('Water & Sewage');
        setLatitude(12.9710);
        setLongitude(77.5960);
        setImageUrl('https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600');
        break;
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
      onSuccess(res.complaint);
      onClose();
    } catch {
      setLoading(false);
      alert('Error submitting report.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '1.75rem', position: 'relative', border: '1px solid var(--border-glass-bright)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Report Civic Issue</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              AI will automatically verify, cluster, and route your report to responsible authorities.
            </p>
          </div>
          <button onClick={onClose} className="glass-button" style={{ padding: '0.4rem', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Quick Presets */}
        <div style={{ marginBottom: '1.25rem', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Zap size={14} color="var(--primary-accent)" /> QUICK DEMO PRESETS:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <button type="button" onClick={() => handleFillPreset('pothole')} className="glass-button" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              🚗 MG Road Pothole
            </button>
            <button type="button" onClick={() => handleFillPreset('garbage')} className="glass-button" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              🗑️ Market Garbage Heap
            </button>
            <button type="button" onClick={() => handleFillPreset('light')} className="glass-button" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              💡 Dark Streetlights
            </button>
            <button type="button" onClick={() => handleFillPreset('water')} className="glass-button" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              💧 Water Pipe Burst
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Reporter Citizen ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Issue Description *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the issue, location details, landmarks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.85rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Category (Optional hint)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-glass)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="Road & Potholes">Road & Potholes</option>
                <option value="Sanitation & Garbage">Sanitation & Garbage</option>
                <option value="Water & Sewage">Water & Sewage</option>
                <option value="Street Lighting">Street Lighting</option>
                <option value="Public Transport">Public Transport</option>
                <option value="General Civic Issue">General Civic Issue</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Photo Evidence URL
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} /> Incident Location Coordinates
            </label>
            <button
              type="button"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setLatitude(parseFloat(pos.coords.latitude.toFixed(4)));
                      setLongitude(parseFloat(pos.coords.longitude.toFixed(4)));
                    },
                    (err) => alert('Could not retrieve device GPS: ' + err.message),
                    { enableHighAccuracy: true, timeout: 5000 }
                  );
                } else {
                  alert('Geolocation is not supported by your browser.');
                }
              }}
              className="glass-button"
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', color: 'var(--primary-accent)', borderColor: 'rgba(168, 85, 247, 0.4)' }}
            >
              📍 Detect My Live GPS
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="glass-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="glass-button btn-primary" style={{ minWidth: '130px', justifyContent: 'center' }}>
              {loading ? 'AI Processing...' : <><Send size={16} /> Submit Report</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
