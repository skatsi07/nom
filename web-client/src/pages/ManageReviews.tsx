import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface Review {
    id: number;
    placeName: string;
    date: string;
    overallRating: number;
}

export default function ManageReviews() {
    // State
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReviews = async () => {
        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;
            if (!token) {
                // Not logged in
                setLoading(false);
                return;
            }

            const headers: HeadersInit = { 'Authorization': `Bearer ${token}` };

            // 1. Get My Profile to know my username
            const meRes = await fetch(`http://localhost:8080/api/me`, { headers });
            if (!meRes.ok) throw new Error("Failed to fetch profile");
            const me = await meRes.json();

            // 2. Fetch My Reviews
            const res = await fetch(`http://localhost:8080/api/reviews?username=${me.username}`, { headers });
            if (res.ok) {
                setReviews(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this review?")) return;

        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;
            if (!token) {
                alert("Login required");
                return;
            }

            const res = await fetch(`http://localhost:8080/api/reviews/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setReviews(prev => prev.filter(r => r.id !== id));
            } else {
                alert("Failed to delete");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting review");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="app-wrapper">
            <header>
                <div className="nav-buttons">
                    <Link to="/" className="btn-icon"><i className="fas fa-arrow-left"></i></Link>
                </div>
                <div className="logo">My Reviews</div>
                <div style={{ width: '40px' }}></div>
            </header>

            <main className="main-content" style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ marginBottom: '10px' }}>Select a review to edit</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {reviews.length === 0 && <p className="text-center text-gray-500">No reviews found.</p>}

                    {reviews.map(review => (
                        <div key={review.id} style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <strong style={{ fontSize: '1.1rem', display: 'block' }}>{review.placeName}</strong>
                                <span style={{ color: '#888', fontSize: '0.9rem' }}>{review.date}</span>
                                <div style={{ color: '#e5c100', fontSize: '0.9rem', marginTop: '5px' }}>
                                    {review.overallRating} ★
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <Link to={`/edit/${review.id}`} className="btn-dark" style={{ padding: '8px 15px', textDecoration: 'none', fontSize: '0.9rem' }}>
                                    Edit <i className="fas fa-pen" style={{ marginLeft: '5px' }}></i>
                                </Link>
                                <button onClick={() => handleDelete(review.id)} className="btn-red" style={{ border: 'none', cursor: 'pointer' }}>
                                    Delete <i className="fas fa-trash" style={{ marginLeft: '5px' }}></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}

