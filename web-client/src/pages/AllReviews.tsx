import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { optimizeCloudinaryUrl } from '../utils/imageUtils'
import ReviewModal from '../components/ReviewModal';
import { PREDEFINED_TAGS } from '../constants/tags';
import { API_BASE_URL } from '../config';

interface ReviewPhoto { id: number; photoUrl: string; photoOrder: number; }
interface FoodItem { id: number; name: string; rating: number; description: string; }
interface Review {
    id: number; placeName: string; date: string; overallRating: number;
    cuisine: string; tags: string; pricePerPerson: number; instagramUrl: string;
    tiktokUrl: string; overallDesc: string; foodScore: number; serviceScore: number;
    ambianceScore: number; photos: ReviewPhoto[]; foodItems: FoodItem[];
}
interface UserProfile {
    username: string; name: string; bio: string; profilePicUrl: string;
    instagramUrl: string; tiktokUrl: string;
}

export default function AllReviews() {
    const { username } = useParams<{ username: string }>()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const activeTagsStr = searchParams.get('tags') || ''
    const activeTags = activeTagsStr ? activeTagsStr.split(',') : []
    const activeStartDate = searchParams.get('startDate') || ''
    const activeEndDate = searchParams.get('endDate') || ''

    const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false)
    const [tempSelectedTags, setTempSelectedTags] = useState<string[]>([])
    const dropdownRef = useRef<HTMLDivElement>(null)

    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false)
    const [tempStartDate, setTempStartDate] = useState(activeStartDate)
    const [tempEndDate, setTempEndDate] = useState(activeEndDate)
    const dateDropdownRef = useRef<HTMLDivElement>(null)

    const [user, setUser] = useState<UserProfile | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [loadingProfile, setLoadingProfile] = useState(true)
    const [loadingReviews, setLoadingReviews] = useState(false)
    const [selectedReview, setSelectedReview] = useState<Review | null>(null)

    useEffect(() => { setTempSelectedTags(activeTags) }, [activeTagsStr])
    useEffect(() => { setTempStartDate(activeStartDate); setTempEndDate(activeEndDate) }, [activeStartDate, activeEndDate])

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsTagDropdownOpen(false);
            if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) setIsDateDropdownOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const observer = useRef<IntersectionObserver | null>(null)
    const lastReviewElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loadingReviews) return
        if (observer.current) observer.current.disconnect()
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) setPage(p => p + 1)
        })
        if (node) observer.current.observe(node)
    }, [loadingReviews, hasMore])

    useEffect(() => { setPage(0); setReviews([]); setHasMore(true) }, [activeTagsStr, activeStartDate, activeEndDate])

    useEffect(() => {
        const fetchProfile = async () => {
            if (!username) return
            try {
                const { data: session } = await supabase.auth.getSession()
                const token = session.session?.access_token
                const headers: HeadersInit = {}
                if (token) headers['Authorization'] = `Bearer ${token}`
                const res = await fetch(`${API_BASE_URL}/api/profile/${username}`, { headers })
                if (res.ok) setUser(await res.json())
            } catch (err) { console.error(err) }
            finally { setLoadingProfile(false) }
        }
        fetchProfile()
    }, [username])

    useEffect(() => {
        const fetchReviews = async () => {
            if (!username || !hasMore) return
            setLoadingReviews(true)
            try {
                const { data: session } = await supabase.auth.getSession()
                const token = session.session?.access_token
                const headers: HeadersInit = {}
                if (token) headers['Authorization'] = `Bearer ${token}`
                let url = `${API_BASE_URL}/api/reviews?username=${username}&page=${page}&size=12`
                if (activeTagsStr) url += `&tags=${encodeURIComponent(activeTagsStr)}`
                if (activeStartDate) url += `&startDate=${encodeURIComponent(activeStartDate)}`
                if (activeEndDate) url += `&endDate=${encodeURIComponent(activeEndDate)}`
                const res = await fetch(url, { headers })
                if (res.ok) {
                    const d = await res.json()
                    setReviews(prev => {
                        if (page === 0) return d.content;
                        const ids = new Set(prev.map((r: Review) => r.id))
                        return [...prev, ...d.content.filter((r: Review) => !ids.has(r.id))]
                    })
                    if (d.last) setHasMore(false)
                    else if (page === 0) setHasMore(true)
                }
            } catch (err) { console.error(err) }
            finally { setLoadingReviews(false) }
        }
        fetchReviews()
    }, [username, page, activeTagsStr, activeStartDate, activeEndDate])

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

    return (
        <div className="nom-page">
            <div className="nom-container nom-container-wide">

                {/* ── COMPACT PROFILE CARD ── */}
                <div className="nom-card profile-hero-card">
                    <div className="profile-banner" />
                    <div className="profile-body">
                        <div className="profile-avatar-wrap">
                            {loadingProfile
                                ? <div className="profile-avatar skeleton-circle" />
                                : (
                                    <div className="profile-avatar">
                                        {user?.profilePicUrl
                                            ? <img src={user.profilePicUrl} alt="Me" />
                                            : <span>{user?.name?.charAt(0) ?? '?'}</span>}
                                    </div>
                                )}
                        </div>

                        {loadingProfile ? (
                            <div className="profile-identity">
                                <div className="skel skel-sm" style={{ margin: '0 auto 6px' }} />
                                <div className="skel skel-lg" style={{ margin: '0 auto' }} />
                            </div>
                        ) : (
                            <div className="profile-identity">
                                <p className="profile-username">@{user?.username}</p>
                                <h1 className="profile-name">{user?.name}</h1>
                                {user?.bio && <p className="profile-bio">{user.bio}</p>}
                            </div>
                        )}

                        {!loadingProfile && (
                            <div className="profile-socials">
                                {user?.instagramUrl && (
                                    <a href={user.instagramUrl} target="_blank" rel="noreferrer" className="btn-social-pill">
                                        <i className="fab fa-instagram" /> Instagram
                                    </a>
                                )}
                                {user?.tiktokUrl && (
                                    <a href={user.tiktokUrl} target="_blank" rel="noreferrer" className="btn-social-pill">
                                        <i className="fab fa-tiktok" /> TikTok
                                    </a>
                                )}
                            </div>
                        )}

                        <Link to={`/profile/${username}`} className="btn-back-profile">
                            ← Back to Profile
                        </Link>
                    </div>
                </div>

                {/* ── SEARCH + FILTERS ── */}
                <div className="reviews-controls">
                    <div className="search-pill-wrap">
                        <i className="fas fa-search search-pill-icon" />
                        <input type="text" className="search-pill-input" placeholder="Search reviews..." />
                    </div>

                    <div className="filter-chips-row">
                        {/* Cuisine */}
                        <div className="filter-chip-wrap" ref={dropdownRef}>
                            <button
                                className={`filter-chip${activeTags.length > 0 ? ' filter-chip-active' : ''}`}
                                onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                            >
                                {activeTags.length > 0 ? `Cuisine (${activeTags.length})` : 'Cuisine'}
                                <i className={`fas fa-chevron-down filter-chip-arrow${isTagDropdownOpen ? ' rotated' : ''}`} />
                            </button>
                            {isTagDropdownOpen && (
                                <div className="filter-dropdown">
                                    <p className="filter-dropdown-label">Select Cuisines</p>
                                    <div className="filter-dropdown-list">
                                        {PREDEFINED_TAGS.map(t => (
                                            <label key={t.label} className="filter-dropdown-item">
                                                <input
                                                    type="checkbox"
                                                    checked={tempSelectedTags.includes(t.label)}
                                                    onChange={e => {
                                                        if (e.target.checked) setTempSelectedTags([...tempSelectedTags, t.label]);
                                                        else setTempSelectedTags(tempSelectedTags.filter(x => x !== t.label));
                                                    }}
                                                />
                                                <span>{t.emoji} {t.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="filter-dropdown-actions">
                                        <button className="filter-action-clear" onClick={() => { setTempSelectedTags([]); setIsTagDropdownOpen(false); navigate(`/profile/${username}/reviews`); }}>Clear</button>
                                        <button className="filter-action-apply" onClick={() => { setIsTagDropdownOpen(false); navigate(tempSelectedTags.length > 0 ? `/profile/${username}/reviews?tags=${encodeURIComponent(tempSelectedTags.join(','))}` : `/profile/${username}/reviews`); }}>Apply</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Date */}
                        <div className="filter-chip-wrap" ref={dateDropdownRef}>
                            <button
                                className={`filter-chip${(activeStartDate || activeEndDate) ? ' filter-chip-active' : ''}`}
                                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                            >
                                {(activeStartDate || activeEndDate) ? 'Date ✓' : 'Date'}
                                <i className={`fas fa-chevron-down filter-chip-arrow${isDateDropdownOpen ? ' rotated' : ''}`} />
                            </button>
                            {isDateDropdownOpen && (
                                <div className="filter-dropdown">
                                    <p className="filter-dropdown-label">Filter by Date</p>
                                    <div className="filter-date-fields">
                                        <div>
                                            <label className="filter-date-label">Start Date</label>
                                            <input type="date" className="filter-date-input" value={tempStartDate} onChange={e => setTempStartDate(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="filter-date-label">End Date</label>
                                            <input type="date" className="filter-date-input" value={tempEndDate} onChange={e => setTempEndDate(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="filter-dropdown-actions">
                                        <button className="filter-action-clear" onClick={() => { setTempStartDate(''); setTempEndDate(''); setIsDateDropdownOpen(false); const p = new URLSearchParams(searchParams); p.delete('startDate'); p.delete('endDate'); navigate(`/profile/${username}/reviews?${p.toString()}`); }}>Clear</button>
                                        <button className="filter-action-apply" onClick={() => { setIsDateDropdownOpen(false); const p = new URLSearchParams(searchParams); if (tempStartDate) p.set('startDate', tempStartDate); else p.delete('startDate'); if (tempEndDate) p.set('endDate', tempEndDate); else p.delete('endDate'); navigate(`/profile/${username}/reviews?${p.toString()}`); }}>Apply</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button className="filter-chip">Stars</button>
                        <button className="filter-chip">Price</button>
                        <div className="filter-chips-spacer" />
                        <button className="filter-chip">Sort <i className="fas fa-chevron-down filter-chip-arrow" /></button>
                    </div>
                </div>

                {/* ── REVIEW GRID ── */}
                {reviews.length === 0 && !loadingReviews ? (
                    <div className="nom-card empty-state">
                        <i className="fas fa-utensils empty-icon" />
                        <p className="empty-title">No reviews found</p>
                        <p className="empty-sub">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="review-card-grid">
                        {reviews.map((review, index) => {
                            const isLast = reviews.length === index + 1;
                            return (
                                <div
                                    ref={isLast ? lastReviewElementRef : null}
                                    key={review.id}
                                    className="review-card"
                                    onClick={() => openModal(review)}
                                >
                                    <div className="review-card-photo">
                                        {review.photos && review.photos.length > 0
                                            ? <img src={optimizeCloudinaryUrl(review.photos[0].photoUrl, 400, 400)} loading="lazy" alt={review.placeName} />
                                            : <div className="review-card-no-photo"><i className="fas fa-utensils" /></div>
                                        }
                                    </div>
                                    <div className="review-card-info">
                                        <h3 className="review-card-name">{review.placeName}</h3>
                                        <div className="review-card-stars">{renderStars(review.overallRating)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {loadingReviews && (
                    <div className="loading-row">
                        <span className="loading-spinner" />
                    </div>
                )}

                {!hasMore && reviews.length > 0 && !loadingReviews && (
                    <div className="end-of-results">
                        <span className="end-line" /><span className="end-text">All caught up</span><span className="end-line" />
                    </div>
                )}

            </div>

            {selectedReview && <ReviewModal review={selectedReview} onClose={closeModal} />}
        </div>
    )
}
