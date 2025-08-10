// Function to check if an event is live based on current time (Bangladesh)
export function isLive(eventDate, eventTime) {
    // Current year is 2025 as per current time provided in context
    const currentYear = 2025;

    // Parse event date (DD/MM/YYYY)
    const [day, month, year] = eventDate.split('/').map(Number);

    // Parse event time (HH:MM AM/PM)
    const timeMatch = eventTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!timeMatch) {
        console.warn('Invalid event time format:', eventTime);
        return false;
    }
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3] ? timeMatch[3].toUpperCase() : '';

    if (ampm === 'PM' && hours !== 12) {
        hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
        hours = 0; // Midnight (12 AM) is 0 hours
    }

    // Create event date object (Month is 0-indexed in JS Date)
    const eventDateTime = new Date(currentYear, month - 1, day, hours, minutes);

    // Get current time in Bangladesh (GMT+6)
    const now = new Date();
    const localOffset = now.getTimezoneOffset() * 60 * 1000; // Offset in milliseconds
    const bangladeshOffset = 6 * 60 * 60 * 1000; // GMT+6 in milliseconds
    const nowBangladesh = new Date(now.getTime() + localOffset + bangladeshOffset);

    // Define "live" window (e.g., started within the last 2 hours, ends within the next 4 hours)
    const twoHoursAgo = new Date(nowBangladesh.getTime() - (2 * 60 * 60 * 1000));
    const fourHoursFromNow = new Date(nowBangladesh.getTime() + (4 * 60 * 60 * 1000));

    return eventDateTime <= nowBangladesh && eventDateTime >= twoHoursAgo && eventDateTime < fourHoursFromNow;
}

// Local Storage Utility for Favorites
export function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem('mrxTvFavorites') || '[]');
    } catch (e) {
        console.error("Error parsing favorites from localStorage:", e);
        return [];
    }
}

export function saveFavorites(favorites) {
    try {
        localStorage.setItem('mrxTvFavorites', JSON.stringify(favorites));
    } catch (e) {
        console.error("Error saving favorites to localStorage:", e);
    }
}

export function toggleFavorite(channelName, channelStream) {
    let favorites = getFavorites();
    const existingIndex = favorites.findIndex(fav => fav.name === channelName);

    if (existingIndex > -1) {
        favorites.splice(existingIndex, 1); // Remove
        // alert(`${channelName} removed from favorites.`); // Consider less intrusive feedback
    } else {
        favorites.push({ name: channelName, stream: channelStream }); // Add
        // alert(`${channelName} added to favorites!`); // Consider less intrusive feedback
    }
    saveFavorites(favorites);
    return favorites; // Return updated favorites
}

