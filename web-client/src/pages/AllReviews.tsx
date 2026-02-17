import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { optimizeCloudinaryUrl } from '../utils/imageUtils'
import ReviewModal from '../components/ReviewModal';
import { API_BASE_URL } from '../config';

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
}
interface UserProfile {
    username: string;
    name: string;
    bio: string;
    profilePicUrl: string;
    instagramUrl: string;
    tiktokUrl: string;
}

export default function AllReviews() {
    const { username } = useParams<{ username: string }>();

    const [user, setUser] = useState<UserProfile | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])

    // Pagination State
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [loadingReviews, setLoadingReviews] = useState(false)
    const [loadingProfile, setLoadingProfile] = useState(true)

    // Modal State
    const [selectedReview, setSelectedReview] = useState<Review | null>(null)

    // Infinite Scroll Observer
    const observer = useRef<IntersectionObserver | null>(null)
    const lastReviewElementRef = useCallback((node: HTMLDivElement) => {
        if (loadingReviews) return
        if (observer.current) observer.current.disconnect()
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1)
            }
        })
        if (node) observer.current.observe(node)
    }, [loadingReviews, hasMore])

    // 1. Fetch Profile (Once)
    useEffect(() => {
        const fetchProfile = async () => {
            if (!username) return
            try {
                const { data: session } = await supabase.auth.getSession()
                const token = session.session?.access_token
                const headers: HeadersInit = {}
                if (token) headers['Authorization'] = `Bearer ${token}`


                const profileRes = await fetch(`${API_BASE_URL}/api/profile/${username}`, { headers })
                if (profileRes.ok) setUser(await profileRes.json())
            } catch (err) {
                console.error(err)
            } finally {
                setLoadingProfile(false)
            }
        }
        fetchProfile()
    }, [username])

    // 2. Fetch Reviews (Paginated)
    useEffect(() => {
        const fetchReviews = async () => {
            if (!username) return
            setLoadingReviews(true)
            try {
                const { data: session } = await supabase.auth.getSession()
                const token = session.session?.access_token
                const headers: HeadersInit = {}
                if (token) headers['Authorization'] = `Bearer ${token}`

                const size = 9
                const reviewsRes = await fetch(`${API_BASE_URL}/api/reviews?username=${username}&page=${page}&size=${size}`, { headers })

                if (reviewsRes.ok) {
                    const pageData = await reviewsRes.json()
                    const newReviews: Review[] = pageData.content


                    setReviews(prev => {
                        // Deduplication: Filter out any reviews that already exist in state
                        const existingIds = new Set(prev.map(r => r.id))
                        const uniqueNewReviews = newReviews.filter(r => !existingIds.has(r.id))
                        return [...prev, ...uniqueNewReviews]
                    })

                    // Stop Condition
                    if (pageData.last) {
                        setHasMore(false)
                    }
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoadingReviews(false)
            }
        }
        fetchReviews()
    }, [username, page])

    // --- Stars Helper ---
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
        document.body.style.overflow = 'hidden';
    }
    const closeModal = () => {
        setSelectedReview(null);
        document.body.style.overflow = 'auto';
    }

    // Removed Blocking Loading Screen

    return (
        <div className="app-wrapper">
            <div className="layout-grid">

                {/* SIDEBAR (Identical to Profile) */}
                <aside className="topbar">
                    <section className="hero profile-card">
                        <div className="cover-photo"></div>
                        <div className="profile-info">
                            <div className="profile-pic">
                                {loadingProfile ? (
                                    <div className="skeleton-circle" style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#ddd' }}></div>
                                ) : (
                                    user?.profilePicUrl ? <img src={user.profilePicUrl} alt="Me" /> : <span>Me</span>
                                )}
                            </div>

                            {loadingProfile ? (
                                <>
                                    <div className="skeleton-text" style={{ width: '60%', height: '20px', background: '#ddd', margin: '10px auto' }}></div>
                                    <div className="skeleton-text" style={{ width: '40%', height: '15px', background: '#eee', margin: '5px auto' }}></div>
                                </>
                            ) : (
                                <>
                                    <h2 style={{ marginBottom: '3px' }}>@{user?.username || 'user'}</h2>
                                    <h1 style={{ marginTop: '0' }}>{user?.name || 'Name'}</h1>
                                    <h5>{user?.bio || 'Bio'}</h5>
                                </>
                            )}

                            <div className="social-buttons" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '15px' }}>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', width: '100%', marginBottom: '10px' }}>
                                    {user?.instagramUrl && (
                                        <a href={user.instagramUrl} target="_blank" rel="noreferrer" className="btn-social" style={{ textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center' }}>
                                            <i className="fab fa-instagram" style={{ marginRight: '5px' }}></i> Instagram
                                        </a>
                                    )}
                                    {user?.tiktokUrl && (
                                        <a href={user.tiktokUrl} target="_blank" rel="noreferrer" className="btn-social" style={{ textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center' }}>
                                            <i className="fab fa-tiktok" style={{ marginRight: '5px' }}></i> TikTok
                                        </a>
                                    )}
                                </div>
                                <Link to={`/profile/${username}`} className="btn-dark" style={{ width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none', padding: '10px 0' }}>
                                    <i className="fas fa-arrow-left"></i> Back to Profile
                                </Link>
                            </div>
                        </div>
                    </section>
                </aside>

                {/* MAIN - REVIEW GRID */}
                <main className="main-content full-width" style={{ boxShadow: 'none', border: 'none' }}>
                    <section className="container">

                        <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-input" placeholder="Search reviews..." />
                        </div>

                        <div className="filter-buttons">
                            <button className="btn-filter">Cuisine</button>
                            <button className="btn-filter">Date</button>
                            <button className="btn-filter">Stars</button>
                            <button className="btn-filter">Price</button>
                            <div style={{ flex: 1 }}></div>
                            <button className="btn-filter sort-btn">Sort <i className="fas fa-chevron-down"></i></button>
                        </div>

                        <div className="review-grid-cards">
                            {reviews.map((review, index) => {
                                if (reviews.length === index + 1) {
                                    return (
                                        <div ref={lastReviewElementRef} key={review.id} className="review-card-large" onClick={() => openModal(review)}>
                                            <div className="card-image-placeholder" style={{ overflow: 'hidden', position: 'relative' }}>
                                                {review.photos && review.photos.length > 0 ? (
                                                    <img
                                                        src={optimizeCloudinaryUrl(review.photos[0].photoUrl, 400, 300)}
                                                        loading="lazy"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                                                        alt="Review"
                                                    />
                                                ) : (
                                                    <i className="fas fa-utensils"></i>
                                                )}
                                            </div>
                                            <div className="card-info">
                                                <h3>{review.placeName}</h3>
                                                <div className="star-group">
                                                    {renderStars(review.overallRating)}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                } else {
                                    return (
                                        <div key={review.id} className="review-card-large" onClick={() => openModal(review)}>
                                            <div className="card-image-placeholder" style={{ overflow: 'hidden', position: 'relative' }}>
                                                {review.photos && review.photos.length > 0 ? (
                                                    <img
                                                        src={optimizeCloudinaryUrl(review.photos[0].photoUrl, 400, 300)}
                                                        loading="lazy"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                                                        alt="Review"
                                                    />
                                                ) : (
                                                    <i className="fas fa-utensils"></i>
                                                )}
                                            </div>
                                            <div className="card-info">
                                                <h3>{review.placeName}</h3>
                                                <div className="star-group">
                                                    {renderStars(review.overallRating)}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                            })}
                        </div>
                        {loadingReviews && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#888', width: '100%' }}>
                                <i className="fas fa-spinner fa-spin fa-lg"></i>
                            </div>
                        )}
                    </section>
                </main>
            </div>

            {/* MODAL (Reused) */}
            {selectedReview && (
                <ReviewModal review={selectedReview} onClose={closeModal} />
            )}
        </div>
    )
}

