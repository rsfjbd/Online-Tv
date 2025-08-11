// script.js (Main Application Logic)
// This file imports functions from other modular files (ui.js, utils.js, player.js)
// to keep the main logic clean and organized.

import {
    showLoading,
    hideLoading,
    showError,
    hideError,
    showSkeletons,
    renderLiveEvents,
    renderSportsChannels,
    renderCategories,
    switchTab
} from './ui.js';
import {
    getFavorites
} from './utils.js';
import {
    setupPlayer
} from './player.js';

document.addEventListener('DOMContentLoaded', () => {
    // IMPORTANT: Update these URLs to your GitHub raw files!
    // Your M3U playlist for sports channels
    const M3U_PLAYLIST_URL = 'https://raw.githubusercontent.com/rsfjbd/Mix-Playlist/refs/heads/main/rsbd.m3u';
    // Your static JSON data for live events and categories (if not in M3U)
    const STATIC_DATA_URL = 'https://raw.githubusercontent.com/sultanarabi161/Toffee-channel-bypass/refs/heads/main/toffee_channel_data.json';


    // --- DOM Elements ---
    const liveEventsGrid = document.querySelector('.live-events-grid');
    const sportsChannelsGrid = document.querySelector('.sports-channels-grid');
    const categoriesGrid = document.querySelector('.categories-grid');
    const favoritesGrid = document.querySelector('.favorites-grid'); // Added for favorites tab
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    const searchIcon = document.querySelector('.search-icon');
    const topBar = document.querySelector('.top-bar'); // For dynamically adding search input

    // --- Player Setup ---
    // Initialize the player module and get its playStream function
    const player = setupPlayer('main-video-player');
    const playStream = player.playStream;

    // --- Global Data Store ---
    // This will hold all fetched and parsed data
    let allData = {
        live_events: [],
        sports_channels: [], // This will be populated from M3U
        categories: []
    };

    // --- M3U Playlist Parsing Function ---
    async function parseM3U(m3uContent) {
        const lines = m3uContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const channels = [];
        let currentChannel = {};

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('#EXTINF')) {
                // Extract attributes and channel name
                // Example: #EXTINF:-1 tvg-id="channel1" tvg-name="Channel One" tvg-logo="http://example.com/logo1.png",Channel One
                const regex = /#EXTINF:-1\s*(.*?),(.*)/;
                const match = line.match(regex);

                if (match) {
                    const attributes = match[1];
                    const channelName = match[2];

                    currentChannel = {
                        name: channelName,
                        logo: '', // Default empty logo, will be updated if tvg-logo found
                        stream: ''
                    };

                    // Parse attributes like tvg-logo
                    const logoMatch = attributes.match(/tvg-logo="([^"]+)"/);
                    if (logoMatch) {
                        currentChannel.logo = logoMatch[1];
                    }
                    // You can add more attribute parsing here if needed (e.g., tvg-id, group-title)
                }
            } else if (line.startsWith('http')) {
                // This is the stream URL, associated with the last #EXTINF line
                currentChannel.stream = line;
                if (currentChannel.name && currentChannel.stream) {
                    // Only push if both name and stream are found
                    channels.push(currentChannel);
                }
                currentChannel = {}; // Reset for the next channel entry
            }
        }
        return channels;
    }

    // --- Main Data Fetching Function ---
    async function fetchData() {
        showLoading(); // Show global loading spinner
        hideError(); // Hide any previous error messages

        // Show skeleton loaders in respective grids
        showSkeletons(liveEventsGrid, 3, 'event-card'); // 3 skeleton event cards
        showSkeletons(sportsChannelsGrid, 6, 'channel-card'); // 6 skeleton channel cards
        showSkeletons(categoriesGrid, 4, 'category-card'); // 4 skeleton category cards

        try {
            // 1. Fetch M3U Playlist for Sports Channels
            const m3uResponse = await fetch(M3U_PLAYLIST_URL);
            if (!m3uResponse.ok) {
                throw new Error(`Failed to fetch M3U playlist! Status: ${m3uResponse.status}`);
            }
            const m3uContent = await m3uResponse.text();
            allData.sports_channels = await parseM3U(m3uContent);
            console.log("M3U channels loaded:", allData.sports_channels);


            // 2. Fetch Static Data for Live Events and Categories (from data.json)
            const staticDataResponse = await fetch(STATIC_DATA_URL);
            if (!staticDataResponse.ok) {
                throw new Error(`Failed to fetch static data! Status: ${staticDataResponse.status}`);
            }
            const staticData = await staticDataResponse.json();
            allData.live_events = staticData.live_events || [];
            allData.categories = staticData.categories || [];
            console.log("Static data loaded:", staticData);


            // Render all sections with the fetched and parsed data
            renderLiveEvents(allData.live_events, liveEventsGrid);
            renderSportsChannels(allData.sports_channels, sportsChannelsGrid, playStream);
            renderCategories(allData.categories, categoriesGrid);

            // Automatically play the first sports channel stream on initial load if available
            if (allData.sports_channels && allData.sports_channels.length > 0) {
                playStream(allData.sports_channels[0].stream);
            }

        } catch (error) {
            console.error("Could not fetch or parse data:", error);
            showError(`Failed to load content: ${error.message}. Please check your URLs and internet connection.`);
        } finally {
            hideLoading(); // Hide global loading spinner
        }
    }

    // --- Tab Switching Logic ---
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            const tabId = item.dataset.tab; // Get the target tab ID from data-tab attribute

            switchTab(tabId); // Activate the selected tab

            // Special handling for the Favorites tab
            if (tabId === 'favorites-tab') {
                const favorites = getFavorites(); // Get current favorites from local storage
                // Render favorites channels in the favorites grid
                renderSportsChannels(favorites, favoritesGrid, playStream, 'favorites');
            }
        });
    });

    // --- Search Functionality ---
    let searchInput = null; // Variable to hold the dynamically created search input element

    searchIcon.addEventListener('click', () => {
        if (searchInput) {
            // If search input is already visible, remove it
            searchInput.remove();
            searchInput = null;
            // Re-render original content after hiding search
            renderLiveEvents(allData.live_events, liveEventsGrid);
            renderSportsChannels(allData.sports_channels, sportsChannelsGrid, playStream);
        } else {
            // If search input is not visible, create and append it
            searchInput = document.createElement('input');
            searchInput.id = 'search-input';
            searchInput.type = 'text';
            searchInput.placeholder = 'Search channels or events...';
            topBar.appendChild(searchInput); // Add search input to the top bar
            searchInput.focus(); // Focus on the input field for immediate typing

            // Add an input event listener to filter content as user types
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase(); // Get the search query

                // Filter live events based on title or teams
                const filteredLiveEvents = allData.live_events.filter(event =>
                    event.title.toLowerCase().includes(query) ||
                    event.teams.toLowerCase().includes(query)
                );
                // Filter sports channels based on name
                const filteredSportsChannels = allData.sports_channels.filter(channel =>
                    channel.name.toLowerCase().includes(query)
                );

                // Render the filtered results
                renderLiveEvents(filteredLiveEvents, liveEventsGrid);
                renderSportsChannels(filteredSportsChannels, sportsChannelsGrid, playStream);

                // Automatically switch to the "Live Events" tab to show search results
                // You could also create a dedicated "Search Results" tab
                switchTab('live-events-tab');
            });
        }
    });

    // --- Initial Application Load ---
    fetchData(); // Fetch all initial data
    switchTab('live-events-tab'); // Set the "Live Events" tab as active by default
});

