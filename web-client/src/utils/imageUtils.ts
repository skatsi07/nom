
/**
 * Optimizes a Cloudinary URL by injecting transformation parameters.
 * 
 * @param url The original Cloudinary image URL.
 * @param width The desired width of the image.
 * @param height Optional. The desired height of the image.
 * @returns The optimized URL with transformation parameters.
 */
export function optimizeCloudinaryUrl(url: string | undefined, width: number, height?: number): string {
    if (!url) return '';
    if (!url.includes('cloudinary.com')) return url;

    // Check if the URL is valid Cloudinary URL structure
    // Standard format: https://res.cloudinary.com/<cloud_name>/image/upload/<version>/<public_id>
    // We want to insert transformations after '/upload/'

    const uploadSegment = '/upload/';
    const uploadIndex = url.indexOf(uploadSegment);

    if (uploadIndex === -1) return url;

    const transformationParams = [
        `w_${width}`,
        height ? `h_${height}` : '',
        'c_fill', // Crop mode: fill (good for thumbnails)
        'q_auto', // Quality: auto (WebP/AVIF if possible)
        'f_auto'  // Format: auto
    ].filter(Boolean).join(',');

    // Reconstruct URL
    const prefix = url.substring(0, uploadIndex + uploadSegment.length);
    const suffix = url.substring(uploadIndex + uploadSegment.length);

    return `${prefix}${transformationParams}/${suffix}`;
}
