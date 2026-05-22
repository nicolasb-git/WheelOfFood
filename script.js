const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const restaurantInput = document.getElementById('restaurant-input');
const addBtn = document.getElementById('add-btn');
const restaurantList = document.getElementById('restaurant-list');
const winnerModal = document.getElementById('winner-modal');
const winnerNameEl = document.getElementById('winner-name');
const closeModalBtn = document.getElementById('close-modal-btn');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

const authBtn = document.getElementById('auth-btn');
const loginModal = document.getElementById('login-modal');
const adminEmail = document.getElementById('admin-email');
const adminPassword = document.getElementById('admin-password');
const submitLoginBtn = document.getElementById('submit-login-btn');
const cancelLoginBtn = document.getElementById('cancel-login-btn');
const loginError = document.getElementById('login-error');

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let isAdmin = false;

supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        isAdmin = true;
        document.body.classList.add('is-admin');
        authBtn.textContent = 'Admin Logout';
        loginModal.classList.remove('active');
        renderHistory();
        renderList();
    } else {
        isAdmin = false;
        document.body.classList.remove('is-admin');
        authBtn.textContent = 'Admin Login';
        renderHistory();
        renderList();
    }
});

// Vibrant colors for the wheel segments
const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', 
    '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
    '#14B8A6', '#84CC16', '#06B6D4', '#F43F5E'
];

let restaurants = [];
let history = [];

let currentRotation = 0;
let isSpinning = false;
let spinAnimation;

async function fetchRestaurants() {
    const { data, error } = await supabaseClient.from('restaurants').select('id, name');
    if (error) {
        console.error('Error fetching restaurants:', error);
        // Fallback
        restaurants = [
            { id: 'fallback-1', name: 'Pizza' },
            { id: 'fallback-2', name: 'Sushi' },
            { id: 'fallback-3', name: 'Burger' },
            { id: 'fallback-4', name: 'Tacos' },
            { id: 'fallback-5', name: 'Salad' },
            { id: 'fallback-6', name: 'Thai' }
        ];
    } else {
        restaurants = data;
    }
}

async function fetchHistory() {
    const { data, error } = await supabaseClient.from('spin_history').select('id, created_at, restaurant_id, restaurants(name)').order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching history:', error);
    } else {
        history = data.map(h => ({
            name: h.restaurants?.name || 'Unknown Restaurant',
            restaurant_id: h.restaurant_id,
            date: h.created_at,
            id: h.id
        }));
    }
}

function renderHistory() {
    if (!historyList) return;
    historyList.innerHTML = '';
    history.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'history-item';
        
        const topRow = document.createElement('div');
        topRow.className = 'history-item-top';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = entry.name;
        nameSpan.style.fontWeight = 'bold';
        topRow.appendChild(nameSpan);
        
        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '&times;';
            deleteBtn.className = 'delete-btn';
            deleteBtn.title = "Remove";
            deleteBtn.onclick = () => removeHistoryItem(index);
            topRow.appendChild(deleteBtn);
        }
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'date';
        const d = new Date(entry.date);
        dateSpan.textContent = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
        
        li.appendChild(topRow);
        li.appendChild(dateSpan);
        historyList.appendChild(li);
    });
}

async function removeHistoryItem(index) {
    const item = history[index];
    if (item.id) {
        const { error } = await supabaseClient.from('spin_history').delete().match({ id: item.id });
        if (error) console.error('Error removing history:', error);
    }
    history.splice(index, 1);
    renderHistory();
    drawWheel();
}

function getWeight(restaurant) {
    const count = history.filter(h => h.restaurant_id === restaurant.id).length;
    // Each time it's picked, its weight is divided by (count + 1).
    return 1 / (1 + count); 
}

function getTotalWeight() {
    return restaurants.reduce((sum, r) => sum + getWeight(r), 0);
}

function renderList() {
    restaurantList.innerHTML = '';
    restaurants.forEach((restaurant, index) => {
        const li = document.createElement('li');
        li.textContent = restaurant.name;
        
        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '&times;';
            deleteBtn.className = 'delete-btn';
            deleteBtn.title = "Remove";
            deleteBtn.onclick = (e) => {
                e.target.disabled = true;
                removeRestaurant(index);
            };
            li.appendChild(deleteBtn);
        }
        
        restaurantList.appendChild(li);
    });
    drawWheel();
}

async function addRestaurant() {
    const name = restaurantInput.value.trim();
    if (name && !restaurants.some(r => r.name === name)) {
        addBtn.disabled = true;
        const { data, error } = await supabaseClient.from('restaurants').insert([{ name }]).select();
        addBtn.disabled = false;
        
        if (error) {
            console.error('Error adding restaurant:', error);
            alert('Failed to add restaurant. Error: ' + error.message);
        } else {
            if (data && data.length > 0) {
                restaurants.push(data[0]);
            } else {
                restaurants.push({ id: null, name });
            }
            restaurantInput.value = '';
            renderList();
        }
    }
}

async function removeRestaurant(index) {
    const restaurant = restaurants[index];
    try {
        const { error } = await supabaseClient.from('restaurants').delete().eq('id', restaurant.id);
        
        if (error) {
            console.error('Error removing restaurant:', error);
            alert('Failed to remove: ' + error.message);
            renderList(); // Re-enable buttons
        } else {
            restaurants.splice(index, 1);
            renderList();
        }
    } catch (e) {
        console.error('Exception removing restaurant:', e);
        alert('Error: ' + e.message);
        renderList();
    }
}

