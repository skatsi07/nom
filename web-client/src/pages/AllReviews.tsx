import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

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

    // If no username (shouldn't happen due to route), default or error state
    // For now, if undefined, we can render nothing or error. Route guarantees it though.

    const [user, setUser] = useState<UserProfile | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)

    // Modal State
    const [selectedReview, setSelectedReview] = useState<Review | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: session } = await supabase.auth.getSession()
                const token = session.session?.access_token
                const headers: HeadersInit = {}
                if (token) headers['Authorization'] = `Bearer ${token}`

                // Fetch Profile
                const profileRes = await fetch(`http://localhost:8080/api/profile/${username}`, { headers })
                if (profileRes.ok) setUser(await profileRes.json())

                // Fetch Reviews
                const reviewsRes = await fetch(`http://localhost:8080/api/reviews?username=${username}`, { headers })
                if (reviewsRes.ok) setReviews(await reviewsRes.json())

            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [username])

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
    const scrollCarousel = (direction: number) => {
        const track = document.getElementById('m-carousel-track');
        if (track) {
            const scrollAmount = track.clientWidth * direction;
            track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }

    if (loading) return <div className="text-center mt-10">Loading...</div>

    return (
        <div className="app-wrapper">
            <div className="layout-grid">

                {/* SIDEBAR (Identical to Profile) */}
                <aside className="topbar">
                    <section className="hero profile-card">
                        <div className="cover-photo"></div>
                        <div className="profile-info">
                            <div className="profile-pic">
                                {user?.profilePicUrl ? <img src={user.profilePicUrl} alt="Me" /> : <span>Me</span>}
                            </div>
                            <h2 style={{ marginBottom: '3px' }}>@{user?.username || 'user'}</h2>
                            <h1 style={{ marginTop: '0' }}>{user?.name || 'Name'}</h1>
                            <h5>{user?.bio || 'Bio'}</h5>

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
                                <Link to="/" className="btn-dark" style={{ width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none', padding: '10px 0' }}>
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
                            {reviews.map(review => (
                                <div key={review.id} className="review-card-large" onClick={() => openModal(review)}>
                                    <div className="card-image-placeholder" style={{ overflow: 'hidden', position: 'relative' }}>
                                        {review.photos && review.photos.length > 0 ? (
                                            <img src={review.photos[0].photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} alt="Review" />
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
                            ))}
                        </div>
                    </section>
                </main>
            </div>

            {/* MODAL (Reused) */}
            {selectedReview && (
                <div id="reviewModal" className={`modal-overlay active`} onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={closeModal}>&times;</button>
                        <div className="modal-body">
                            <div className="m-area-header">
                                <div className="modal-header-row">
                                    <h2>{selectedReview.placeName}</h2>
                                    <div className="modal-stars-large">
                                        {renderStars(selectedReview.overallRating)}
                                        <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '5px' }}>({selectedReview.overallRating})</span>
                                    </div>
                                </div>
                                <p className="modal-subtitle">Location Data Placeholder</p>
                            </div>

                            <div className="m-area-images carousel-container" id="photo-carousel-wrapper" style={{ display: 'block' }}>
                                {selectedReview.photos && selectedReview.photos.length > 1 && (
                                    <button className="carousel-btn prev" onClick={() => scrollCarousel(-1)}><i className="fas fa-chevron-left"></i></button>
                                )}
                                <div id="m-carousel-track" className="carousel-track">
                                    {selectedReview.photos.sort((a, b) => a.photoOrder - b.photoOrder).map(photo => (
                                        <img key={photo.id} src={photo.photoUrl} alt="Review" />
                                    ))}
                                </div>
                                {selectedReview.photos && selectedReview.photos.length > 1 && (
                                    <button className="carousel-btn next" onClick={() => scrollCarousel(1)}><i className="fas fa-chevron-right"></i></button>
                                )}
                            </div>

                            <div className="m-area-content">
                                <hr className="modal-divider" />
                                <div className="modal-meta-grid">
                                    <div className="meta-row"><strong>Date Visited:</strong> <span>{selectedReview.date}</span></div>
                                    <div className="meta-row"><strong>Cuisine:</strong> <span>{selectedReview.cuisine}</span></div>
                                    <div className="meta-row"><strong>Price:</strong> <span>${selectedReview.pricePerPerson}</span></div>
                                    <div className="meta-row description-box"><strong>Description:</strong><p>{selectedReview.overallDesc}</p></div>
                                </div>
                                <hr className="modal-divider" />
                                <h3>Rating Breakdown</h3>
                                <div className="rating-breakdown">
                                    <div className="rating-row"><span>Food</span> <div className="stars-right">{renderStars(selectedReview.foodScore)}</div></div>
                                    <div className="rating-row"><span>Service</span> <div className="stars-right">{renderStars(selectedReview.serviceScore)}</div></div>
                                    <div className="rating-row"><span>Ambiance</span> <div className="stars-right">{renderStars(selectedReview.ambianceScore)}</div></div>
                                    <div className="rating-row"><span>Overall</span> <div className="stars-right">{renderStars(selectedReview.overallRating)}</div></div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

