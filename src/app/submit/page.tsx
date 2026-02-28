"use client";

import { useState, useRef } from 'react';
import { Send, Loader2, CheckCircle, Camera, Image as ImageIcon, X, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SubmitComplaint() {
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        contact_info: '',
    });

    // GPS State
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [gpsLoading, setGpsLoading] = useState(false);

    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setFormData(prev => ({ ...prev, location: 'Precise GPS Coordinates Captured' }));
                setGpsLoading(false);
            },
            (err) => {
                setError('Failed to get GPS location. Please type it manually.');
                setGpsLoading(false);
            }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                ...formData,
                lat: coords?.lat || null,
                lng: coords?.lng || null,
                image_url: imagePreview ? 'uploaded-local-image' : ''
            };

            const res = await fetch('/api/complaints/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to submit complaint');

            setSuccessData(data.ticket);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ position: 'relative' }}>
            <div style={{ marginBottom: '48px' }}>
                <h1 style={{ marginBottom: '16px' }}>Submit a Grievance</h1>
                <p className="text-muted">Fill out the details below to report a public issue.</p>
            </div>

            {error && (
                <div style={{ background: '#FDECEA', color: '#B42318', padding: '16px', marginBottom: '32px', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="title">Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        className="form-control"
                        placeholder="e.g. Large pothole on Main Street"
                        required
                        value={formData.title}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="description">Detailed Description</label>
                    <textarea
                        id="description"
                        name="description"
                        className="form-control"
                        placeholder="Describe the issue in detail..."
                        required
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="location">Location</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            className="form-control"
                            style={{ flex: 1 }}
                            placeholder="Address, landmark, or auto-detect"
                            required
                            value={formData.location}
                            onChange={handleChange}
                        />
                        <button type="button" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px' }} onClick={detectLocation} disabled={gpsLoading}>
                            {gpsLoading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                            {gpsLoading ? 'Detecting...' : 'Auto Detect'}
                        </button>
                    </div>
                    {coords && <div style={{ fontSize: '12px', color: 'var(--primary-accent)', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>✓ GPS Coordinates locked ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})</div>}
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="contact_info">Contact Email / Phone</label>
                    <input
                        type="text"
                        id="contact_info"
                        name="contact_info"
                        className="form-control"
                        placeholder="For updates on your ticket"
                        required
                        value={formData.contact_info}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '40px' }}>
                    <label className="form-label" style={{ marginBottom: '16px' }}>Photo Evidence (Optional)</label>

                    <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: 'none' }} onChange={handleImageChange} />
                    <input type="file" accept="image/*" ref={galleryInputRef} style={{ display: 'none' }} onChange={handleImageChange} />

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-outline" onClick={() => cameraInputRef.current?.click()}>
                            <Camera size={18} /> Open Camera
                        </button>
                        <button type="button" className="btn btn-outline" onClick={() => galleryInputRef.current?.click()}>
                            <ImageIcon size={18} /> Upload from Gallery
                        </button>
                    </div>

                    {imagePreview && (
                        <div style={{ marginTop: '24px', position: 'relative', display: 'inline-block' }}>
                            <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                            <button
                                type="button"
                                onClick={() => setImagePreview(null)}
                                style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'white', border: '1px solid var(--border-light)', borderRadius: '50%', padding: '4px', display: 'flex' }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'flex-start' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '12px 24px', fontSize: '16px' }}>
                        {loading ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : <><Send size={18} /> Submit Complaint</>}
                    </button>
                </div>
            </form>

            <AnimatePresence>
                {successData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            zIndex: 2000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '24px'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            style={{
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-light)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                                padding: '48px 32px',
                                borderRadius: '16px',
                                textAlign: 'center',
                                maxWidth: '500px',
                                width: '100%',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Map Pulse Animation Effect underneath the checkmark */}
                            {coords && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0.8 }}
                                    animate={{ scale: 4, opacity: 0 }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                                    style={{
                                        position: 'absolute',
                                        top: '64px',
                                        left: '50%',
                                        marginLeft: '-25px',
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--primary-accent)',
                                        zIndex: 0
                                    }}
                                />
                            )}

                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                style={{ position: 'relative', zIndex: 1 }}
                            >
                                <CheckCircle size={72} style={{ margin: '0 auto 24px', color: 'var(--primary-accent)', backgroundColor: 'white', borderRadius: '50%' }} />
                            </motion.div>

                            <h2 style={{ fontSize: '28px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>Incident Registered</h2>
                            <p style={{ color: 'var(--fg-secondary)', marginBottom: '8px', position: 'relative', zIndex: 1 }}>{coords ? 'Zone map and risk engine updated live.' : 'Your grievance has been successfully classified.'}</p>

                            <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', marginTop: '32px', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                                <p style={{ fontSize: '14px', color: 'var(--fg-secondary)', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>TICKET ID</p>
                                <p style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>{successData.id.split('-')[0].toUpperCase()}</p>

                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                                    <span className="badge badge-submitted">Status: {successData.status}</span>
                                    <span className="badge badge-gray">{successData.category}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
                                <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px' }} onClick={() => {
                                    setSuccessData(null);
                                    window.location.href = '/';
                                }}>
                                    Return to Home
                                </button>
                                <button className="btn btn-outline" style={{ width: '100%', padding: '14px', fontSize: '16px', border: 'none' }} onClick={() => {
                                    setSuccessData(null);
                                    setFormData({ title: '', description: '', location: '', contact_info: '' });
                                    setImagePreview(null);
                                    setCoords(null);
                                }}>
                                    File another issue
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
