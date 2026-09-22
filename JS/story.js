/* =========================================================
   STORY LOGIC (DYNAMIC FROM GOOGLE SHEETS)
========================================================= */

// URL to fetch "Sheet2" using Google Visualization API (returns CSV)
const STORY_SHEET_URL = "https://docs.google.com/spreadsheets/d/1OPP7gnKAj-a7LimDhUwSYRmn6Rsqe_BuXDEa2143ap8/gviz/tq?tqx=out:csv&sheet=Sheet2";

// Default fallback story (if sheet is empty or fails to load)
// Global State
let STORY_QUEUE = [];
let CURRENT_STORY_INDEX = 0;
let STORY_TIMER_ID;
let IS_PAUSED = false;
let REMAINING_TIME = 0;
let START_TIME = 0;
let CLICK_START_TIME = 0;

// Run initialization safely whether script is loaded sync or async
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStoryRing);
} else {
    initStoryRing();
}

// 1. Helper to parse CSV
function csvToArray(text) {
    let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
    for (l of text) {
        if ('"' === l) {
            if (s && l === p) row[i] += l;
            s = !s;
        } else if (',' === l && s) l = row[++i] = '';
        else if ('\n' === l && s) {
            if ('\r' === p) row[i] = row[i].slice(0, -1);
            row = ret[++r] = [l = '']; i = 0;
        } else row[i] += l;
        p = l;
    }
    return ret;
}

