import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { optimizeCloudinaryUrl } from '../utils/imageUtils'
import ReviewModal from '../components/ReviewModal';

import { API_BASE_URL } from '../config';

// --- Interfaces for API Data ---
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
}

interface UserProfile {
    username: string;
    name: string;
    bio: string;
    profilePicUrl: string;
    instagramUrl: string;
    tiktokUrl: string;
}

export default function Profile() {
    const { username } = useParams<{ username: string }>()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])

    // Modal State
    const [selectedReview, setSelectedReview] = useState<Review | null>(null)
    // const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0); // Unused

    const [loadingProfile, setLoadingProfile] = useState(true)
    const [loadingReviews, setLoadingReviews] = useState(true)
    const [error, setError] = useState('')

    // 1. Fetch Profile
    useEffect(() => {
        const fetchProfile = async () => {
            if (!username) return
            try {
                const { data: session } = await supabase.auth.getSession()
                const token = session.session?.access_token
                const headers: HeadersInit = {}
                if (token) headers['Authorization'] = `Bearer ${token}`


                const profileRes = await fetch(`${API_BASE_URL}/api/profile/${username}`, { headers })
                if (!profileRes.ok) throw new Error("Failed to fetch profile")
                const profileData = await profileRes.json()
                setProfile(profileData)
            } catch (err: any) {
                console.error("Error:", err);
                setError(err.message)
            } finally {
                setLoadingProfile(false)
            }
        }
        fetchProfile()
    }, [username])

    // 2. Fetch Reviews
    useEffect(() => {
        const fetchReviews = async () => {
            if (!username) return
            setLoadingReviews(true)
            try {
                const { data: session } = await supabase.auth.getSession()
                const token = session.session?.access_token
                const headers: HeadersInit = {}
                if (token) headers['Authorization'] = `Bearer ${token}`

                // Fetch Reviews (Paginated endpoint, just get first page)
                const reviewsRes = await fetch(`${API_BASE_URL}/api/reviews?username=${username}&page=0&size=9`, { headers })
                if (reviewsRes.ok) {
                    const pageData = await reviewsRes.json()
                    setReviews(pageData.content)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoadingReviews(false)
            }
        }
        fetchReviews()
    }, [username])

    // --- Helper for Stars ---
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
    }

    // --- Modal Logic ---
    const openModal = (review: Review) => {
        setSelectedReview(review);
        // setCurrentPhotoIndex(0);
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    const closeModal = () => {
        setSelectedReview(null);
        document.body.style.overflow = 'auto';
    }


    // Removed Blocking Loading Screen
    if (error) return <div className="text-center mt-10 text-red-500">Error: {error}</div>

    return (
        <div className="app-wrapper">



            <div className="layout-grid">

                {/* --- SIDEBAR / TOPBAR --- */}
                <aside className="topbar">
                    <section className="hero profile-card">
                        <div className="cover-photo"></div>
                        <div className="profile-info">
                            <div className="profile-pic">
                                {loadingProfile ? (
                                    <div className="skeleton-circle" style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#ddd' }}></div>
                                ) : (
                                    profile?.profilePicUrl ? <img src={optimizeCloudinaryUrl(profile.profilePicUrl, 300)} alt="Profile" /> : <span>Me</span>
                                )}
                            </div>

                            {loadingProfile ? (
                                <>
                                    <div className="skeleton-text" style={{ width: '60%', height: '20px', background: '#ddd', margin: '10px auto' }}></div>
                                    <div className="skeleton-text" style={{ width: '40%', height: '15px', background: '#eee', margin: '5px auto' }}></div>
                                </>
                            ) : (
                                <>
                                    <h2 style={{ marginBottom: '3px' }}>@{profile?.username}</h2>
                                    <h1 style={{ marginTop: '0' }}>{profile?.name}</h1>
                                    <h5>{profile?.bio}</h5>
                                </>
                            )}

                            <div className="social-buttons">
                                {profile?.instagramUrl && (
                                    <a href={profile.instagramUrl} target="_blank" rel="noreferrer" className="btn-social">
                                        <i className="fab fa-instagram" style={{ marginRight: '5px' }}></i> Instagram
                                    </a>
                                )}
                                {profile?.tiktokUrl && (
                                    <a href={profile.tiktokUrl} target="_blank" rel="noreferrer" className="btn-social">
                                        <i className="fab fa-tiktok" style={{ marginRight: '5px' }}></i> TikTok
                                    </a>
                                )}
                            </div>
                        </div>
                    </section>
                </aside>

                {/* --- MAIN CONTENT --- */}
                <main className="main-content" style={{ boxShadow: 'none', border: 'none' }}>
                    <section className="container">
                        <h2>Recent Eats</h2>

                        {loadingReviews ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                                <i className="fas fa-spinner fa-spin fa-2x"></i>
                            </div>
                        ) : reviews.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No reviews yet.</p>
                        ) : (
                            reviews.slice(0, 5).map(review => (
                                <div key={review.id} className="review-row" onClick={() => openModal(review)}>
                                    <strong className="place-name">{review.placeName}</strong>
                                    <div className="star-group">
                                        {renderStars(review.overallRating)}
                                    </div>
                                    <span className="date">{review.date}</span>
                                </div>
                            ))
                        )}

                        <div className="view-more-container">
                            <Link to={`/profile/${username}/reviews`} className="btn-outline">View All Past Reviews</Link>
                        </div>
                    </section>

                    {/* Placeholder Categories */}
                    <section className="container">
                        <h2>Explore Reviews by Category</h2>
                        <div className="category-grid">
                            {['🍕', '🍔', '🍜', '🍣', '🍗', '🇮🇹', '🇬🇷'].map((emoji, i) => (
                                <div key={i} className="cat-box">{emoji}</div>
                            ))}
                        </div>
                    </section>

                    {/* Placeholder Map */}
                    <section className="container">
                        <h2>Food Map</h2>
                        <div className="map-placeholder">
                            <p>Interactive Map</p>
                        </div>
                    </section>
                </main>
            </div>

            {/* --- MODAL --- */}
            {selectedReview && (
                <ReviewModal review={selectedReview} onClose={closeModal} />
            )}
        </div>
    )
}
