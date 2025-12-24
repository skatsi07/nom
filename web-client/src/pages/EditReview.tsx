import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface FoodItem {
    id?: number;
    name: string;
    rating: number | '';
    description: string;
}

interface ExistingPhoto {
    id: number;
    photoUrl: string;
    photoOrder: number;
}

interface ReviewForm {
    placeName: string;
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

export default function EditReview() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState<ReviewForm>({
        placeName: '',
        date: '',
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

    // Photo State
    const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
    const [deletedPhotoIds, setDeletedPhotoIds] = useState<number[]>([]);

    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [newPreviews, setNewPreviews] = useState<string[]>([]);

    // Cover Logic: 'existing' | 'new' | 'none'
    const [coverType, setCoverType] = useState<'existing' | 'new' | 'none'>('none');
    const [coverIdOrIndex, setCoverIdOrIndex] = useState<number>(-1);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const { data: session } = await supabase.auth.getSession();
                const token = session.session?.access_token;
                const headers: HeadersInit = {}
                if (token) headers['Authorization'] = `Bearer ${token}`

                const res = await fetch(`/api/reviews/${id}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        placeName: data.placeName,
                        date: data.date,
                        overallRating: data.overallRating,
                        cuisine: data.cuisine,
                        pricePerPerson: data.pricePerPerson,
                        overallDesc: data.overallDesc,
                        instagramUrl: data.instagramUrl || '',
                        tiktokUrl: data.tiktokUrl || '',
                        foodScore: data.foodScore || '',
                        serviceScore: data.serviceScore || '',
                        ambianceScore: data.ambianceScore || ''
                    });
                    setFoodItems(data.foodItems || []);
                    setExistingPhotos(data.photos || []);

                    // Mark first existing as cover by default if exists
                    if (data.photos && data.photos.length > 0) {
                        setCoverType('existing');
                        setCoverIdOrIndex(data.photos[0].id);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReview();
    }, [id]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFoodChange = (index: number, field: keyof FoodItem, value: string | number) => {
        const updated = [...foodItems];
        updated[index] = { ...updated[index], [field]: value };
        setFoodItems(updated);
    }
    const addFoodItem = () => setFoodItems([...foodItems, { name: '', rating: '', description: '' }]);
    const removeFoodItem = (index: number) => setFoodItems(foodItems.filter((_, i) => i !== index));

    // Existing Photos
    const deleteExistingPhoto = (photoId: number) => {
        setDeletedPhotoIds(prev => [...prev, photoId]);
        // Remove from view
        setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
        // Reset cover if deleted
        if (coverType === 'existing' && coverIdOrIndex === photoId) {
            setCoverType('none');
            setCoverIdOrIndex(-1);
        }
    };

    const selectExistingCover = (photoId: number) => {
        setCoverType('existing');
        setCoverIdOrIndex(photoId);
    };

    // New Photos
    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setNewFiles([...newFiles, ...files]);
            const previews = files.map(f => URL.createObjectURL(f));
            setNewPreviews([...newPreviews, ...previews]);
        }
    };

    const removeNewPhoto = (index: number) => {
        const updatedFiles = newFiles.filter((_, i) => i !== index);
        const updatedPreviews = newPreviews.filter((_, i) => i !== index);
        URL.revokeObjectURL(newPreviews[index]);
        setNewFiles(updatedFiles);
        setNewPreviews(updatedPreviews);

        if (coverType === 'new') {
            if (coverIdOrIndex === index) {
                setCoverType('none');
                setCoverIdOrIndex(-1);
            } else if (coverIdOrIndex > index) {
                setCoverIdOrIndex(coverIdOrIndex - 1);
            }
        }
    };

    const selectNewCover = (index: number) => {
        setCoverType('new');
        setCoverIdOrIndex(index);
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;
            if (!token) return;

            const dataPayload = {
                ...formData,
                foodItems: foodItems.filter(f => f.name.trim() !== '')
            };

            const body = new FormData();
            body.append("reviewData", new Blob([JSON.stringify(dataPayload)], { type: "application/json" }));

            if (deletedPhotoIds.length > 0) {
                // Endpoint expects comma separated string
                // But wait, my endpoint expects @RequestParam("deletedPhotoIds") String
                // I need to check how to append params vs body parts.
                // It's a RequestParam in PUT? 
                // @RequestParam(value = "deletedPhotoIds", required = false) String deletedPhotoIdsStr
                // In FormData, all fields are parts? Or I should add it to query string?
                // Spring Multipart resolution usually handles parts as params if not mapped to @RequestPart.
                // Safest is to append to URL or body. Let's append to body.
                body.append("deletedPhotoIds", deletedPhotoIds.join(","));
            }

            // Cover Photo Logic
            if (coverType === 'existing') {
                body.append("coverPhotoId", coverIdOrIndex.toString());
            } else if (coverType === 'new') {
                body.append("coverNewFileIndex", coverIdOrIndex.toString());
            }

            // Append New Files
            newFiles.forEach(file => body.append("newImages", file));

            const res = await fetch(`/api/reviews/${id}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` },
                body: body
            });

            if (res.ok) {
                navigate('/manage-reviews');
            } else {
                alert("Update failed");
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="app-wrapper">
            <header>
                <div className="nav-buttons">
                    <Link to="/manage-reviews" className="btn-icon" style={{ width: 'auto', fontSize: '1rem', textDecoration: 'none' }}>Cancel</Link>
                </div>
                <div className="logo">Edit Review</div>
                <div style={{ width: '40px' }}></div>
            </header>

            <main className="main-content" style={{ padding: '20px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* BASICS */}
                    <div style={{ background: '#fff', padding: '5px 0' }}>
                        <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Edit Review</h3>
                        <div className="form-group">
                            <label>Place Name *</label>
                            <input name="placeName" type="text" required value={formData.placeName} onChange={handleChange}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                        </div>
                        <div className="form-group" style={{ marginTop: '15px' }}>
                            <label>Date Visited *</label>
                            <input name="date" type="date" required value={formData.date} onChange={handleChange}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.9rem' }}>Cuisine</label>
                                <input name="cuisine" type="text" value={formData.cuisine} onChange={handleChange}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.9rem' }}>Price ($)</label>
                                <input name="pricePerPerson" type="number" step="0.5" value={formData.pricePerPerson} onChange={handleChange}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                            </div>
                        </div>
                    </div>

                    {/* RATINGS */}
                    <div>
                        <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>The Ratings</h3>
                        <div className="form-group">
                            <label>Overall Rating *</label>
                            <input name="overallRating" type="number" step="0.1" min="0" max="10" required value={formData.overallRating} onChange={handleChange}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
                            {['Food', 'Service', 'Ambiance'].map(cat => {
                                const field = (cat.toLowerCase() + 'Score') as keyof ReviewForm;
                                return (
                                    <div key={cat}>
                                        <label style={{ fontSize: '0.8rem' }}>{cat}</label>
                                        <input name={field} type="number" step="0.1" min="0" max="10" value={formData[field]} onChange={handleChange}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '8px' }} />
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* DETAILS */}
                    <div>
                        <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Details</h3>
                        <div className="form-group">
                            <textarea name="overallDesc" rows={5} value={formData.overallDesc} onChange={handleChange}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'Inter' }}></textarea>
                        </div>
                        <div className="form-group" style={{ marginTop: '15px' }}>
                            <input name="instagramUrl" type="text" placeholder="Instagram URL" value={formData.instagramUrl} onChange={handleChange}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px' }} />
                            <input name="tiktokUrl" type="text" placeholder="TikTok URL" value={formData.tiktokUrl} onChange={handleChange}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                        </div>
                    </div>

                    {/* DISHES */}
                    <div>
                        <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Specific Dishes</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
                            {foodItems.map((item, idx) => (
                                <div key={idx} className="food-item-row" style={{ background: '#f0f0f0', padding: '15px', borderRadius: '12px', border: '1px solid #ddd' }}>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                        <input type="text" value={item.name} onChange={e => handleFoodChange(idx, 'name', e.target.value)}
                                            style={{ flex: 2, padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                                        <input type="number" step="0.1" value={item.rating} onChange={e => handleFoodChange(idx, 'rating', e.target.value)}
                                            style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                                    </div>
                                    <input type="text" value={item.description} onChange={e => handleFoodChange(idx, 'description', e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />

                                    <button type="button" onClick={() => removeFoodItem(idx)} style={{ marginTop: '5px', color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Remove</button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addFoodItem} className="btn-outline" style={{ borderStyle: 'dashed', color: '#555' }}>
                            <i className="fas fa-plus"></i> Add New Dish
                        </button>
                    </div>

                    {/* PHOTOS */}
                    <div>
                        <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Photos</h3>
                        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '10px' }}>Existing Photos</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                            {existingPhotos.map(photo => (
                                <div key={photo.id} className={`preview-item ${coverType === 'existing' && coverIdOrIndex === photo.id ? 'selected' : ''}`}
                                    style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: coverType === 'existing' && coverIdOrIndex === photo.id ? '3px solid black' : '1px solid #ddd' }}
                                    onClick={() => selectExistingCover(photo.id)}>
                                    <img src={photo.photoUrl} alt="Review" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    {coverType === 'existing' && coverIdOrIndex === photo.id && <div className="cover-badge" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.7rem', textAlign: 'center', padding: '4px' }}>COVER</div>}
                                    <div className="delete-badge" onClick={(e) => { e.stopPropagation(); deleteExistingPhoto(photo.id); }}>
                                        <i className="fas fa-times"></i>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="form-group" style={{ marginTop: '20px' }}>
                            <label>Add More Photos</label>
                            <input type="file" multiple accept="image/png, image/jpeg" onChange={handleFileSelect}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff' }} />

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginTop: '15px' }}>
                                {newPreviews.map((url, idx) => (
                                    <div key={idx} className={`preview-item ${coverType === 'new' && coverIdOrIndex === idx ? 'selected' : ''}`}
                                        style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: coverType === 'new' && coverIdOrIndex === idx ? '3px solid black' : '1px solid #ddd' }}
                                        onClick={() => selectNewCover(idx)}>
                                        <img src={url} alt="New" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        {coverType === 'new' && coverIdOrIndex === idx && <div className="cover-badge" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.7rem', textAlign: 'center', padding: '4px' }}>COVER</div>}
                                        <div className="delete-badge" onClick={(e) => { e.stopPropagation(); removeNewPhoto(idx); }}>
                                            <i className="fas fa-times"></i>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-dark" style={{ width: '100%', padding: '15px', marginTop: '20px', fontSize: '1rem' }}>
                        Update Review
                    </button>
                    <Link to="/manage-reviews" className="btn-red" style={{ width: '100%', padding: '15px', marginTop: '0px', fontSize: '1rem', justifyContent: 'center' }}>
                        Cancel
                    </Link>
                </form>
            </main>
        </div>
    )
}

