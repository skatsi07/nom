import { useRef } from 'react';
import { optimizeCloudinaryUrl } from '../utils/imageUtils';
import { formatDate } from '../utils/dateUtils';
import { Map, MapMarker } from '@/components/ui/map';

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
    pricePerPerson: number;
    instagramUrl: string;
    tiktokUrl: string;
    overallDesc: string;
    foodScore: number;
    serviceScore: number;
    ambianceScore: number;
    photos: ReviewPhoto[];
    foodItems: FoodItem[];
    latitude?: number;
    longitude?: number;
    address?: string;
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
        <div className="modal-overlay active" onClick={onClose}>
            <div className="modal-content-new-layout" onClick={e => e.stopPropagation()}>

                {/* CLOSE BUTTON */}
                <button className="modal-close-btn" onClick={onClose}>&times;</button>

                {/* LEFT COLUMN: PHOTOS (Full Bleed) */}
                <div className="modal-left-col">
                    {hasPhotos ? (
                        <div className="modal-carousel-wrapper">
                            {review.photos.length > 1 && (
                                <button className="carousel-btn prev" onClick={() => scrollCarousel(-1)}>
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                            )}

                            <div className="modal-carousel-track" ref={carouselRef}>
                                {review.photos.sort((a, b) => a.photoOrder - b.photoOrder).map(photo => (
                                    <img
                                        key={photo.id}
                                        src={optimizeCloudinaryUrl(photo.photoUrl, 800)}
                                        alt="Review"
                                        className="modal-carousel-img"
                                    />
                                ))}
                            </div>

                            {review.photos.length > 1 && (
                                <button className="carousel-btn next" onClick={() => scrollCarousel(1)}>
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="no-photos-placeholder">
                            <i className="fas fa-utensils"></i>
                            <p>No Photos Available</p>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: CONTENT */}
                <div className="modal-right-col">

                    {/* HEADER */}
                    <div className="modal-header-section">
                        <h2>{review.placeName}</h2>
                        <div className="modal-stars-row">
                            <div className="stars-wrapper">
                                {renderStars(review.overallRating)}
                            </div>
                            <span className="rating-num">({review.overallRating})</span>
                        </div>
                    </div>

                    <hr className="modal-separator" />

                    {/* BASICS */}
                    <div className="modal-basics-section">
                        <p className="basics-line"><strong>Date:</strong> {formatDate(review.date)}</p>
                        <p className="basics-line"><strong>Price:</strong> ${review.pricePerPerson}</p>
                        <p className="basics-line"><strong>Cuisine:</strong> {review.cuisine}</p>

                        {review.overallDesc && (
                            <p className="modal-description">{review.overallDesc}</p>
                        )}

                        {/* Location Map */}
                        {review.latitude && review.longitude && (
                            <div style={{ marginTop: '15px', height: '150px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                                <Map
                                    center={[review.longitude, review.latitude]}
                                    zoom={14}
                                >
                                    <MapMarker
                                        longitude={review.longitude}
                                        latitude={review.latitude}
                                    >
                                        <div className="h-4 w-4 rounded-full border-2 border-white bg-red-500 shadow-lg" />
                                    </MapMarker>
                                </Map>
                            </div>
                        )}
                        {review.address && (
                            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                                <i className="fas fa-map-marker-alt" style={{ marginRight: '5px' }}></i>
                                {review.address}
                            </p>
                        )}
                    </div>

                    {/* WHAT I ATE (Conditional) */}
                    {review.foodItems && review.foodItems.length > 0 && (
                        <>
                            <hr className="modal-separator" />
                            <div className="modal-food-section">
                                <h3>What I Ate</h3>
                                <div className="food-items-list">
                                    {review.foodItems.map(item => (
                                        <div key={item.id} className="food-item-row-display">
                                            <div className="food-name-score">
                                                <span className="food-name">{item.name}</span>
                                                <span className="food-score-badge">{item.rating}</span>
                                            </div>
                                            {item.description && (
                                                <p className="food-desc">{item.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* BREAKDOWN & SOCIALS */}
                    <div className="modal-footer-section">

                        {/* Only show separator if we have ratings or socials coming up */}
                        {(review.foodScore > 0 || review.serviceScore > 0 || review.ambianceScore > 0 || review.instagramUrl || review.tiktokUrl) && (
                            <hr className="modal-separator" />
                        )}

                        {/* Rating Breakdown checking specifically for > 0 assuming 0 or null means missing */}
                        {(review.foodScore > 0 || review.serviceScore > 0 || review.ambianceScore > 0) && (
                            <div className="rating-bars-container">
                                {review.foodScore > 0 && (
                                    <div className="rating-bar-row">
                                        <span className="label">Food</span>
                                        <div className="bar-bg"><div className="bar-fill" style={{ width: `${(review.foodScore / 10) * 100}%` }}></div></div>
                                        <span className="score">{review.foodScore}</span>
                                    </div>
                                )}
                                {review.serviceScore > 0 && (
                                    <div className="rating-bar-row">
                                        <span className="label">Service</span>
                                        <div className="bar-bg"><div className="bar-fill" style={{ width: `${(review.serviceScore / 10) * 100}%` }}></div></div>
                                        <span className="score">{review.serviceScore}</span>
                                    </div>
                                )}
                                {review.ambianceScore > 0 && (
                                    <div className="rating-bar-row">
                                        <span className="label">Ambiance</span>
                                        <div className="bar-bg"><div className="bar-fill" style={{ width: `${(review.ambianceScore / 10) * 100}%` }}></div></div>
                                        <span className="score">{review.ambianceScore}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {(review.instagramUrl || review.tiktokUrl) && (
                            <div className="modal-socials-row">
                                {review.instagramUrl && (
                                    <a href={review.instagramUrl} target="_blank" rel="noreferrer" className="social-icon instagram">
                                        <i className="fab fa-instagram"></i>
                                    </a>
                                )}
                                {review.tiktokUrl && (
                                    <a href={review.tiktokUrl} target="_blank" rel="noreferrer" className="social-icon tiktok">
                                        <i className="fab fa-tiktok"></i>
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
