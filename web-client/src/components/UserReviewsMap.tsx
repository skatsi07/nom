import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { optimizeCloudinaryUrl } from '../utils/imageUtils'
import { formatDate } from '../utils/dateUtils'
import { Map, MapMarker, MapPopup } from '@/components/ui/map'

// Interfaces
interface ReviewPhoto {
    id: number;
    photoUrl: string;
    photoOrder: number;
}
interface FoodItem {
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

interface UserReviewsMapProps {
    username: string;
    onReviewSelect: (review: Review) => void;
    className?: string;
    style?: React.CSSProperties;
    interactive?: boolean;
}

export default function UserReviewsMap({ username, onReviewSelect, className, style }: UserReviewsMapProps) {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedReview, setSelectedReview] = useState<Review | null>(null)

    useEffect(() => {
        const fetchReviews = async () => {
            if (!username) return
            try {
                const { data: session } = await supabase.auth.getSession()
                const token = session.session?.access_token
                const headers: HeadersInit = {}
                if (token) headers['Authorization'] = `Bearer ${token}`

                const res = await fetch(`/api/reviews?username=${username}&page=0&size=100`, { headers })
                if (res.ok) {
                    const data = await res.json()
                    setReviews(data.content)
                }
            } catch (err) {
                console.error("Error fetching map reviews:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchReviews()
    }, [username])

    // Default center (NYC if no reviews with location)
    const defaultCenter = reviews.find(r => r.latitude && r.longitude)
        ? [reviews.find(r => r.latitude && r.longitude)!.longitude!, reviews.find(r => r.latitude && r.longitude)!.latitude!]
        : [-74.006, 40.7128];

    if (loading) {
        return (
            <div className={className} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5', ...style }}>
                <i className="fas fa-spinner fa-spin fa-2x"></i>
            </div>
        )
    }

    return (
        <div className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
            <Map
                center={defaultCenter as [number, number]}
                zoom={10}
                styles={{
                    light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                }}
            // onClick handler removed as it is not supported on Map component directly.
            // To support click-to-close, we would need to attach an event listener to the map instance via a ref or custom hook.
            // For now, we rely on the popup close behavior.
            >
                {reviews.map(review => {
                    if (review.latitude && review.longitude) {
                        return (
                            <MapMarker
                                key={review.id}
                                longitude={review.longitude}
                                latitude={review.latitude}
                                onClick={(e) => {
                                    e.stopPropagation(); // Use native stopPropagation
                                    setSelectedReview(review);
                                }}
                            >
                                <div
                                    className="map-pin"
                                    style={{
                                        cursor: 'pointer',
                                        color: '#ef4444', // Red-500
                                        fontSize: '2rem',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                                    }}
                                >
                                    <i className="fas fa-map-marker-alt"></i>
                                </div>
                            </MapMarker>
                        )
                    }
                    return null;
                })}

                {selectedReview && selectedReview.latitude && selectedReview.longitude && (
                    <MapPopup
                        longitude={selectedReview.longitude}
                        latitude={selectedReview.latitude}
                        onClose={() => setSelectedReview(null)}
                        closeButton={false}
                        className="w-64 p-0 shadow-xl border-none overflow-hidden rounded-lg bg-white"
                        offset={24}
                    >
                        <div className="popup-content">
                            {selectedReview.photos && selectedReview.photos.length > 0 && (
                                <div style={{ height: '120px', width: '100%', overflow: 'hidden' }}>
                                    <img
                                        src={optimizeCloudinaryUrl(selectedReview.photos[0].photoUrl, 400)}
                                        alt={selectedReview.placeName}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            )}
                            <div style={{ padding: '12px' }}>
                                <h3
                                    onClick={() => onReviewSelect(selectedReview)}
                                    style={{
                                        margin: '0 0 5px 0',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        color: '#262626'
                                    }}
                                    className="hover:underline"
                                >
                                    {selectedReview.placeName}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <i
                                            key={i}
                                            className={`fas fa-star`}
                                            style={{
                                                color: i < Math.round(selectedReview.overallRating / 2) ? '#fbbf24' : '#e5e7eb',
                                                fontSize: '0.8rem',
                                                marginRight: '2px'
                                            }}
                                        ></i>
                                    ))}
                                    <span style={{ fontSize: '0.8rem', marginLeft: '4px', color: '#888' }}>({selectedReview.overallRating})</span>
                                    <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '5px' }}>• {selectedReview.cuisine}</span>
                                </div>

                                <p style={{ margin: '0 0 2px 0', fontSize: '0.8rem', color: '#666' }}>
                                    <i className="far fa-calendar-alt" style={{ marginRight: '4px' }}></i>
                                    {formatDate(selectedReview.date) || 'Unknown Date'}
                                </p>

                                {selectedReview.address && (
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        <i className="fas fa-map-marker-alt" style={{ marginRight: '4px' }}></i>
                                        {selectedReview.address}
                                    </p>
                                )}
                            </div>
                        </div>
                    </MapPopup>
                )}
            </Map>
        </div>
    )
}
