import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { API_BASE_URL } from '../config';
import { PREDEFINED_TAGS } from '../constants/tags';

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
    tags: string[];
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
        tags: [],
        pricePerPerson: '',
        overallDesc: '',
        instagramUrl: '',
        tiktokUrl: '',
        foodScore: '',
        serviceScore: '',
        ambianceScore: ''
    });

    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
    const [customTagInput, setCustomTagInput] = useState('');

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


                const res = await fetch(`${API_BASE_URL}/api/reviews/${id}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        placeName: data.placeName,
                        date: data.date,
                        overallRating: data.overallRating,
                        cuisine: data.cuisine || '',
                        tags: data.tags ? data.tags.split(',') : [],
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
    const removeFoodItem = (index: number) => {
        setFoodItems(foodItems.filter((_, i) => i !== index));
    };

    // Tag Logic
    const toggleTag = (tagLabel: string) => {
        setFormData(prev => {
            const currentTags = prev.tags || [];
            if (currentTags.includes(tagLabel)) {
                return { ...prev, tags: currentTags.filter(t => t !== tagLabel) };
            } else {
                return { ...prev, tags: [...currentTags, tagLabel] };
            }
        });
    };

    const handleCustomTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = customTagInput.trim();
            if (tag && !(formData.tags || []).includes(tag)) {
                setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }));
            }
            setCustomTagInput('');
        }
    };

    // Photo Handlersting Photos
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
                tags: formData.tags.join(','),
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

            const res = await fetch(`${API_BASE_URL}/api/reviews/${id}`, {
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
        <div className="min-h-screen bg-base-200 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <header className="flex items-center justify-between mb-8 bg-base-100 p-4 rounded-2xl shadow-sm">
                    <Link to="/manage-reviews" className="btn btn-ghost btn-sm text-base-content/70">
                        Cancel
                    </Link>
                    <h1 className="text-2xl font-bold">Edit Review</h1>
                    <div className="w-16"></div> {/* Spacer for centering */}
                </header>

                <main>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* BASICS */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h3 className="card-title text-lg border-b border-base-200 pb-2 mb-4">Edit Review</h3>
                                
                                <div className="form-control w-full mb-4">
                                    <label className="label">
                                        <span className="label-text font-bold">Place Name *</span>
                                    </label>
                                    <input name="placeName" type="text" required value={formData.placeName} onChange={handleChange}
                                        className="input input-bordered w-full" />
                                </div>
                                
                                <div className="form-control w-full mb-4">
                                    <label className="label">
                                        <span className="label-text font-bold">Date Visited *</span>
                                    </label>
                                    <input name="date" type="date" required value={formData.date} onChange={handleChange}
                                        className="input input-bordered w-full" />
                                </div>
                                
                                <div className="form-control w-full md:w-1/2 mb-4">
                                    <label className="label">
                                        <span className="label-text font-bold">Price ($)</span>
                                    </label>
                                    <input name="pricePerPerson" type="number" step="0.5" value={formData.pricePerPerson} onChange={handleChange}
                                        className="input input-bordered w-full" />
                                </div>

                                {/* TAGS */}
                                <div className="mt-6">
                                    <label className="label">
                                        <span className="label-text font-bold">Tags</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {PREDEFINED_TAGS.map(tag => {
                                            const isSelected = formData.tags.includes(tag.label);
                                            return (
                                                <button 
                                                    key={tag.label} 
                                                    type="button" 
                                                    onClick={() => toggleTag(tag.label)}
                                                    className={`btn btn-sm rounded-full ${isSelected ? 'btn-neutral' : 'btn-outline border-base-300'}`}
                                                >
                                                    {tag.emoji} {tag.label}
                                                </button>
                                            );
                                        })}
                                        {/* Display Custom Tags that are not in predefined list */}
                                        {formData.tags.filter(t => !PREDEFINED_TAGS.some(pt => pt.label === t)).map(tag => (
                                             <button 
                                                key={tag} 
                                                type="button" 
                                                onClick={() => toggleTag(tag)}
                                                className="btn btn-sm btn-neutral rounded-full"
                                            >
                                                {tag} ✕
                                            </button>
                                        ))}
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Add custom tag... (press Enter)"
                                        value={customTagInput}
                                        onChange={e => setCustomTagInput(e.target.value)}
                                        onKeyDown={handleCustomTagAdd}
                                        className="input input-bordered input-sm w-full max-w-xs" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RATINGS */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h3 className="card-title text-lg border-b border-base-200 pb-2 mb-4">The Ratings</h3>
                                
                                <div className="form-control w-full mb-6">
                                    <label className="label">
                                        <span className="label-text font-bold">Overall Rating *</span>
                                    </label>
                                    <input name="overallRating" type="number" step="0.1" min="0" max="10" required value={formData.overallRating} onChange={handleChange}
                                        className="input input-bordered w-full text-xl font-bold text-primary" />
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {['Food', 'Service', 'Ambiance'].map(cat => {
                                        const field = (cat.toLowerCase() + 'Score') as keyof ReviewForm;
                                        return (
                                            <div key={cat} className="form-control w-full">
                                                <label className="label">
                                                    <span className="label-text">{cat}</span>
                                                </label>
                                                <input name={field} type="number" step="0.1" min="0" max="10" value={formData[field]} onChange={handleChange}
                                                    className="input input-bordered w-full" />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* DETAILS */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h3 className="card-title text-lg border-b border-base-200 pb-2 mb-4">Details</h3>
                                
                                <div className="form-control w-full mb-4">
                                    <textarea name="overallDesc" rows={5} value={formData.overallDesc} onChange={handleChange} placeholder="My Review"
                                        className="textarea textarea-bordered w-full text-base leading-relaxed"></textarea>
                                </div>
                                
                                <div className="form-control w-full space-y-3 mt-4">
                                    <input name="instagramUrl" type="url" placeholder="Instagram URL" value={formData.instagramUrl} onChange={handleChange}
                                        className="input input-bordered w-full" />
                                    <input name="tiktokUrl" type="url" placeholder="TikTok URL" value={formData.tiktokUrl} onChange={handleChange}
                                        className="input input-bordered w-full" />
                                </div>
                            </div>
                        </div>

                        {/* DISHES */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h3 className="card-title text-lg border-b border-base-200 pb-2 mb-4 flex items-center gap-2">
                                    Specific Dishes
                                </h3>
                                
                                <div className="space-y-4 mb-4">
                                    {foodItems.map((item, idx) => (
                                        <div key={idx} className="bg-base-200 p-4 rounded-xl border border-base-300">
                                            <div className="flex gap-2 mb-3">
                                                <input type="text" value={item.name} onChange={e => handleFoodChange(idx, 'name', e.target.value)} placeholder="Dish Name"
                                                    className="input input-bordered flex-[2]" />
                                                <input type="number" step="0.1" value={item.rating} onChange={e => handleFoodChange(idx, 'rating', e.target.value)} placeholder="Score"
                                                    className="input input-bordered flex-1" />
                                            </div>
                                            <input type="text" value={item.description} onChange={e => handleFoodChange(idx, 'description', e.target.value)} placeholder="Description"
                                                className="input input-bordered w-full mb-3" />
                                            <button type="button" className="btn btn-error btn-sm btn-outline" onClick={() => removeFoodItem(idx)}>
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addFoodItem} className="btn btn-outline border-dashed w-full">
                                    <i className="fas fa-plus mr-2"></i> Add New Dish
                                </button>
                            </div>
                        </div>

                        {/* PHOTOS */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h3 className="card-title text-lg border-b border-base-200 pb-2 mb-4">Photos</h3>
                                
                                <p className="text-sm font-semibold text-base-content/60 mb-2">Existing Photos</p>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6">
                                    {existingPhotos.map(photo => (
                                        <div key={photo.id} 
                                            className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all ${coverType === 'existing' && coverIdOrIndex === photo.id ? 'ring-4 ring-primary ring-offset-2 ring-offset-base-100 shadow-lg' : 'border border-base-300 hover:opacity-90'}`}
                                            onClick={() => selectExistingCover(photo.id)}>
                                            <img src={photo.photoUrl} alt="Review" className="w-full h-full object-cover" />
                                            {coverType === 'existing' && coverIdOrIndex === photo.id && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-content text-[10px] font-bold text-center py-1 tracking-wider uppercase backdrop-blur-sm">
                                                    Cover
                                                </div>
                                            )}
                                            <button type="button" className="btn btn-circle btn-xs absolute top-1 right-1 bg-black/50 border-none text-white hover:bg-error hover:text-error-content backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); deleteExistingPhoto(photo.id); }}>
                                                <i className="fas fa-times text-[10px]"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="form-control w-full mt-4">
                                    <label className="label">
                                        <span className="label-text font-bold">Add More Photos</span>
                                    </label>
                                    <input type="file" multiple accept="image/png, image/jpeg" onChange={handleFileSelect}
                                        className="file-input file-input-bordered file-input-primary w-full bg-base-100" />
                                    
                                    {newPreviews.length > 0 && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                                            {newPreviews.map((url, idx) => (
                                                <div key={idx} 
                                                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all ${coverType === 'new' && coverIdOrIndex === idx ? 'ring-4 ring-primary ring-offset-2 ring-offset-base-100 shadow-lg' : 'border border-base-300 hover:opacity-90'}`}
                                                    onClick={() => selectNewCover(idx)}>
                                                    <img src={url} alt="New" className="w-full h-full object-cover" />
                                                    
                                                    {coverType === 'new' && coverIdOrIndex === idx && (
                                                        <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-content text-[10px] font-bold text-center py-1 tracking-wider uppercase backdrop-blur-sm">
                                                            Cover
                                                        </div>
                                                    )}
                                                    
                                                    <button type="button" className="btn btn-circle btn-xs absolute top-1 right-1 bg-black/50 border-none text-white hover:bg-error hover:text-error-content backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); removeNewPhoto(idx); }}>
                                                        <i className="fas fa-times text-[10px]"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-6">
                            <button type="submit" className="btn btn-primary btn-lg w-full shadow-lg">
                                Update Review
                            </button>
                            <Link to="/manage-reviews" className="btn btn-outline btn-error btn-lg w-full">
                                Cancel
                            </Link>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    )
}

