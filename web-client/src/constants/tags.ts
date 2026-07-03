export interface Tag {
    label: string;
    emoji?: string;
}

export const PREDEFINED_TAGS: Tag[] = [
    { label: 'Pizza', emoji: '🍕' },
    { label: 'Burger', emoji: '🍔' },
    { label: 'Sushi', emoji: '🍣' },
    { label: 'Tacos', emoji: '🌮' },
    { label: 'Noodles', emoji: '🍜' },
    { label: 'Steak', emoji: '🥩' },
    { label: 'Coffee', emoji: '☕' },
    { label: 'Italian', emoji: '🇮🇹' },
    { label: 'Greek', emoji: '🇬🇷' },
    { label: 'Japanese', emoji: '🇯🇵' },
    { label: 'Mexican', emoji: '🇲🇽' },
    { label: 'Modern Australian', emoji: '🇦🇺' }
];