function drawWheel() {
    const numSegments = restaurants.length;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = centerX;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (numSegments === 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '24px Outfit';
        ctx.fillText('Add some food!', centerX, centerY);
        spinBtn.disabled = true;
        return;
    }

    spinBtn.disabled = isSpinning;

    const totalWeight = getTotalWeight();
    let currentAngleOffset = currentRotation;
    
    for (let i = 0; i < numSegments; i++) {
        const weight = getWeight(restaurants[i]);
        const segmentAngle = (weight / totalWeight) * 2 * Math.PI;
        const startAngle = currentAngleOffset;
        const endAngle = startAngle + segmentAngle;
        
        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        
        // Draw border
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();
        
        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segmentAngle / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        
        const fontSize = Math.max(10, Math.min(24, Math.floor(segmentAngle * 40)));
        ctx.font = `bold ${fontSize}px Outfit`;
        
        // Add shadow for better readability
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillText(restaurants[i].name, radius - 30, 0);
        ctx.restore();
        
        currentAngleOffset += segmentAngle;
    }
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.15, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
}

// Ease out cubic function for smooth deceleration
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function spinWheel() {
    if (!isAdmin) {
        loginModal.classList.add('active');
        return;
    }
    
    if (isSpinning || restaurants.length === 0) return;
    
    isSpinning = true;
    spinBtn.disabled = true;
    
    const spinDuration = 5000 + Math.random() * 2000; // 5-7 seconds
    const spinRotations = 10 + Math.random() * 5; // 10-15 full rotations
    const startRotation = currentRotation;
    const targetRotation = startRotation + (spinRotations * 2 * Math.PI);
    
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        let progress = Math.min(elapsed / spinDuration, 1);
        
        // Apply easing
        const easedProgress = easeOutCubic(progress);
        
        currentRotation = startRotation + (targetRotation - startRotation) * easedProgress;
        
        drawWheel();
        
        if (progress < 1) {
            spinAnimation = requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            spinBtn.disabled = false;
            announceWinner();
        }
    }
    
    spinAnimation = requestAnimationFrame(animate);
}

async function announceWinner() {
    // Normalize current rotation to 0 - 2PI
    const normalizedRotation = currentRotation % (2 * Math.PI);
    
    let pointerAngle = (3 * Math.PI) / 2 - normalizedRotation;
    if (pointerAngle < 0) {
        pointerAngle += 2 * Math.PI;
    }
    
    const totalWeight = getTotalWeight();
    let currentAngle = 0;
    let winningIndex = -1;
    
    for (let i = 0; i < restaurants.length; i++) {
        const weight = getWeight(restaurants[i]);
        const segmentAngle = (weight / totalWeight) * 2 * Math.PI;
        
        if (pointerAngle >= currentAngle && pointerAngle < currentAngle + segmentAngle) {
            winningIndex = i;
            break;
        }
        currentAngle += segmentAngle;
    }
    
    if (winningIndex === -1) winningIndex = restaurants.length - 1; // fallback
    const winner = restaurants[winningIndex];
    
    // Add to history
    const { data, error } = await supabaseClient.from('spin_history').insert([{ restaurant_id: winner.id }]).select('*, restaurants(name)');
    
    if (error) {
        console.error('Error saving history:', error);
        history.unshift({ name: winner.name, restaurant_id: winner.id, date: new Date().toISOString() });
    } else if (data && data.length > 0) {
        const h = data[0];
        history.unshift({
            name: h.restaurants?.name || winner.name,
            restaurant_id: h.restaurant_id,
            date: h.created_at,
            id: h.id
        });
    }
    
    renderHistory();
    
    winnerNameEl.textContent = winner.name;
    winnerModal.classList.add('active');
}

// Event Listeners
addBtn.addEventListener('click', addRestaurant);
restaurantInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addRestaurant();
});
spinBtn.addEventListener('click', spinWheel);
closeModalBtn.addEventListener('click', () => {
    winnerModal.classList.remove('active');
    drawWheel();
});

// Auth Event Listeners
authBtn.addEventListener('click', async () => {
    if (isAdmin) {
        await supabaseClient.auth.signOut();
    } else {
        loginModal.classList.add('active');
    }
});

cancelLoginBtn.addEventListener('click', () => {
    loginModal.classList.remove('active');
    loginError.textContent = '';
});

submitLoginBtn.addEventListener('click', async () => {
    loginError.textContent = 'Logging in...';
    const email = adminEmail.value;
    const password = adminPassword.value;
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) {
        loginError.textContent = error.message;
    } else {
        loginError.textContent = '';
        adminEmail.value = '';
        adminPassword.value = '';
    }
});

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', async () => {
        clearHistoryBtn.disabled = true;
        // Delete all by matching an always true condition
        const { error } = await supabaseClient.from('spin_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        clearHistoryBtn.disabled = false;
        
        if (error) {
            console.error('Error clearing history:', error);
        } else {
            history = [];
            renderHistory();
            drawWheel();
        }
    });
}

// Initial render
async function init() {
    await fetchRestaurants();
    await fetchHistory();
    renderHistory();
    renderList();
}

init();
