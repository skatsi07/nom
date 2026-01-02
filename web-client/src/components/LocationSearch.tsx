import { useState, useEffect, useRef } from 'react';
import { searchPlaces } from '../services/locationService';
import type { UnifiedLocation } from '../services/locationService';

interface LocationSearchProps {
    onLocationSelect: (location: UnifiedLocation) => void;
    initialValue?: string;
    placeholder?: string;
}

export default function LocationSearch({ onLocationSelect, initialValue = '', placeholder = 'Search for a place...' }: LocationSearchProps) {
    const [query, setQuery] = useState(initialValue);
    const [results, setResults] = useState<UnifiedLocation[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length < 3) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        // Debounce could be added here, but for now direct call
        try {
            const places = await searchPlaces(val);
            setResults(places);
            setIsOpen(true);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (loc: UnifiedLocation) => {
        setQuery(loc.name);
        setIsOpen(false);
        onLocationSelect(loc);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            {/* Label removed to allow flexible external labeling */}
            <input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
            />

            {isOpen && results.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    {results.map((place, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSelect(place)}
                            style={{
                                padding: '10px',
                                cursor: 'pointer',
                                borderBottom: idx < results.length - 1 ? '1px solid #eee' : 'none'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                            <div style={{ fontWeight: 'bold' }}>{place.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{place.address}</div>
                        </div>
                    ))}
                </div>
            )}
            {isOpen && results.length === 0 && !loading && query.length >= 3 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#666'
                }}>
                    No results found.
                </div>
            )}
        </div>
    );
}
