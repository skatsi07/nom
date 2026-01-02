import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { optimizeCloudinaryUrl } from '../utils/imageUtils'
import ReviewModal from '../components/ReviewModal';
import { Map, MapMarker } from '@/components/ui/map';

// Interfaces (Shared)
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
interface Review {
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

interface UserProfile {
    username: string;
    name: string;
    bio: string;
    profilePicUrl: string;
    instagramUrl: string;
    tiktokUrl: string;
}

export default function UserMap() {
    const { username } = useParams<{ username: string }>();

    const [user, setUser] = useState<UserProfile | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)

    // Modal State
    const [selectedReview, setSelectedReview] = useState<Review | null>(null)

    // 1. Fetch Profile and Reviews
    useEffect(() => {
        const fetchData = async () => {
            if (!username) return
            try {
                const { data: session } = await supabase.auth.getSession()
                const token = session.session?.access_token
                const headers: HeadersInit = {}
                if (token) headers['Authorization'] = `Bearer ${token}`

                // Parallel fetch
                const [profileRes, reviewsRes] = await Promise.all([
                    fetch(`/api/profile/${username}`, { headers }),
                    fetch(`/api/reviews?username=${username}&page=0&size=100`, { headers }) // Fetch up to 100 for map
                ]);

                if (profileRes.ok) setUser(await profileRes.json())
                if (reviewsRes.ok) {
                    const pageData = await reviewsRes.json()
                    setReviews(pageData.content)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [username])


    const openModal = (review: Review) => {
        setSelectedReview(review);
    }
    const closeModal = () => {
        setSelectedReview(null);
    }

    // Default center (e.g., Paris or user's first review)
    const defaultCenter = reviews.find(r => r.latitude && r.longitude)
        ? [reviews.find(r => r.latitude && r.longitude)!.longitude!, reviews.find(r => r.latitude && r.longitude)!.latitude!]
        : [-74.006, 40.7128]; // NYC default

    return (
        <div className="app-wrapper">
            <header style={{ padding: '10px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Link to={`/profile/${username}`} className="btn-icon" style={{ textDecoration: 'none', color: '#333' }}>
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <div className="logo" style={{ fontSize: '1.2rem' }}>
                        {user ? `${user.name}'s Map` : 'Map'}
                    </div>
                </div>
            </header>

            <main className="main-content full-width" style={{ position: 'relative', height: 'calc(100vh - 60px)', padding: 0 }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <i className="fas fa-spinner fa-spin fa-2x"></i>
                    </div>
                ) : (
                    <Map
                        center={defaultCenter as [number, number]}
                        zoom={3}
                        styles={{
                            light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                        }}
                    >
                        {reviews.map(review => {
                            if (review.latitude && review.longitude) {
                                return (
                                    <MapMarker
                                        key={review.id}
                                        longitude={review.longitude}
                                        latitude={review.latitude}
                                        onClick={() => openModal(review)}
                                    >
                                        <div
                                            className="map-pin"
                                            style={{
                                                width: '30px',
                                                height: '30px',
                                                borderRadius: '50%',
                                                border: '2px solid white',
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                background: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {review.photos && review.photos.length > 0 ? (
                                                <img
                                                    src={optimizeCloudinaryUrl(review.photos[0].photoUrl, 50, 50)}
                                                    alt={review.placeName}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <i className="fas fa-utensils" style={{ fontSize: '12px', color: '#555' }}></i>
                                            )}
                                        </div>
                                    </MapMarker>
                                )
                            }
                            return null;
                        })}
                    </Map>
                )}
            </main>

            {/* MODAL */}
            {selectedReview && (
                <ReviewModal review={selectedReview} onClose={closeModal} />
            )}
        </div>
    )
}
