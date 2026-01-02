import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LocationSearch from '../components/LocationSearch';
import { Map, MapMarker } from '@/components/ui/map';
import type { UnifiedLocation } from '../services/locationService';

interface FoodItem {
    name: string;
    rating: number | '';
    description: string;
}

interface ReviewForm {
    placeName: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    externalId: string;
    date: string;
    overallRating: number | '';
    cuisine: string;
    pricePerPerson: number | '';
    overallDesc: string;
    instagramUrl: string;
    tiktokUrl: string;
    foodScore: number | '';
    serviceScore: number | '';
    ambianceScore: number | '';
}

export default function AddReview() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<ReviewForm>({
        placeName: '',
        address: '',
        latitude: null,
        longitude: null,
        externalId: '',
        date: new Date().toISOString().split('T')[0],
        overallRating: '',
        cuisine: '',
        pricePerPerson: '',
        overallDesc: '',
        instagramUrl: '',
        tiktokUrl: '',
        foodScore: '',
        serviceScore: '',
        ambianceScore: ''
    });

    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);

    // Image State
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]); // URLs for preview
    const [coverIndex, setCoverIndex] = useState<number>(0);

    // Handlers
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFoodItemChange = (index: number, field: keyof FoodItem, value: string | number) => {
        const updated = [...foodItems];
        updated[index] = { ...updated[index], [field]: value };
        setFoodItems(updated);
    };

    const addFoodItem = () => {
        setFoodItems([...foodItems, { name: '', rating: '', description: '' }]);
    };

    const removeFoodItem = (index: number) => {
        setFoodItems(foodItems.filter((_, i) => i !== index));
    };

    const handleLocationSelect = (loc: UnifiedLocation) => {
        setFormData(prev => ({
            ...prev,
            // placeName: loc.name, // Don't overwrite name
            address: loc.address,
            latitude: loc.latitude,
            longitude: loc.longitude,
            externalId: loc.externalId
        }));
    };

    // Image Logic
    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            // Append to existing
            const combinedFiles = [...selectedFiles, ...newFiles];
            setSelectedFiles(combinedFiles);

            // Generate previews
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setImagePreviews([...imagePreviews, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);

        // Revoke URL to avoid memory leak
        URL.revokeObjectURL(imagePreviews[index]);

        setSelectedFiles(newFiles);
        setImagePreviews(newPreviews);

        // Adjust cover index if needed
        if (coverIndex === index) {
            setCoverIndex(0); // Reset to first if deleted
        } else if (coverIndex > index) {
            setCoverIndex(coverIndex - 1);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;
            if (!token) {
                alert("You must be logged in!");
                return;
            }

            const dataPayload = {
                ...formData,
                foodItems: foodItems.filter(f => f.name.trim() !== '') // Remove empty food items
            };

            const body = new FormData();
            body.append("reviewData", new Blob([JSON.stringify(dataPayload)], { type: "application/json" }));

            // Reorder files so cover is first
            const orderedFiles = [...selectedFiles];
            if (coverIndex > 0 && coverIndex < orderedFiles.length) {
                const cover = orderedFiles[coverIndex];
                orderedFiles.splice(coverIndex, 1);
                orderedFiles.unshift(cover);
            }

            orderedFiles.forEach(file => {
                body.append("images", file);
            });

            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                    // 'Content-Type': 'multipart/form-data' // DO NOT SET THIS MANUALLY, browse does it
                },
                body: body
            });

            if (res.ok) {
                navigate('/');
            } else {
                const text = await res.text();
                alert("Failed to save review: " + text);
            }

        } catch (err: any) {
            console.error(err);
            alert("Error: " + err.message);
        }
    };

    return (
        <div className="app-wrapper">
            <header>
                <div className="nav-buttons">
                    <Link to="/" className="btn-icon"><i className="fas fa-times"></i></Link>
                </div>
                <div className="logo">New Review</div>
                <div style={{ width: '40px' }}></div>
            </header>

            <main className="main-content" style={{ padding: '20px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* BASICS */}
                    <div style={{ background: '#fff', padding: '5px 0' }}>
                        <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>The Basics</h3>
                        <div className="form-group">
                            <label>Place Name *</label>
                            <input name="placeName" type="text" placeholder="e.g. Joe's Pizza" required value={formData.placeName} onChange={handleChange}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                        </div>

                        <div className="form-group" style={{ marginTop: '15px' }}>
                            <label>Location</label>
                            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '8px' }}>
                                Search for the location to add it to your map.
                            </p>
                            <LocationSearch
                                onLocationSelect={handleLocationSelect}
                                placeholder="Search for address..."
                            />

                            {formData.latitude && formData.longitude && (
                                <div style={{ marginTop: '10px', height: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                                    <Map
                                        center={[formData.longitude, formData.latitude]}
                                        zoom={15}
                                    >
                                        <MapMarker
                                            longitude={formData.longitude}
                                            latitude={formData.latitude}
                                        >
                                            <div className="h-4 w-4 rounded-full border-2 border-white bg-red-500 shadow-lg" />
                                        </MapMarker>
                                    </Map>
                                </div>
                            )}
                            {formData.address && <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>Selected: {formData.address}</p>}
                        </div>
                        <div className="form-group" style={{ marginTop: '15px' }}>
                            <label>Date Visited *</label>
                            <input name="date" type="date" required
                                value={formData.date} onChange={handleChange}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.9rem' }}>Cuisine</label>
                                <input name="cuisine" type="text" placeholder="e.g. Italian"
                                    value={formData.cuisine} onChange={handleChange}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.9rem' }}>Price ($)</label>
                                <input name="pricePerPerson" type="number" step="0.5" placeholder="25.00"
                                    value={formData.pricePerPerson} onChange={handleChange}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                            </div>
                        </div>
                    </div>

                    {/* RATINGS */}
                    <div>
                        <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>The Ratings</h3>
                        <div className="form-group">
                            <label>Overall Rating (0.0 - 10.0) *</label>
                            <input name="overallRating" type="number" step="0.1" min="0" max="10" required
                                value={formData.overallRating} onChange={handleChange}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#666', margin: '15px 0 5px' }}>Category Breakdown</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            {['Food', 'Service', 'Ambiance'].map(cat => {
                                const field = (cat.toLowerCase() + 'Score') as keyof ReviewForm;
                                return (
                                    <div key={cat}>
                                        <label style={{ fontSize: '0.8rem' }}>{cat}</label>
                                        <input name={field} type="number" step="0.1" min="0" max="10" placeholder="-"
                                            value={formData[field] as number | ''} onChange={handleChange}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '8px' }} />
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* DETAILS */}
                    <div>
                        <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>The Details</h3>
                        <div className="form-group">
                            <label>My Review</label>
                            <textarea name="overallDesc" rows={5} placeholder="How was the experience? What stood out?"
                                value={formData.overallDesc} onChange={handleChange}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'Inter' }}></textarea>
                        </div>
                        <div className="form-group" style={{ marginTop: '15px' }}>
                            <label>Social Links (Paste URL)</label>
                            <input name="instagramUrl" type="text" placeholder="Instagram Reel URL"
                                value={formData.instagramUrl} onChange={handleChange}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px' }} />
                            <input name="tiktokUrl" type="text" placeholder="TikTok Video URL"
                                value={formData.tiktokUrl} onChange={handleChange}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                        </div>
                    </div>

                    {/* FOOD ITEMS */}
                    <div>
                        <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Specific Dishes</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
                            {foodItems.map((item, idx) => (
                                <div key={idx} className="food-item-row" style={{ background: '#f9f9f9', padding: '15px', borderRadius: '12px', border: '1px solid #eee', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <strong style={{ color: '#555' }}>Dish #{idx + 1}</strong>
                                        <i className="fas fa-times" style={{ color: '#ccc', cursor: 'pointer' }} onClick={() => removeFoodItem(idx)}></i>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                        <input type="text" placeholder="Dish Name" required style={{ flex: 2, padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                                            value={item.name} onChange={e => handleFoodItemChange(idx, 'name', e.target.value)} />
                                        <input type="number" placeholder="Score" style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                                            value={item.rating} onChange={e => handleFoodItemChange(idx, 'rating', parseFloat(e.target.value))} />
                                    </div>
                                    <input type="text" placeholder="Brief thoughts..." style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                                        value={item.description} onChange={e => handleFoodItemChange(idx, 'description', e.target.value)} />
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addFoodItem} className="btn-outline" style={{ borderStyle: 'dashed', color: '#555' }}>
                            <i className="fas fa-plus"></i> Add a Dish
                        </button>
                    </div>

                    {/* PHOTOS */}
                    <div>
                        <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Photos</h3>
                        <div className="form-group">
                            <label>Upload Photos</label>
                            <input type="file" multiple accept="image/png, image/jpeg" onChange={handleFileSelect}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff' }} />

                            <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
                                Select multiple files. Click an image below to set it as the <strong>Cover Photo</strong>.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginTop: '15px' }}>
                                {imagePreviews.map((url, idx) => (
                                    <div key={idx} className={`preview-item ${coverIndex === idx ? 'selected' : ''}`}
                                        style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: coverIndex === idx ? '3px solid black' : '3px solid transparent' }}
                                        onClick={() => setCoverIndex(idx)}>
                                        <img src={url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        {coverIndex === idx && (
                                            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.7rem', textAlign: 'center', padding: '4px' }}>COVER</div>
                                        )}
                                        <div className="delete-badge" onClick={(e) => { e.stopPropagation(); removeImage(idx); }}>
                                            <i className="fas fa-times"></i>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-dark" style={{ width: '100%', padding: '15px', marginTop: '20px', fontSize: '1rem' }}>
                        Save Review
                    </button>
                </form>
            </main>
        </div>
    )
}

