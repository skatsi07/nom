import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { API_BASE_URL } from '../config';

export default function EditProfile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [bio, setBio] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [tiktokUrl, setTiktokUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Hardcoded for now
    const username = "skatsi07";

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: session } = await supabase.auth.getSession();
                const token = session.session?.access_token;
                const headers: HeadersInit = {}
                if (token) headers['Authorization'] = `Bearer ${token}`


                const res = await fetch(`${API_BASE_URL}/api/profile/${username}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setBio(data.bio || '');
                    setInstagramUrl(data.instagramUrl || '');
                    setTiktokUrl(data.tiktokUrl || '');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [username]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;
            if (!token) {
                alert("Not logged in");
                return;
            }

            const formData = new FormData();
            formData.append('bio', bio);
            formData.append('instagramUrl', instagramUrl);
            formData.append('tiktokUrl', tiktokUrl);
            if (selectedFile) {
                formData.append('image', selectedFile);
            }

            const res = await fetch(`${API_BASE_URL}/api/profile`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                navigate('/');
            } else {
                alert("Failed to update profile");
            }

        } catch (err) {
            console.error(err);
            alert("Error updating profile");
        }
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div className="app-wrapper">
            <header>
                <div className="nav-buttons">
                    <Link to="/" className="btn-dark">Cancel</Link>
                </div>
                <div className="logo">Edit Profile</div>
                <div style={{ width: '40px' }}></div>
            </header>

            <main className="main-content" style={{ padding: '20px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    <div className="form-group">
                        <label style={{ fontWeight: 600, marginBottom: '5px', display: 'block' }}>Update Bio</label>
                        <input type="text" value={bio} onChange={e => setBio(e.target.value)}
                            style={{ padding: '12px', width: '100%', border: '1px solid #ddd', borderRadius: '8px' }} />
                    </div>

                    <div className="form-group">
                        <label style={{ fontWeight: 600, marginBottom: '5px', display: 'block' }}>Profile Picture</label>
                        <input type="file" accept="image/png, image/jpeg" onChange={e => e.target.files && setSelectedFile(e.target.files[0])}
                            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', width: '100%', background: '#fff' }} />
                    </div>

                    <div className="form-group">
                        <label style={{ fontWeight: 600, marginBottom: '5px', display: 'block' }}>TikTok URL</label>
                        <input type="text" value={tiktokUrl} onChange={e => setTiktokUrl(e.target.value)} placeholder="https://www.tiktok.com/@yourprofile"
                            style={{ padding: '12px', width: '100%', border: '1px solid #ddd', borderRadius: '8px' }} />
                    </div>

                    <div className="form-group">
                        <label style={{ fontWeight: 600, marginBottom: '5px', display: 'block' }}>Instagram URL</label>
                        <input type="text" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://www.instagram.com/yourprofile"
                            style={{ padding: '12px', width: '100%', border: '1px solid #ddd', borderRadius: '8px' }} />
                    </div>

                    <button type="submit" className="btn-dark" style={{ padding: '15px', marginTop: '10px' }}>Save Changes</button>
                </form>
            </main>
        </div>
    )
}