// Convert Google Drive links into direct viewable links
function getDirectMediaUrl(url, type) {
    if (!url) return url;
    const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
        if (type === 'video') {
            return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
        } else {
            return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1200-h2000`;
        }
    }
    return url;
}

// Helper to convert absolute timestamp to Instagram-style relative time
function timeSince(dateString) {
    if (!dateString || dateString === "Just now") return "Just now";
    const safeDate = dateString.trim().replace(' ', 'T');
    const date = new Date(safeDate);
    if (isNaN(date.getTime())) return dateString;
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 0) return "Just now"; 
    let interval = seconds / 31536000;
    if (interval >= 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval >= 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval >= 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval >= 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval >= 1) return Math.floor(interval) + "m";
    return "Just now";
}

// 2. Fetch the data dynamically from Sheet2
async function fetchStoryData() {
    try {
        const response = await fetch(STORY_SHEET_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error("Network response was not ok");
        
        const csvText = await response.text();
        const rows = csvToArray(csvText.trim());
        
        STORY_QUEUE = [];
        
        for (let i = 1; i < rows.length; i++) {
            const data = rows[i];
            if (!data || data.length < 2) continue;
            
            if (data[1] && data[1].trim() !== "") {
                const rawUrl = data[1].trim();
                const typeVal = data[5] ? data[5].trim().toLowerCase() : "image";
                
                // Expiration Logic
                let isExpired = false;
                if (data.length > 6 && data[6] && data[6].trim() !== "") {
                    const expireStr = data[6].trim().toLowerCase();
                    let expireHours = 24;
                    if (expireStr.endsWith('h')) {
                        expireHours = parseFloat(expireStr) || 24;
                    } else if (expireStr.endsWith('d')) {
                        expireHours = (parseFloat(expireStr) || 1) * 24;
                    }
                    
                    const safeDate = data[3] ? data[3].trim().replace(' ', 'T') : null;
                    const postDate = safeDate ? new Date(safeDate) : new Date();
                    
                    if (!isNaN(postDate.getTime())) {
                        const diffHours = (new Date() - postDate) / (1000 * 60 * 60);
                        if (diffHours >= expireHours) {
                            isExpired = true;
                        }
                    }
                }
                
                if (!isExpired) {
                    STORY_QUEUE.push({
                        title: data[0] ? data[0].trim() : "Story",
                        mediaUrl: getDirectMediaUrl(rawUrl, typeVal),
                        rawUrl: rawUrl,
                        caption: data[2] ? data[2].trim() : "",
                        timePosted: data[3] ? data[3].trim() : "Just now",
                        durationMs: data[4] ? parseInt(data[4].replace(/,/g, '').trim()) || 5000 : 5000,
                        resourceType: typeVal
                    });
                }
            }
        }
        
        // Reset watched status if there's a new latest story
        if (STORY_QUEUE.length > 0) {
            const latestStory = STORY_QUEUE[STORY_QUEUE.length - 1];
            const lastWatchedUrl = localStorage.getItem('lastWatchedStoryUrl');
            if (lastWatchedUrl !== latestStory.rawUrl) {
                localStorage.removeItem('brandStoryWatched');
            }
        }
    } catch (e) {
        console.error("Failed to load story from Google Sheets:", e);
    }
}

async function initStoryRing() {
    await fetchStoryData();

    if (STORY_QUEUE.length === 0) return; // Stop if empty

    const checkExist = setInterval(() => {
        const brand = document.querySelector('.brand');
        if (brand) {
            clearInterval(checkExist);
            setupStory(brand);
        }
    }, 100); 
}

function setupStory(brand) {
    if (brand.classList.contains('story-active')) return;
    brand.classList.add('story-active');

    const isWatched = localStorage.getItem('brandStoryWatched') === 'true';
    if (isWatched) {
        brand.classList.add('story-watched');
    }

    brand.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Mark as watched
        localStorage.setItem('brandStoryWatched', 'true');
        if (STORY_QUEUE.length > 0) {
            localStorage.setItem('lastWatchedStoryUrl', STORY_QUEUE[STORY_QUEUE.length - 1].rawUrl);
        }
        brand.classList.add('story-watched');
        
        openStoryViewer();
    });
}

let touchStartY = 0;

function openStoryViewer() {
    let viewer = document.getElementById('storyViewer');
    
    // Create DOM structure if missing
    if (!viewer) {
        viewer = document.createElement('div');
        viewer.id = 'storyViewer';
        
        viewer.innerHTML = `
            <div class="story-viewer-content">
                <div class="story-header">
                    <div class="story-progress"></div>
                    <div class="story-header-info">
                        <span class="story-author"></span>
                        <span class="story-time"></span>
                        <div class="story-header-actions" style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
                            <!-- Mute and Close injected dynamically -->
                        </div>
                    </div>
                </div>
                <div class="story-body"></div>
                <div class="story-footer">
                    <div class="story-caption"></div>
                </div>
            </div>
        `;
        document.body.appendChild(viewer);

        viewer.addEventListener('click', (e) => {
            if (e.target === viewer) closeStoryViewer();
        });
        
        const storyContent = viewer.querySelector('.story-viewer-content');
        
        // Setup Hold vs Tap navigation
        storyContent.onmousedown = handleHoldStart;
        storyContent.onmouseup = handleHoldEnd;
        storyContent.onmouseleave = resumeStory;
        
        storyContent.addEventListener('touchstart', handleHoldStart, {passive: true});
        storyContent.addEventListener('touchend', handleHoldEnd);
        storyContent.addEventListener('touchcancel', resumeStory);
    }

    viewer.style.display = 'flex';
    renderStory(0);
}

function preloadNextStory(index) {
    if (index + 1 < STORY_QUEUE.length) {
        const next = STORY_QUEUE[index + 1];
        if (next.resourceType === 'image') {
            const img = new Image();
            img.src = next.mediaUrl;
        } else {
            const vid = document.createElement('video');
            vid.preload = 'auto';
            vid.src = next.mediaUrl;
        }
    }
}

function renderStory(index) {
    if (index < 0) index = 0;
    if (index >= STORY_QUEUE.length) {
        closeStoryViewer();
        return;
    }
    
    CURRENT_STORY_INDEX = index;
    const story = STORY_QUEUE[index];
    const viewer = document.getElementById('storyViewer');
    
    // Update Progress Bars
    const progressContainer = viewer.querySelector('.story-progress');
    progressContainer.innerHTML = '';
    for (let i = 0; i < STORY_QUEUE.length; i++) {
        const seg = document.createElement('div');
        seg.className = 'story-progress-segment';
        const bar = document.createElement('div');
        bar.className = 'story-progress-bar';
        if (i < index) bar.style.width = '100%';
        else bar.style.width = '0%';
        seg.appendChild(bar);
        progressContainer.appendChild(seg);
    }
    
    // Update Info
    viewer.querySelector('.story-author').textContent = story.title;
    viewer.querySelector('.story-time').textContent = timeSince(story.timePosted);
    
    // Clear old state & show spinner
    clearTimeout(STORY_TIMER_ID);
    IS_PAUSED = true; // Stay paused while loading
    
    const mediaContainer = viewer.querySelector('.story-body');
    mediaContainer.innerHTML = '<div class="story-spinner"></div>';
    
    const actionsContainer = viewer.querySelector('.story-header-actions');
    let mediaEl;

    if (story.resourceType === 'video') {
        actionsContainer.innerHTML = `
            <button class="story-mute-btn" aria-label="Toggle Mute">🔇</button>
            <button class="story-close" aria-label="Close Story">&times;</button>
        `;
        
        mediaEl = document.createElement('video');
        mediaEl.src = story.mediaUrl;
        mediaEl.autoplay = true;
        mediaEl.muted = true;
        mediaEl.playsInline = true;
        mediaEl.className = 'story-media';
        mediaEl.style.display = 'none';
        
        const muteBtn = actionsContainer.querySelector('.story-mute-btn');
        muteBtn.onclick = (e) => {
            e.stopPropagation();
            mediaEl.muted = !mediaEl.muted;
            muteBtn.textContent = mediaEl.muted ? '🔇' : '🔊';
        };
        
        mediaEl.onloadeddata = () => startStoryTimer(mediaEl);
    } else {
        actionsContainer.innerHTML = `<button class="story-close" aria-label="Close Story">&times;</button>`;
        
        mediaEl = new Image();
        mediaEl.src = story.mediaUrl;
        mediaEl.className = 'story-media';
        mediaEl.draggable = false;
        mediaEl.ondragstart = () => false;
        mediaEl.style.display = 'none';
        
        mediaEl.onload = () => startStoryTimer(mediaEl);
    }
    
    mediaEl.onerror = () => {
        mediaContainer.innerHTML = `<div style="color: white; text-align: center; padding: 20px;">⚠️ <b>Media Failed to Load</b><br><br>If this is a <b>Google Drive</b> link, ensure General Access is "Anyone with the link".</div>`;
        startStoryTimer(null); // Proceed anyway after default duration
    };
    
    mediaContainer.appendChild(mediaEl);
    actionsContainer.querySelector('.story-close').addEventListener('click', closeStoryViewer);
    
    // Preload the next story
    preloadNextStory(index);
    
    // Caption
    const captionEl = viewer.querySelector('.story-caption');
    if (story.caption) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        let formattedCaption = story.caption;
        if (urlRegex.test(formattedCaption)) {
            formattedCaption = formattedCaption.replace(urlRegex, url => `<a href="${url}" target="_blank" class="story-link-sticker">View Link ↗</a>`);
        }
        captionEl.innerHTML = formattedCaption;
        captionEl.style.display = 'block';
    } else {
        captionEl.style.display = 'none';
    }

    function startStoryTimer(loadedMedia) {
        const spinner = mediaContainer.querySelector('.story-spinner');
        if (spinner) spinner.remove();
        if (loadedMedia) loadedMedia.style.display = 'block';
        
        IS_PAUSED = false;
        REMAINING_TIME = story.durationMs;
        
        const currentBar = progressContainer.children[index].querySelector('.story-progress-bar');
        currentBar.style.animation = `storyProgress ${story.durationMs / 1000}s linear forwards`;
        
        START_TIME = Date.now();
        STORY_TIMER_ID = setTimeout(() => {
            renderStory(CURRENT_STORY_INDEX + 1); // Auto-advance
        }, REMAINING_TIME);
    }
}

function pauseStory() {
    if (IS_PAUSED) return;
    IS_PAUSED = true;
    clearTimeout(STORY_TIMER_ID);
    REMAINING_TIME -= (Date.now() - START_TIME);
    
    const viewer = document.getElementById('storyViewer');
    const currentBar = viewer.querySelector('.story-progress').children[CURRENT_STORY_INDEX].querySelector('.story-progress-bar');
    currentBar.style.animationPlayState = 'paused';
    viewer.querySelector('.story-viewer-content').classList.add('hide-ui');
}

function resumeStory(e) {
    if (!IS_PAUSED) return;
    if (e && e.target && (e.target.closest('a') || e.target.closest('.story-mute-btn'))) return;
    IS_PAUSED = false;
    
    const viewer = document.getElementById('storyViewer');
    const currentBar = viewer.querySelector('.story-progress').children[CURRENT_STORY_INDEX].querySelector('.story-progress-bar');
    currentBar.style.animationPlayState = 'running';
    viewer.querySelector('.story-viewer-content').classList.remove('hide-ui');
    
    START_TIME = Date.now();
    STORY_TIMER_ID = setTimeout(() => {
        renderStory(CURRENT_STORY_INDEX + 1);
    }, REMAINING_TIME);
}

function handleHoldStart(e) {
    if (e.target.closest('.story-close') || e.target.closest('a') || e.target.closest('.story-mute-btn')) return;
    CLICK_START_TIME = Date.now();
    
    if (e.changedTouches && e.changedTouches.length > 0) {
        touchStartY = e.changedTouches[0].screenY;
    }
    
    pauseStory();
}

function handleHoldEnd(e) {
    if (e.target.closest('.story-close') || e.target.closest('a') || e.target.closest('.story-mute-btn')) return;
    
    if (e.changedTouches && e.changedTouches.length > 0) {
        const touchEndY = e.changedTouches[0].screenY;
        // Swipe down to close
        if (touchEndY - touchStartY > 60) {
            closeStoryViewer();
            return;
        }
    }
    
    const duration = Date.now() - CLICK_START_TIME;
    
    // If it was a quick tap, navigate instead of just resuming
    if (duration < 250) {
        clearTimeout(STORY_TIMER_ID); // Cancel resume timer
        IS_PAUSED = false; 
        document.querySelector('.story-viewer-content').classList.remove('hide-ui');
        
        const rect = document.querySelector('.story-viewer-content').getBoundingClientRect();
        const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
        
        // Left 33% of screen goes back, otherwise forward
        if (clientX < rect.left + (rect.width / 3)) {
            renderStory(CURRENT_STORY_INDEX - 1);
        } else {
            renderStory(CURRENT_STORY_INDEX + 1);
        }
    } else {
        resumeStory(e);
    }
}

function closeStoryViewer() {
    const viewer = document.getElementById('storyViewer');
    if (viewer) viewer.style.display = 'none';
    clearTimeout(STORY_TIMER_ID);
}

