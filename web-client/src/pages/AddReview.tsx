import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { API_BASE_URL } from '../config';
import { PREDEFINED_TAGS } from '../constants/tags';

interface FoodItem {
    name: string;
    rating: number | '';
    description: string;
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

export default function AddReview() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<ReviewForm>({
        placeName: '',
        date: new Date().toISOString().split('T')[0],
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
                tags: formData.tags.join(','),
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


            const res = await fetch(`${API_BASE_URL}/api/reviews`, {
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
        <div className="min-h-screen bg-base-200 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <header className="flex items-center justify-between mb-8 bg-base-100 p-4 rounded-2xl shadow-sm">
                    <Link to="/" className="btn btn-circle btn-ghost">
                        <i className="fas fa-times text-xl"></i>
                    </Link>
                    <h1 className="text-2xl font-bold">New Review</h1>
                    <div className="w-12"></div> {/* Spacer for centering */}
                </header>

                <main>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* BASICS */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h3 className="card-title text-lg border-b border-base-200 pb-2 mb-4">The Basics</h3>
                                
                                <div className="form-control w-full mb-4">
                                    <label className="label">
                                        <span className="label-text font-bold">Place Name *</span>
                                    </label>
                                    <input name="placeName" type="text" required placeholder="e.g. Joe's Pizza"
                                        value={formData.placeName} onChange={handleChange}
                                        className="input input-bordered w-full" />
                                </div>
                                
                                <div className="form-control w-full mb-4">
                                    <label className="label">
                                        <span className="label-text font-bold">Date Visited *</span>
                                    </label>
                                    <input name="date" type="date" required
                                        value={formData.date} onChange={handleChange}
                                        className="input input-bordered w-full" />
                                </div>
                                
                                <div className="form-control w-full md:w-1/2 mb-4">
                                    <label className="label">
                                        <span className="label-text font-bold">Price ($)</span>
                                    </label>
                                    <input name="pricePerPerson" type="number" step="0.5" placeholder="25.00"
                                        value={formData.pricePerPerson} onChange={handleChange}
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
                                        <span className="label-text font-bold">Overall Rating (0.0 - 10.0) *</span>
                                    </label>
                                    <input name="overallRating" type="number" step="0.1" min="0" max="10" required
                                        value={formData.overallRating} onChange={handleChange}
                                        className="input input-bordered w-full text-xl font-bold text-primary" />
                                </div>
                                
                                <p className="text-sm font-semibold text-base-content/60 mb-2 uppercase tracking-wide">Category Breakdown</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {['Food', 'Service', 'Ambiance'].map(cat => {
                                        const field = (cat.toLowerCase() + 'Score') as keyof ReviewForm;
                                        return (
                                            <div key={cat} className="form-control w-full">
                                                <label className="label">
                                                    <span className="label-text">{cat}</span>
                                                </label>
                                                <input name={field} type="number" step="0.1" min="0" max="10" placeholder="-"
                                                    value={formData[field]} onChange={handleChange}
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
                                <h3 className="card-title text-lg border-b border-base-200 pb-2 mb-4">The Details</h3>
                                
                                <div className="form-control w-full mb-4">
                                    <label className="label">
                                        <span className="label-text font-bold">My Review</span>
                                    </label>
                                    <textarea name="overallDesc" rows={5} placeholder="How was the experience? What stood out?"
                                        value={formData.overallDesc} onChange={handleChange}
                                        className="textarea textarea-bordered w-full text-base leading-relaxed"></textarea>
                                </div>
                                
                                <div className="form-control w-full space-y-3 mt-4">
                                    <label className="label pb-0">
                                        <span className="label-text font-bold">Social Links</span>
                                    </label>
                                    <div className="relative">
                                        <i className="fab fa-instagram absolute left-4 top-3.5 text-base-content/50"></i>
                                        <input name="instagramUrl" type="url" placeholder="Instagram Reel URL"
                                            value={formData.instagramUrl} onChange={handleChange}
                                            className="input input-bordered w-full pl-10" />
                                    </div>
                                    <div className="relative">
                                        <i className="fab fa-tiktok absolute left-4 top-3.5 text-base-content/50"></i>
                                        <input name="tiktokUrl" type="url" placeholder="TikTok Video URL"
                                            value={formData.tiktokUrl} onChange={handleChange}
                                            className="input input-bordered w-full pl-10" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FOOD ITEMS */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h3 className="card-title text-lg border-b border-base-200 pb-2 mb-4 flex items-center gap-2">
                                    <i className="fas fa-hamburger text-primary"></i> Specific Dishes
                                </h3>
                                
                                <div className="space-y-4 mb-4">
                                    {foodItems.map((item, idx) => (
                                        <div key={idx} className="bg-base-200 p-4 rounded-xl relative border border-base-300">
                                            <div className="flex justify-between items-center mb-3">
                                                <strong className="text-base-content/70">Dish #{idx + 1}</strong>
                                                <button type="button" className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-error" onClick={() => removeFoodItem(idx)}>
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                            <div className="flex gap-2 mb-3">
                                                <input type="text" placeholder="Dish Name" required className="input input-bordered flex-[2]"
                                                    value={item.name} onChange={e => handleFoodItemChange(idx, 'name', e.target.value)} />
                                                <input type="number" step="0.1" min="0" max="10" placeholder="Score" className="input input-bordered flex-1"
                                                    value={item.rating} onChange={e => handleFoodItemChange(idx, 'rating', parseFloat(e.target.value))} />
                                            </div>
                                            <input type="text" placeholder="Brief thoughts..." className="input input-bordered w-full"
                                                value={item.description} onChange={e => handleFoodItemChange(idx, 'description', e.target.value)} />
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addFoodItem} className="btn btn-outline border-dashed w-full">
                                    <i className="fas fa-plus mr-2"></i> Add a Dish
                                </button>
                            </div>
                        </div>

                        {/* PHOTOS */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h3 className="card-title text-lg border-b border-base-200 pb-2 mb-4">Photos</h3>
                                
                                <div className="form-control w-full">
                                    <label className="label">
                                        <span className="label-text font-bold">Upload Photos</span>
                                    </label>
                                    <input type="file" multiple accept="image/png, image/jpeg" onChange={handleFileSelect}
                                        className="file-input file-input-bordered file-input-primary w-full bg-base-100" />
                                    
                                    <label className="label">
                                        <span className="label-text-alt text-base-content/60">
                                            Select multiple files. Click an image below to set it as the <strong className="text-base-content">Cover Photo</strong>.
                                        </span>
                                    </label>

                                    {imagePreviews.length > 0 && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                                            {imagePreviews.map((url, idx) => (
                                                <div key={idx} 
                                                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all ${coverIndex === idx ? 'ring-4 ring-primary ring-offset-2 ring-offset-base-100 shadow-lg' : 'hover:opacity-90'}`}
                                                    onClick={() => setCoverIndex(idx)}>
                                                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                                    
                                                    {coverIndex === idx && (
                                                        <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-content text-[10px] font-bold text-center py-1 tracking-wider uppercase backdrop-blur-sm">
                                                            Cover
                                                        </div>
                                                    )}
                                                    
                                                    <button type="button" className="btn btn-circle btn-xs absolute top-1 right-1 bg-black/50 border-none text-white hover:bg-error hover:text-error-content backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); removeImage(idx); }}>
                                                        <i className="fas fa-times text-[10px]"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-full mt-4 shadow-lg">
                            Save Review
                        </button>
                    </form>
                </main>
            </div>
        </div>
    )
}

