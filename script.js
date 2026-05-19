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

// Vibrant colors for the wheel segments
const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', 
    '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
    '#14B8A6', '#84CC16', '#06B6D4', '#F43F5E'
];

let restaurants = JSON.parse(localStorage.getItem('restaurants')) || [
    'Pizza', 'Sushi', 'Burger', 'Tacos', 'Salad', 'Thai'
];

let history = JSON.parse(localStorage.getItem('spinHistory')) || [];

let currentRotation = 0;
let isSpinning = false;
let spinAnimation;

function saveRestaurants() {
    localStorage.setItem('restaurants', JSON.stringify(restaurants));
}

function saveHistory() {
    localStorage.setItem('spinHistory', JSON.stringify(history));
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
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = "Remove";
        deleteBtn.onclick = () => removeHistoryItem(index);
        
        topRow.appendChild(nameSpan);
        topRow.appendChild(deleteBtn);
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'date';
        const d = new Date(entry.date);
        dateSpan.textContent = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
        
        li.appendChild(topRow);
        li.appendChild(dateSpan);
        historyList.appendChild(li);
    });
}

function removeHistoryItem(index) {
    history.splice(index, 1);
    saveHistory();
    renderHistory();
    drawWheel();
}

function getWeight(name) {
    const count = history.filter(h => h.name === name).length;
    // Each time it's picked, its weight is divided by (count + 1).
    return 1 / (1 + count); 
}

function getTotalWeight() {
    return restaurants.reduce((sum, name) => sum + getWeight(name), 0);
}

function renderList() {
    restaurantList.innerHTML = '';
    restaurants.forEach((restaurant, index) => {
        const li = document.createElement('li');
        li.textContent = restaurant;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = "Remove";
        deleteBtn.onclick = () => removeRestaurant(index);
        
        li.appendChild(deleteBtn);
        restaurantList.appendChild(li);
    });
    drawWheel();
}

function addRestaurant() {
    const name = restaurantInput.value.trim();
    if (name && !restaurants.includes(name)) {
        restaurants.push(name);
        restaurantInput.value = '';
        saveRestaurants();
        renderList();
    }
}

function removeRestaurant(index) {
    restaurants.splice(index, 1);
    saveRestaurants();
    renderList();
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
        
        ctx.fillText(restaurants[i], radius - 30, 0);
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

function announceWinner() {
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
    history.unshift({ name: winner, date: new Date().toISOString() });
    saveHistory();
    renderHistory();
    
    winnerNameEl.textContent = winner;
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

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
        history = [];
        saveHistory();
        renderHistory();
        drawWheel();
    });
}

// Initial render
renderHistory();
renderList();
