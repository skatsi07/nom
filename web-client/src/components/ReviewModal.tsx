import { useRef } from 'react';
import { optimizeCloudinaryUrl } from '../utils/imageUtils';
import { PREDEFINED_TAGS } from '../constants/tags';

// --- Interfaces ---
// (Ideally these should be in a shared types file, but for now we mirror the shape)
export interface ReviewPhoto {
    id: number;
    photoUrl: string;
    photoOrder: number;
}

export interface FoodItem {
    id: number;
    name: string;
    rating: number;
    description: string;
}

export interface Review {
    id: number;
    placeName: string;
    date: string;
    overallRating: number;
    cuisine: string;
    tags: string;
    pricePerPerson: number;
    instagramUrl: string;
    tiktokUrl: string;
    overallDesc: string;
    foodScore: number;
    serviceScore: number;
    ambianceScore: number;
    photos: ReviewPhoto[];
    foodItems: FoodItem[];
}

interface ReviewModalProps {
    review: Review;
    onClose: () => void;
}

export default function ReviewModal({ review, onClose }: ReviewModalProps) {
    // Scroll handling for carousel
    const carouselRef = useRef<HTMLDivElement>(null);

    const scrollCarousel = (direction: number) => {
        if (carouselRef.current) {
            const scrollAmount = carouselRef.current.clientWidth * direction;
            carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const renderStars = (score: number) => {
        const fullStars = Math.floor(score / 2);
        const hasHalf = (score / 2 - fullStars) >= 0.5;
        const stars = [];

        for (let i = 0; i < fullStars; i++) {
            stars.push(<i key={`full-${i}`} className="fas fa-star" style={{ color: '#e5c100', marginRight: '2px' }}></i>);
        }
        if (hasHalf) {
            stars.push(<i key="half" className="fas fa-star-half-alt" style={{ color: '#e5c100', marginRight: '2px' }}></i>);
        }
        return <>{stars}</>;
    };

    const hasPhotos = review.photos && review.photos.length > 0;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 sm:p-6" onClick={onClose}>
            <div className="bg-base-100 w-full max-w-5xl rounded-3xl overflow-hidden flex flex-col md:flex-row h-full max-h-[90vh] shadow-2xl relative" onClick={e => e.stopPropagation()}>

                {/* CLOSE BUTTON */}
                <button className="btn btn-circle btn-sm absolute right-4 top-4 z-50 bg-base-100 hover:bg-base-200 border-none text-base-content shadow-md" onClick={onClose}>✕</button>

                {/* LEFT COLUMN: PHOTOS (Full Bleed) */}
                <div className="w-full md:w-1/2 h-64 md:h-full relative bg-black flex-shrink-0">
                    {hasPhotos ? (
                        <div className="w-full h-full relative overflow-hidden group">
                            {review.photos.length > 1 && (
                                <button className="btn btn-circle btn-sm absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white border-none opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => scrollCarousel(-1)}>
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                            )}

                            <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar" ref={carouselRef} style={{ scrollbarWidth: 'none' }}>
                                {review.photos.sort((a, b) => a.photoOrder - b.photoOrder).map(photo => (
                                    <img
                                        key={photo.id}
                                        src={optimizeCloudinaryUrl(photo.photoUrl, 800)}
                                        alt="Review"
                                        className="w-full h-full object-cover shrink-0 snap-center"
                                    />
                                ))}
                            </div>

                            {review.photos.length > 1 && (
                                <button className="btn btn-circle btn-sm absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white border-none opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => scrollCarousel(1)}>
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-base-300">
                            <i className="fas fa-utensils text-5xl mb-2"></i>
                            <p className="text-lg font-medium">No Photos Available</p>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: CONTENT */}
                <div className="w-full md:w-1/2 flex flex-col h-full overflow-y-auto p-6 md:p-8 bg-base-100 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>

                    {/* HEADER */}
                    <div className="mb-4 pr-8">
                        <h2 className="text-3xl font-extrabold text-base-content mb-2 leading-tight">{review.placeName}</h2>
                        <div className="flex items-center gap-2">
                            <div className="flex text-warning text-lg">
                                {renderStars(review.overallRating)}
                            </div>
                            <span className="font-semibold text-base-content/70">({review.overallRating})</span>
                        </div>
                    </div>

                    <div className="divider my-0"></div>

                    {/* BASICS */}
                    <div className="py-4 space-y-3">
                        <p className="text-base-content/80"><strong className="text-base-content font-bold">Date:</strong> {review.date}</p>
                        <p className="text-base-content/80"><strong className="text-base-content font-bold">Price:</strong> ${review.pricePerPerson}</p>
                        
                        {review.tags && (
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <strong className="text-base-content font-bold mr-1">Tags:</strong> 
                                {review.tags.split(',').map(tag => {
                                    const predefined = PREDEFINED_TAGS.find(t => t.label === tag);
                                    return (
                                        <span key={tag} className="badge badge-neutral badge-md py-3 px-3 gap-1 shadow-sm font-medium">
                                            {predefined?.emoji && <span>{predefined.emoji}</span>}
                                            {tag}
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        {review.overallDesc && (
                            <p className="mt-4 text-base-content/90 leading-relaxed bg-base-200 p-4 rounded-xl shadow-inner italic">"{review.overallDesc}"</p>
                        )}
                    </div>

                    {/* WHAT I ATE (Conditional) */}
                    {review.foodItems && review.foodItems.length > 0 && (
                        <>
                            <div className="divider my-0"></div>
                            <div className="py-4">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><i className="fas fa-hamburger text-primary"></i> What I Ate</h3>
                                <div className="space-y-4">
                                    {review.foodItems.map(item => (
                                        <div key={item.id} className="bg-base-200 p-4 rounded-xl border border-base-300">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-lg">{item.name}</span>
                                                <span className="badge badge-primary font-bold shadow-sm">{item.rating}/10</span>
                                            </div>
                                            {item.description && (
                                                <p className="text-sm text-base-content/70 mt-2">{item.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* BREAKDOWN & SOCIALS */}
                    <div className="mt-auto pt-4">

                        {(review.foodScore > 0 || review.serviceScore > 0 || review.ambianceScore > 0 || review.instagramUrl || review.tiktokUrl) && (
                            <div className="divider my-0 mb-4"></div>
                        )}

                        {(review.foodScore > 0 || review.serviceScore > 0 || review.ambianceScore > 0) && (
                            <div className="space-y-3 mb-6 bg-base-200 p-5 rounded-xl border border-base-300">
                                <h4 className="font-bold text-sm text-base-content/50 uppercase tracking-wider mb-3">Scores</h4>
                                {review.foodScore > 0 && (
                                    <div className="flex items-center gap-3">
                                        <span className="w-20 font-semibold text-sm">Food</span>
                                        <progress className="progress progress-primary w-full bg-base-300 h-2" value={review.foodScore} max="10"></progress>
                                        <span className="w-6 text-right font-bold">{review.foodScore}</span>
                                    </div>
                                )}
                                {review.serviceScore > 0 && (
                                    <div className="flex items-center gap-3">
                                        <span className="w-20 font-semibold text-sm">Service</span>
                                        <progress className="progress progress-secondary w-full bg-base-300 h-2" value={review.serviceScore} max="10"></progress>
                                        <span className="w-6 text-right font-bold">{review.serviceScore}</span>
                                    </div>
                                )}
                                {review.ambianceScore > 0 && (
                                    <div className="flex items-center gap-3">
                                        <span className="w-20 font-semibold text-sm">Ambiance</span>
                                        <progress className="progress progress-accent w-full bg-base-300 h-2" value={review.ambianceScore} max="10"></progress>
                                        <span className="w-6 text-right font-bold">{review.ambianceScore}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {(review.instagramUrl || review.tiktokUrl) && (
                            <div className="flex gap-3 justify-center mb-2">
                                {review.instagramUrl && (
                                    <a href={review.instagramUrl} target="_blank" rel="noreferrer" className="btn btn-circle btn-outline hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-colors">
                                        <i className="fab fa-instagram text-xl"></i>
                                    </a>
                                )}
                                {review.tiktokUrl && (
                                    <a href={review.tiktokUrl} target="_blank" rel="noreferrer" className="btn btn-circle btn-outline hover:bg-black hover:text-white hover:border-black transition-colors">
                                        <i className="fab fa-tiktok text-xl"></i>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
