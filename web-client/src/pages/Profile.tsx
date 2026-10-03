import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { optimizeCloudinaryUrl } from '../utils/imageUtils'
import ReviewModal from '../components/ReviewModal';
import { PREDEFINED_TAGS } from '../constants/tags';
import { API_BASE_URL } from '../config';

interface ReviewPhoto { id: number; photoUrl: string; photoOrder: number; }
interface FoodItem { id: number; name: string; rating: number; description: string; }
interface Review {
    id: number; placeName: string; date: string; overallRating: number;
    cuisine: string; pricePerPerson: number; instagramUrl: string; tiktokUrl: string;
    overallDesc: string; foodScore: number; serviceScore: number; ambianceScore: number;
    photos: ReviewPhoto[]; foodItems: FoodItem[];
}
interface UserProfile {
    username: string; name: string; bio: string; profilePicUrl: string;
    instagramUrl: string; tiktokUrl: string;
}

export default function Profile() {
    const { username } = useParams<{ username: string }>()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])
    const [selectedReview, setSelectedReview] = useState<Review | null>(null)
    const [loadingProfile, setLoadingProfile] = useState(true)
    const [loadingReviews, setLoadingReviews] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchProfile = async () => {
            if (!username) return
            try {
                const { data: session } = await supabase.auth.getSession()
                const token = session.session?.access_token
                const headers: HeadersInit = {}
                if (token) headers['Authorization'] = `Bearer ${token}`
                const res = await fetch(`${API_BASE_URL}/api/profile/${username}`, { headers })
                if (!res.ok) throw new Error("Failed to fetch profile")
                setProfile(await res.json())
            } catch (err: any) { setError(err.message) }
            finally { setLoadingProfile(false) }
        }
        fetchProfile()
    }, [username])

    useEffect(() => {
        const fetchReviews = async () => {
            if (!username) return
            setLoadingReviews(true)
            try {
                const { data: session } = await supabase.auth.getSession()
                const token = session.session?.access_token
                const headers: HeadersInit = {}
                if (token) headers['Authorization'] = `Bearer ${token}`
                const res = await fetch(`${API_BASE_URL}/api/reviews?username=${username}&page=0&size=9`, { headers })
                if (res.ok) { const d = await res.json(); setReviews(d.content) }
            } catch (err) { console.error(err) }
            finally { setLoadingReviews(false) }
        }
        fetchReviews()
    }, [username])

    const renderStars = (score: number) => {
        const full = Math.floor(score / 2);
        const half = (score / 2 - full) >= 0.5;
        const empty = 5 - full - (half ? 1 : 0);
        return (
            <span className="profile-stars">
                {Array.from({ length: full }).map((_, i) => <i key={`f${i}`} className="fas fa-star" />)}
                {half && <i key="h" className="fas fa-star-half-alt" />}
                {Array.from({ length: empty }).map((_, i) => <i key={`e${i}`} className="far fa-star profile-star-empty" />)}
            </span>
        )
    }

    const openModal = (r: Review) => { setSelectedReview(r); document.body.style.overflow = 'hidden'; }
    const closeModal = () => { setSelectedReview(null); document.body.style.overflow = 'auto'; }

    if (error) return <div className="profile-error">Error: {error}</div>

    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length / 2).toFixed(1)
        : '—'
    const cuisineCount = new Set(reviews.map(r => r.cuisine).filter(Boolean)).size || '—'

    return (
        <div className="nom-page">
            <div className="nom-container">

                {/* ── PROFILE CARD ── */}
                <div className="nom-card profile-hero-card">
                    <div className="profile-banner" />
                    <div className="profile-body">
                        {loadingProfile ? (
                            <div className="profile-avatar-wrap">
                                <div className="profile-avatar skeleton-circle" />
                            </div>
                        ) : (
                            <div className="profile-avatar-wrap">
                                <div className="profile-avatar">
                                    {profile?.profilePicUrl
                                        ? <img src={optimizeCloudinaryUrl(profile.profilePicUrl, 200)} alt="Profile" />
                                        : <span>{profile?.name?.charAt(0) ?? '?'}</span>}
                                </div>
                            </div>
                        )}

                        {loadingProfile ? (
                            <div className="profile-identity skeleton-text-group">
                                <div className="skel skel-sm" />
                                <div className="skel skel-lg" />
                                <div className="skel skel-md" />
                            </div>
                        ) : (
                            <div className="profile-identity">
                                <p className="profile-username">@{profile?.username}</p>
                                <h1 className="profile-name">{profile?.name}</h1>
                                {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
                            </div>
                        )}

                        {/* Social buttons */}
                        {!loadingProfile && (profile?.instagramUrl || profile?.tiktokUrl) && (
                            <div className="profile-socials">
                                {profile?.instagramUrl && (
                                    <a href={profile.instagramUrl} target="_blank" rel="noreferrer" className="btn-social-pill">
                                        <i className="fab fa-instagram" /> Instagram
                                    </a>
                                )}
                                {profile?.tiktokUrl && (
                                    <a href={profile.tiktokUrl} target="_blank" rel="noreferrer" className="btn-social-pill">
                                        <i className="fab fa-tiktok" /> TikTok
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── STATS ── */}
                <div className="nom-card stats-card">
                    <div className="stats-row">
                        <div className="stat-item">
                            <span className="stat-value">
                                {loadingReviews ? <span className="skel skel-stat" /> : reviews.length}
                            </span>
                            <span className="stat-label">Reviews</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item">
                            <span className="stat-value">
                                {loadingReviews ? <span className="skel skel-stat" /> : avgRating}
                            </span>
                            <span className="stat-label">Avg Rating</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item">
                            <span className="stat-value">
                                {loadingReviews ? <span className="skel skel-stat" /> : cuisineCount}
                            </span>
                            <span className="stat-label">Cuisines</span>
                        </div>
                    </div>
                </div>

                {/* ── RECENT EATS ── */}
                <div className="nom-card">
                    <div className="section-header">
                        <h2 className="section-title">Recent Eats</h2>
                    </div>

                    {loadingReviews ? (
                        <div className="review-list">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="review-row-item skeleton-row">
                                    <div className="skel skel-name" />
                                    <div className="skel skel-stars" />
                                    <div className="skel skel-date" />
                                </div>
                            ))}
                        </div>
                    ) : reviews.length === 0 ? (
                        <p className="empty-text">No reviews yet.</p>
                    ) : (
                        <div className="review-list">
                            {reviews.slice(0, 5).map((review, idx) => (
                                <button
                                    key={review.id}
                                    className={`review-row-item${idx < Math.min(reviews.length, 5) - 1 ? ' has-divider' : ''}`}
                                    onClick={() => openModal(review)}
                                >
                                    <span className="review-place-name">{review.placeName}</span>
                                    <span className="review-stars">{renderStars(review.overallRating)}</span>
                                    <span className="review-date">{review.date}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <Link to={`/profile/${username}/reviews`} className="btn-view-all">
                        View All Past Reviews
                    </Link>
                </div>

                {/* ── EXPLORE BY CATEGORY ── */}
                <div className="nom-card">
                    <div className="section-header">
                        <h2 className="section-title">Explore Reviews by Category</h2>
                    </div>
                    <div className="category-scroll">
                        {PREDEFINED_TAGS.map(tag => (
                            <Link
                                key={tag.label}
                                to={`/profile/${username}/reviews?tags=${encodeURIComponent(tag.label)}`}
                                className="cat-circle"
                                title={tag.label}
                            >
                                {tag.emoji}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── FOOD MAP ── */}
                <div className="nom-card">
                    <div className="section-header">
                        <h2 className="section-title">Food Map</h2>
                    </div>
                    <div className="map-placeholder">Interactive Map</div>
                </div>

            </div>

            {selectedReview && <ReviewModal review={selectedReview} onClose={closeModal} />}
        </div>
    )
}
