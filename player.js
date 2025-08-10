import { showError } from './ui.js';

export function setupPlayer(videoElementId) {
    let mainVideoPlayer = document.getElementById(videoElementId);
    let hlsInstance = null; // To manage HLS.js instance

    // Function to ensure the player is a <video> element
    function ensureVideoPlayer() {
        if (mainVideoPlayer.tagName.toLowerCase() !== 'video') {
            const newVideoPlayer = document.createElement('video');
            newVideoPlayer.id = videoElementId;
            newVideoPlayer.controls = true;
            newVideoPlayer.autoplay = true;
            mainVideoPlayer.parentNode.replaceChild(newVideoPlayer, mainVideoPlayer);
            mainVideoPlayer = newVideoPlayer; // Update the reference
        }
    }

    function playStream(streamUrl) {
        if (!streamUrl) {
            showError('No stream URL available for this channel.');
            return;
        }

        // Destroy existing HLS.js instance if any
        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
        }

        // Ensure we have a video element for playing
        ensureVideoPlayer();
        mainVideoPlayer.src = ''; // Clear current source
        mainVideoPlayer.load(); // Load to apply source clear

        if (streamUrl.includes('.m3u8')) {
            if (Hls.isSupported()) {
                hlsInstance = new Hls();
                hlsInstance.loadSource(streamUrl);
                hlsInstance.attachMedia(mainVideoPlayer);
                hlsInstance.on(Hls.Events.MANIFEST_PARSED, function() {
                    mainVideoPlayer.play().catch(e => {
                        console.error("Autoplay failed for HLS:", e);
                        showError("Autoplay blocked for HLS stream. Please click play manually.");
                    });
                });
                hlsInstance.on(Hls.Events.ERROR, function (event, data) {
                    if (data.fatal) {
                        switch(data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.error("fatal network error encountered, trying to recover");
                                hlsInstance.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.error("fatal media error encountered, trying to recover");
                                hlsInstance.recoverMediaError();
                                break;
                            default:
                                console.error("fatal HLS error:", data);
                                hlsInstance.destroy();
                                hlsInstance = null;
                                showError("Error playing HLS stream. Please try another channel.");
                                break;
                        }
                    }
                });
            } else if (mainVideoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support for Safari/iOS
                mainVideoPlayer.src = streamUrl;
                mainVideoPlayer.addEventListener('loadedmetadata', function() {
                    mainVideoPlayer.play().catch(e => {
                        console.error("Autoplay failed for native HLS:", e);
                        showError("Autoplay blocked for HLS stream. Please click play manually.");
                    });
                }, { once: true });
            } else {
                showError('Your browser does not support HLS streams directly or HLS.js failed to load.');
            }
        } else if (streamUrl.includes('.mp4') || streamUrl.includes('.webm') || streamUrl.includes('.ogg')) {
            mainVideoPlayer.src = streamUrl;
            mainVideoPlayer.load();
            mainVideoPlayer.play().catch(error => {
                console.error("Autoplay failed:", error);
                showError("Video autoplay blocked or failed. Please click play manually.");
            });
        } else {
            // Assume it's a direct embeddable URL for iframe
            const iframePlayer = document.createElement('iframe');
            iframePlayer.id = videoElementId;
            iframePlayer.src = streamUrl;
            iframePlayer.frameborder = '0';
            iframePlayer.allow = 'autoplay; fullscreen';
            iframePlayer.allowFullscreen = true;
            mainVideoPlayer.parentNode.replaceChild(iframePlayer, mainVideoPlayer);
            mainVideoPlayer = iframePlayer; // Update the reference
        }
    }

    return { playStream };
}

