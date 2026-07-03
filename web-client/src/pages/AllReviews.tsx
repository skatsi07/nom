import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { optimizeCloudinaryUrl } from '../utils/imageUtils'
import ReviewModal from '../components/ReviewModal';
import { API_BASE_URL } from '../config';
import { PREDEFINED_TAGS } from '../constants/tags';

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
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const activeTagsStr = searchParams.get('tags');
    const activeTags = activeTagsStr ? activeTagsStr.split(',') : [];

    const [user, setUser] = useState<UserProfile | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])
    
    // Tag Dropdown State
    const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
    const [tempSelectedTags, setTempSelectedTags] = useState<string[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTempSelectedTags(activeTags);
    }, [activeTagsStr]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsTagDropdownOpen(false);
                setTempSelectedTags(activeTags);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activeTagsStr, dropdownRef]);

    // Reset pagination when tags change
    useEffect(() => {
        setPage(0);
        setHasMore(true);
    }, [activeTagsStr]);

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

                const size = 9;
                const tagQuery = activeTagsStr ? `&tags=${encodeURIComponent(activeTagsStr)}` : '';
                const reviewsRes = await fetch(`${API_BASE_URL}/api/reviews?username=${username}&page=${page}&size=${size}${tagQuery}`, { headers })

                if (reviewsRes.ok) {
                    const pageData = await reviewsRes.json()
                    const newReviews: Review[] = pageData.content


                    setReviews(prev => {
                        if (page === 0) {
                            return newReviews;
                        }
                        // Deduplication: Filter out any reviews that already exist in state
                        const existingIds = new Set(prev.map(r => r.id))
                        const uniqueNewReviews = newReviews.filter(r => !existingIds.has(r.id))
                        return [...prev, ...uniqueNewReviews]
                    })

                    // Stop Condition
                    if (pageData.last) {
                        setHasMore(false)
                    } else if (page === 0) {
                        setHasMore(true)
                    }
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoadingReviews(false)
            }
        }
        fetchReviews()
    }, [username, page, activeTagsStr])

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
                            <div className="filter-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
                                <button 
                                    className={`btn-filter ${activeTags.length > 0 ? 'active' : ''}`}
                                    onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '5px',
                                        background: activeTags.length > 0 ? '#333' : undefined,
                                        color: activeTags.length > 0 ? 'white' : undefined,
                                        borderColor: activeTags.length > 0 ? '#333' : undefined
                                    }}
                                >
                                    {activeTags.length > 0 ? `Tags (${activeTags.length})` : 'Tags'} <i className="fas fa-chevron-down"></i>
                                </button>
                                
                                {isTagDropdownOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: '0',
                                        marginTop: '5px',
                                        background: 'white',
                                        border: '1px solid #ddd',
                                        borderRadius: '12px',
                                        padding: '15px',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                        zIndex: 1000,
                                        width: '280px',
                                        maxHeight: '350px',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        <div style={{ overflowY: 'auto', flex: 1, marginBottom: '10px' }}>
                                            {PREDEFINED_TAGS.map(t => (
                                                <label key={t.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px 8px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                                                    <span>{t.emoji} {t.label}</span>
                                                    <input 
                                                        type="checkbox"
                                                        checked={tempSelectedTags.includes(t.label)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setTempSelectedTags([...tempSelectedTags, t.label]);
                                                            } else {
                                                                setTempSelectedTags(tempSelectedTags.filter(tag => tag !== t.label));
                                                            }
                                                        }}
                                                        style={{ accentColor: '#e5c100', width: '18px', height: '18px', cursor: 'pointer' }}
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                className="btn-filter"
                                                style={{ flex: 1, padding: '10px', justifyContent: 'center' }}
                                                onClick={() => {
                                                    setTempSelectedTags([]);
                                                    setIsTagDropdownOpen(false);
                                                    navigate(`/profile/${username}/reviews`);
                                                }}
                                            >
                                                Clear
                                            </button>
                                            <button 
                                                className="btn-dark"
                                                style={{ flex: 1, padding: '10px' }}
                                                onClick={() => {
                                                    setIsTagDropdownOpen(false);
                                                    if (tempSelectedTags.length > 0) {
                                                        navigate(`/profile/${username}/reviews?tags=${encodeURIComponent(tempSelectedTags.join(','))}`);
                                                    } else {
                                                        navigate(`/profile/${username}/reviews`);
                                                    }
                                                }}
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
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
                                                {review.tags && (
                                                    <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#666' }}>
                                                        {review.tags.split(',').slice(0, 3).map(tag => (
                                                            <span key={tag} style={{ marginRight: '5px', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
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
                                                {review.tags && (
                                                    <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#666' }}>
                                                        {review.tags.split(',').slice(0, 3).map(tag => (
                                                            <span key={tag} style={{ marginRight: '5px', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
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

