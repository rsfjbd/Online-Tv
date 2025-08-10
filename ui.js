import { isLive, getFavorites, toggleFavorite } from './utils.js';

// Elements for loading and errors
const loadingOverlay = document.getElementById('loading-overlay');
const errorMessageDiv = document.getElementById('error-message');

export function showLoading() {
    loadingOverlay.classList.add('show');
}

export function hideLoading() {
    loadingOverlay.classList.remove('show');
}

export function showError(message) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.add('show');
}

export function hideError() {
    errorMessageDiv.classList.remove('show');
}

// Function to display skeleton loaders
export function showSkeletons(container, count, className) {
    container.innerHTML = ''; // Clear existing content
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = `${className} skeleton`;
        container.appendChild(skeleton);
    }
}

export function renderLiveEvents(events, container) {
    container.innerHTML = ''; // Clear skeletons/previous content
    if (events.length === 0) {
        container.innerHTML = '<p>No live or upcoming events found.</p>';
        return;
    }
    events.forEach(event => {
        const isEventLive = isLive(event.date, event.time);
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.innerHTML = `
            ${isEventLive ? '<span class="live-badge">LIVE</span>' : ''}
            <h3>${event.title}</h3>
            <div class="event-logos">
                <img src="${event.logo1}" alt="${event.teams.split(' vs ')[0]} Logo">
                <span>vs</span>
                <img src="${event.logo2}" alt="${event.teams.split(' vs ')[1]} Logo">
            </div>
            <p>${event.teams}</p>
            <p>${event.date} - ${event.time}</p>
        `;
        container.appendChild(eventCard);
    });
}

export function renderSportsChannels(channels, container, playStreamCallback, type = 'all') {
    container.innerHTML = ''; // Clear skeletons/previous content
    if (channels.length === 0) {
        container.innerHTML = `<p>No ${type === 'favorites' ? 'favorite ' : ''}channels found.</p>`;
        return;
    }
    const favorites = getFavorites();
    channels.forEach(channel => {
        const isFavorite = favorites.some(fav => fav.name === channel.name);
        const favoriteIcon = isFavorite ? 'favorite' : 'favorite_border';

        const channelCard = document.createElement('div');
        channelCard.className = 'channel-card';
        channelCard.innerHTML = `
            <img src="${channel.logo}" alt="${channel.name} Logo">
            <p>${channel.name}</p>
            <span class="material-icons favorite-toggle" data-channel-name="${channel.name}" data-channel-stream="${channel.stream}">${favoriteIcon}</span>
        `;
        
        // Add listener for playing stream
        channelCard.addEventListener('click', (e) => {
            // Only play stream if not clicking the favorite icon
            if (!e.target.classList.contains('favorite-toggle')) {
                playStreamCallback(channel.stream);
            }
        });

        // Add listener for toggling favorite
        channelCard.querySelector('.favorite-toggle').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent playStream from being called when clicking favorite icon
            const name = e.target.dataset.channelName;
            const stream = e.target.dataset.channelStream;
            toggleFavorite(name, stream);
            e.target.innerText = getFavorites().some(fav => fav.name === name) ? 'favorite' : 'favorite_border'; // Update icon
            
            // If currently on favorites tab, re-render it to reflect changes
            const currentTabId = document.querySelector('.tab-content.active')?.id;
            if (currentTabId === 'favorites-tab') {
                const updatedFavorites = getFavorites();
                renderSportsChannels(updatedFavorites, document.querySelector('.favorites-grid'), playStreamCallback, 'favorites');
            }
        });

        container.appendChild(channelCard);
    });
}

export function renderCategories(categories, container) {
    container.innerHTML = ''; // Clear skeletons/previous content
    if (categories.length === 0) {
        container.innerHTML = '<p>No categories found.</p>';
        return;
    }
    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <span class="flag-icon">${category.flag}</span>
            <p>${category.name}</p>
        `;
        // Add event listener for category filtering if implemented later
        categoryCard.addEventListener('click', () => {
            alert(`Category: ${category.name} clicked! (Filtering not yet implemented)`);
        });
        container.appendChild(categoryCard);
    });
}

export function switchTab(tabId) {
    const tabContents = document.querySelectorAll('.tab-content');
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');

    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabId) {
            item.classList.add('active');
        }
    });
}

