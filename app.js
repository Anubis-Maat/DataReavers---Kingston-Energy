// User accounts
const users = [
    { username: 'admin', password: 'admin123', role: 'admin', name: 'System Administrator' },
    { username: 'manager', password: 'manager123', role: 'manager', name: 'Operations Manager' },
    { username: 'user', password: 'user123', role: 'user', name: 'Resident User' }
];

// Current user session
let currentUser = null;

// AI Alerts System
let aiAlerts = [];
let alertCheckInterval;
let lastAlertCheck = Date.now();

// Alert types and configurations
const ALERT_TYPES = {
    MAINTENANCE: {
        title: "Maintenance Required",
        source: "AI Predictive Maintenance",
        icon: "🔧"
    },
    EFFICIENCY: {
        title: "Efficiency Alert",
        source: "AI Performance Monitor",
        icon: "📊"
    },
    ROUTE: {
        title: "Route Optimization",
        source: "AI Route Planner",
        icon: "🗺️"
    },
    SAFETY: {
        title: "Safety Concern",
        source: "AI Safety System",
        icon: "🚨"
    },
    CAPACITY: {
        title: "Capacity Warning",
        source: "AI Capacity Monitor",
        icon: "⚡"
    },
    WEATHER: {
        title: "Weather Impact",
        source: "AI Weather System",
        icon: "🌧️"
    }
};

// Kingston center coordinates and major roads
const KINGSTON_CENTER = [17.9970, -76.7936];

// Major roads in Kingston area
const KINGSTON_ROADS = [
    { name: 'Spanish Town Road', points: [
        [17.9922, -76.8614],
        [17.9970, -76.8300],
        [18.0000, -76.8000],
        [18.0050, -76.7700],
        [18.0100, -76.7400]
    ]},
    { name: 'Marcus Garvey Drive', points: [
        [17.9650, -76.8678],
        [17.9700, -76.8500],
        [17.9750, -76.8300],
        [17.9800, -76.8100],
        [17.9850, -76.7900]
    ]},
    { name: 'Washington Boulevard', points: [
        [18.0200, -76.8000],
        [18.0100, -76.8000],
        [18.0000, -76.8000],
        [17.9900, -76.8000],
        [17.9800, -76.8000]
    ]},
    { name: 'Hagley Park Road', points: [
        [18.0150, -76.8200],
        [18.0050, -76.8200],
        [17.9950, -76.8200],
        [17.9850, -76.8200]
    ]},
    { name: 'Constant Spring Road', points: [
        [18.0250, -76.7800],
        [18.0150, -76.7800],
        [18.0050, -76.7800],
        [17.9950, -76.7800]
    ]}
];

// Collection zones in Kingston
const COLLECTION_ZONES = [
    { name: 'Downtown Kingston', center: [17.9700, -76.7900], radius: 1.5 },
    { name: 'Cross Roads', center: [18.0000, -76.7900], radius: 1.2 },
    { name: 'Half Way Tree', center: [18.0100, -76.8000], radius: 1.3 },
    { name: 'Constant Spring', center: [18.0200, -76.7800], radius: 1.1 },
    { name: 'Spanish Town', center: [18.0100, -76.7500], radius: 1.4 },
    { name: 'Portmore', center: [17.9600, -76.8700], radius: 1.6 }
];

// Power plants
const disposalSites = [
    { 
        id: 1, 
        name: 'Riverton City Power Plant', 
        lat: 18.0154, 
        lng: -76.8476, 
        output: 12500,
        capacity: 50000,
        accessRoad: 'Spanish Town Road'
    },
    { 
        id: 2, 
        name: 'Naggo Head Energy Facility', 
        lat: 17.9647, 
        lng: -76.8678, 
        output: 8900,
        capacity: 30000,
        accessRoad: 'Marcus Garvey Drive'
    }
];

// Initial trucks data
let trucks = [
    { 
        id: 'KGN-1234', 
        lat: 18.0100, 
        lng: -76.8000, 
        load: 2500, 
        capacity: 12000, 
        status: 'collecting',
        speed: 1.0,
        collectionRate: 100,
        targetSite: null,
        route: null,
        currentRoad: 'Washington Boulevard',
        collectionZone: 'Half Way Tree',
        routePath: [],
        currentRouteIndex: 0,
        disposalTime: 0,
        lastUpdateTime: Date.now()
    },
    { 
        id: 'KGN-5678', 
        lat: 17.9700, 
        lng: -76.7900, 
        load: 8500, 
        capacity: 15000, 
        status: 'collecting',
        speed: 1.0,
        collectionRate: 100,
        targetSite: null,
        route: null,
        currentRoad: 'Marcus Garvey Drive',
        collectionZone: 'Downtown Kingston',
        routePath: [],
        currentRouteIndex: 0,
        disposalTime: 0,
        lastUpdateTime: Date.now()
    },
    { 
        id: 'KGN-9012', 
        lat: 18.0200, 
        lng: -76.7800, 
        load: 11000, 
        capacity: 10000, 
        status: 'enroute-to-disposal',
        speed: 1.0,
        collectionRate: 100,
        targetSite: 1,
        route: 'to-disposal',
        currentRoad: 'Constant Spring Road',
        collectionZone: 'Constant Spring',
        routePath: [],
        currentRouteIndex: 0,
        disposalTime: 0,
        lastUpdateTime: Date.now()
    }
];

let map;
let truckMarkers = [];
let siteMarkers = [];
let routeLines = [];
let roadLines = [];
let truckCounter = 3;
let editingTruckIndex = null;
let searchResults = [];
let lastUpdateTimestamp = Date.now();

// AI Chat Functions
function toggleChat() {
    const chatContainer = document.getElementById('ai-chat-container');
    const chatToggle = document.getElementById('chat-toggle');
    
    if (chatContainer.style.display === 'none') {
        chatContainer.style.display = 'flex';
        chatToggle.textContent = '💬 Close Assistant';
        chatToggle.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        addChatMessage('assistant', 'Hello! I\'m your Energy Assistant. I can help you with: \n\n• Truck locations and status\n• Route information\n• Energy production stats\n• Waste management data\n\nWhat would you like to know?');
        } else {
        chatContainer.style.display = 'none';
        chatToggle.textContent = '💬 AI Assistant';
        chatToggle.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
        }
    }

    function closeChat() {
        const chatContainer = document.getElementById('ai-chat-container');
        const chatToggle = document.getElementById('chat-toggle');
        
        chatContainer.style.display = 'none';
        chatToggle.textContent = '💬 AI Assistant';
        chatToggle.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
    }

    function addChatMessage(sender, message) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (message) {
        addChatMessage('user', message);
        input.value = '';
        
        // AI thinking delay
        setTimeout(() => {
            const response = generateAIResponse(message);
            addChatMessage('assistant', response);
        }, 800 + Math.random() * 800);
        }
    }

    function generateAIResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Truck-related queries
        if (lowerMessage.includes('truck') || lowerMessage.includes('vehicle') || lowerMessage.includes('collection')) {
        const activeTrucks = trucks.length;
        const collecting = trucks.filter(t => t.status === 'collecting').length;
        const toDisposal = trucks.filter(t => t.status === 'enroute-to-disposal').length;
        const disposing = trucks.filter(t => t.status === 'disposing').length;
        const returning = trucks.filter(t => t.status === 'returning').length;
        
        return `🚛 Truck Overview:\n\n• Total Active: ${activeTrucks} trucks\n• Collecting Waste: ${collecting} trucks\n• Heading to Disposal: ${toDisposal} trucks\n• At Disposal Site: ${disposing} trucks\n• Returning to Zones: ${returning} trucks\n\nUse the search bar to find specific trucks by ID!`;
        
        } else if (lowerMessage.includes('route') || lowerMessage.includes('path') || lowerMessage.includes('road')) {
        return `🛣️ Route Information:\n\nTrucks follow optimized routes along Kingston's major roads:\n\n• Spanish Town Road\n• Marcus Garvey Drive\n• Washington Boulevard\n• Hagley Park Road\n• Constant Spring Road\n\nRoutes are calculated in real-time for efficiency.`;
        
        } else if (lowerMessage.includes('energy') || lowerMessage.includes('power') || lowerMessage.includes('electric')) {
        const totalEnergy = disposalSites.reduce((sum, site) => sum + site.output, 0);
        const homesPowered = Math.round(totalEnergy / 30);
        
        return `⚡ Energy Production:\\n\\n• Current Output: ${totalEnergy.toLocaleString()} kWh\\n• Homes Powered: ${homesPowered.toLocaleString()}\\n• Carbon Offset: ${Math.round(totalEnergy * 0.4).toLocaleString()} kg\\n• Power Plants: ${disposalSites.length} active facilities`;
    
    } else if (lowerMessage.includes('waste') || lowerMessage.includes('garbage') || lowerMessage.includes('trash')) {
        const totalWaste = trucks.reduce((sum, truck) => sum + truck.load, 0);
        const averageLoad = Math.round((totalWaste / trucks.length) / 100) * 100;
        
        return `🗑️ Waste Management:\\n\\n• Total Waste in Transit: ${(totalWaste / 1000).toFixed(1)} tons\\n• Average Truck Load: ${averageLoad.toLocaleString()} kg\\n• Collection Zones: ${COLLECTION_ZONES.length} areas\\n• Disposal Sites: ${disposalSites.length} facilities`;
    
    } else if (lowerMessage.includes('status') || lowerMessage.includes('how') && lowerMessage.includes('going')) {
        const steamEnergy = disposalSites.reduce((sum, site) => sum + site.output, 0);
        const totalWaste = trucks.reduce((sum, truck) => sum + truck.load, 0);
        
        return `📊 Current System Status:\\n\\n• Energy Production: ${steamEnergy.toLocaleString()} kWh\\n• Waste Processed: ${(totalWaste / 1000).toFixed(1)} tons\\n• Active Trucks: ${trucks.length}\\n• All systems operational ✅`;
    
    } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        return `🤖 How I Can Help:\\n\\nI can provide real-time information about:\\n\\n• 🚛 Truck locations and status\\n• 🛣️ Route optimization\\n• ⚡ Energy production stats\\n• 🗑️ Waste processing data\\n• 📊 System performance\\n\\nJust ask me anything about the Kingston energy tracking system!`;
    
    } else {
        return `I'm not sure I understand. I can help you with:\\n\\n• Truck information and locations\\n• Route and road data\\n• Energy production statistics\\n• Waste management details\\n\\nTry asking about "truck status", "energy production", or "waste processing"!`;
    }
}

// AI Alert Functions
function generateAIAlert() {
    const alertTypes = Object.keys(ALERT_TYPES);
    const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const alertConfig = ALERT_TYPES[randomType];
    
    const priorities = ['critical', 'high', 'medium', 'low'];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    
    const randomTruck = trucks[Math.floor(Math.random() * trucks.length)];
    const randomSite = disposalSites[Math.floor(Math.random() * disposalSites.length)];
    
    const alertMessages = {
        MAINTENANCE: [
            `Truck ${randomTruck.id} shows signs of brake wear. Schedule maintenance within 48 hours.`,
            `Engine performance degradation detected in ${randomTruck.id}. Recommended inspection.`,
            `Hydraulic system pressure irregular in ${randomTruck.id}. Preventive maintenance advised.`
        ],
        EFFICIENCY: [
            `${randomTruck.id} collection efficiency dropped 15% in Cross Roads zone. Route optimization needed.`,
            `Fuel consumption increased 12% for ${randomTruck.id}. Check tire pressure and engine tune.`,
            `Collection rate below target for ${randomTruck.id} in ${randomTruck.collectionZone}.`
        ],
        ROUTE: [
            `Traffic congestion detected on ${randomTruck.currentRoad}. Alternate route available via Marcus Garvey Drive.`,
            `Weather conditions affecting ${randomTruck.collectionZone}. Consider rescheduling collections.`,
            `Optimized route available for ${randomTruck.id} that could save 23 minutes and 15% fuel.`
        ],
        SAFETY: [
            `Unusual driving pattern detected for ${randomTruck.id}. Possible driver fatigue.`,
            `Safety inspection overdue for ${randomTruck.id}. Schedule immediately.`,
            `Road conditions deteriorating in ${randomTruck.collectionZone}. Advise reduced speed.`
        ],
        CAPACITY: [
            `${randomSite.name} operating at 92% capacity. Consider redirecting trucks to alternate facility.`,
            `Peak collection hours approaching. Deploy additional trucks to ${randomTruck.collectionZone}.`,
            `Waste processing backlog detected at ${randomSite.name}. Optimize truck arrival times.`
        ],
        WEATHER: [
            `Heavy rainfall predicted in ${randomTruck.collectionZone} within 2 hours. Adjust collection schedule.`,
            `High winds affecting collection efficiency. Secure loose materials and reduce speed.`,
            `Temperature spike may affect waste decomposition. Adjust processing parameters.`
        ]
    };
    
    const message = alertMessages[randomType][Math.floor(Math.random() * alertMessages[randomType].length)];
    
    const alert = {
        id: generateAlertId(),
        type: randomType,
        title: alertConfig.title,
        message: message,
        priority: priority,
        source: alertConfig.source,
        icon: alertConfig.icon,
        timestamp: new Date(),
        acknowledged: false,
        context: {
            truckId: randomTruck.id,
            zone: randomTruck.collectionZone,
            site: randomSite.name
        }
    };
    
    return alert;
}

function generateAlertId() {
    return 'ALT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function addAIAlert(alert) {
    aiAlerts.unshift(alert);
    if (aiAlerts.length > 50) {
        aiAlerts = aiAlerts.slice(0, 50);
    }
    updateAlertsDisplay();
    
    // Show notification for high priority alerts
    if (alert.priority === 'critical' || alert.priority === 'high') {
        showAlertNotification(alert);
    }
}

function updateAlertsDisplay() {
    const alertsList = document.getElementById('ai-alerts-list');
    const alertsCount = document.getElementById('ai-alerts-count');
    const alertIndicator = document.getElementById('alert-indicator');
    
    // Update counts
    const unacknowledgedCount = aiAlerts.filter(alert => !alert.acknowledged).length;
    alertsCount.textContent = unacknowledgedCount;
    
    if (unacknowledgedCount > 0) {
        alertIndicator.textContent = unacknowledgedCount;
        alertIndicator.style.display = 'flex';
    } else {
        alertIndicator.style.display = 'none';
    }
    
    // Update alerts list
    alertsList.innerHTML = '';
    
    aiAlerts.forEach(alert => {
        const alertElement = document.createElement('div');
        alertElement.className = `ai-alert-item ${alert.priority}`;
        if (!alert.acknowledged) {
            alertElement.classList.add('unacknowledged');
        }
        
        const timeAgo = getTimeAgo(alert.timestamp);
        
        alertElement.innerHTML = `
            <div class="ai-alert-header">
                <div class="ai-alert-title">${alert.icon} ${alert.title}</div>
                <div class="ai-alert-time">${timeAgo}</div>
            </div>
            <div class="ai-alert-message">${alert.message}</div>
            <div class="ai-alert-meta">
                <div class="ai-alert-source">
                    <span>${alert.source}</span>
                    <span class="ai-alert-priority priority-${alert.priority}">${alert.priority}</span>
                </div>
                <div class="ai-alert-actions">
                    ${!alert.acknowledged ? 
                        `<button class="ai-alert-action" onclick="acknowledgeAlert('${alert.id}')">Acknowledge</button>` : 
                        `<span style="color: #22c55e; font-size: 10px;">✓ Acknowledged</span>`
                    }
                    <button class="ai-alert-action" onclick="viewAlertDetails('${alert.id}')">View</button>
                </div>
            </div>
        `;
        
        alertsList.appendChild(alertElement);
    });
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const diffMs = now - new Date(timestamp);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
}

function acknowledgeAlert(alertId) {
    const alert = aiAlerts.find(a => a.id === alertId);
    if (alert) {
        alert.acknowledged = true;
        updateAlertsDisplay();
    }
}

function viewAlertDetails(alertId) {
    const alert = aiAlerts.find(a => a.id === alertId);
    if (alert) {
        const details = `
Alert Details:
${alert.icon} ${alert.title}
Priority: ${alert.priority.toUpperCase()}
Time: ${alert.timestamp.toLocaleString()}
Source: ${alert.source}

${alert.message}

Context:
- Truck: ${alert.context.truckId}
- Zone: ${alert.context.zone}
- Site: ${alert.context.site}
        `;
        alert(details);
    }
}

function showAlertNotification(alert) {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${alert.priority === 'critical' ? '#ef4444' : '#f59e0b'};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 4px;">${alert.icon} ${alert.title}</div>
        <div style="font-size: 12px;">${alert.message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function toggleAIPanel() {
    const panel = document.getElementById('ai-alerts-panel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

function checkForAlerts() {
    const currentTime = Date.now();
    const timeSinceLastCheck = currentTime - lastAlertCheck;
    
    // Check for various conditions that might trigger alerts
    trucks.forEach(truck => {
        // Check for overloaded trucks
        const loadPercentage = (truck.load / truck.capacity) * 100;
        if (loadPercentage > 95 && Math.random() < 0.3) {
            const alert = generateAIAlert();
            alert.type = 'CAPACITY';
            alert.title = 'Truck Capacity Warning';
            alert.message = `Truck ${truck.id} is at ${Math.round(loadPercentage)}% capacity. Consider immediate disposal.`;
            alert.priority = 'high';
            addAIAlert(alert);
        }
        
        // Check for trucks stuck in one status too long
        if (truck.status === 'disposing' && truck.disposalTime > 10 && Math.random() < 0.4) {
            const alert = generateAIAlert();
            alert.type = 'EFFICIENCY';
            alert.title = 'Extended Disposal Time';
            alert.message = `Truck ${truck.id} has been disposing for an extended period. Check for facility issues.`;
            alert.priority = 'medium';
            addAIAlert(alert);
        }
    });
    
    // Check power plant capacity
    disposalSites.forEach(site => {
        const capacityPercentage = (site.output / site.capacity) * 100;
        if (capacityPercentage > 85 && Math.random() < 0.2) {
            const alert = generateAIAlert();
            alert.type = 'CAPACITY';
            alert.title = 'Plant Capacity Warning';
            alert.message = `${site.name} is at ${Math.round(capacityPercentage)}% capacity. Consider load distribution.`;
            alert.priority = 'high';
            addAIAlert(alert);
        }
    });
    
    // Random AI-generated insights (simulated)
    if (Math.random() < 0.1) {
        const alert = generateAIAlert();
        addAIAlert(alert);
    }
    
    lastAlertCheck = currentTime;
}

// Initialize the application
function init() {
    setupEventListeners();
    
    // Add some initial demo alerts
    setTimeout(() => {
        const demoAlerts = [
            generateAIAlert(),
            generateAIAlert(),
            generateAIAlert()
        ];
        demoAlerts.forEach(alert => addAIAlert(alert));
    }, 2000);
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    document.getElementById('username').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchTrucks();
        }
    });
    
    document.getElementById('chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    document.getElementById('logout-btn').addEventListener('click', logout);
}

// Login function
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        showApplication();
    } else {
        alert('Invalid username or password. Please try again.');
    }
}

// Logout function
function logout() {
    currentUser = null;
    if (alertCheckInterval) {
        clearInterval(alertCheckInterval);
    }
    showLogin();
}

// Show login state
function showLogin() {
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('search-input').value = '';
    
    searchResults = [];
}

// Show main application
function showApplication() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    document.getElementById('search-container').style.display = 'flex';
    document.getElementById('user-info').style.display = 'flex';
    document.getElementById('demo-accounts-bar').style.display = 'flex';
    
    document.getElementById('current-user').textContent = currentUser.name;
    document.getElementById('user-role').textContent = currentUser.role;
    
    setupRoleAccess();
    
    if (!map) {
        initMap();
    }
    renderTruckControls();
    renderTrucksList();
    renderPlantsList();
    updateStats();
    updateUserLocationStatus();
    startSimulation();
    
    // Start AI alert monitoring
    alertCheckInterval = setInterval(checkForAlerts, 10000);
}

// Setup role-based access control
function setupRoleAccess() {
    const adminControls = document.getElementById('admin-controls');
    const userLocationStatus = document.getElementById('user-location-status');
    
    adminControls.style.display = 'none';
    userLocationStatus.style.display = 'none';
    
    switch(currentUser.role) {
        case 'admin':
            adminControls.style.display = 'block';
            break;
        case 'user':
            userLocationStatus.style.display = 'block';
            break;
    }
}

// Find the nearest road to a point
function findNearestRoad(lat, lng) {
    let nearestRoad = null;
    let minDistance = Infinity;
    
    KINGSTON_ROADS.forEach(road => {
        road.points.forEach(point => {
            const distance = calculateDistance(lat, lng, point[0], point[1]);
            if (distance < minDistance) {
                minDistance = distance;
                nearestRoad = road.name;
            }
        });
    });
    
    return nearestRoad;
}

// Calculate route from current position to target using roads
function calculateRoute(startLat, startLng, targetLat, targetLng) {
    const startRoad = findNearestRoad(startLat, startLng);
    const targetRoad = findNearestRoad(targetLat, targetLng);
    
    let route = [];
    route.push([startLat, startLng]);
    
    if (startRoad === targetRoad) {
        const road = KINGSTON_ROADS.find(r => r.name === startRoad);
        if (road) {
            const startPoint = findClosestPointOnRoad(startLat, startLng, road);
            const targetPoint = findClosestPointOnRoad(targetLat, targetLng, road);
            
            const startIndex = road.points.findIndex(p => p[0] === startPoint[0] && p[1] === startPoint[1]);
            const targetIndex = road.points.findIndex(p => p[0] === targetPoint[0] && p[1] === targetPoint[1]);
            
            if (startIndex !== -1 && targetIndex !== -1) {
                const step = startIndex < targetIndex ? 1 : -1;
                for (let i = startIndex; i !== targetIndex + step; i += step) {
                    if (i >= 0 && i < road.points.length) {
                        route.push(road.points[i]);
                    }
                }
            }
        }
    } else {
        route.push([targetLat, targetLng]);
    }
    
    route.push([targetLat, targetLng]);
    return route;
}

// Find closest point on a road to given coordinates
function findClosestPointOnRoad(lat, lng, road) {
    let closestPoint = road.points[0];
    let minDistance = calculateDistance(lat, lng, closestPoint[0], closestPoint[1]);
    
    road.points.forEach(point => {
        const distance = calculateDistance(lat, lng, point[0], point[1]);
        if (distance < minDistance) {
            minDistance = distance;
            closestPoint = point;
        }
    });
    
    return closestPoint;
}

// Get a random collection zone for a truck
function getRandomCollectionZone() {
    const randomIndex = Math.floor(Math.random() * COLLECTION_ZONES.length);
    return COLLECTION_ZONES[randomIndex];
}

// Calculate position within a collection zone
function getPositionInZone(zone) {
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * zone.radius * 0.8;
    const lat = zone.center[0] + (distance / 111.32) * Math.cos(angle);
    const lng = zone.center[1] + (distance / (111.32 * Math.cos(zone.center[0] * Math.PI / 180))) * Math.sin(angle);
    return [lat, lng];
}

// Search trucks by ID
function searchTrucks() {
    const searchTerm = document.getElementById('search-input').value.trim().toUpperCase();
    const searchInfo = document.getElementById('search-info');
    
    if (searchTerm === '') {
        searchInfo.style.display = 'none';
        searchResults = [];
        renderTrucksList();
        updateTruckMarkers();
        return;
    }
    
    searchResults = trucks.filter(truck => 
        truck.id.includes(searchTerm)
    );
    
    if (searchResults.length > 0) {
        searchInfo.innerHTML = `Found ${searchResults.length} truck(s) matching "${searchTerm}"`;
        searchInfo.style.display = 'block';
        
        if (searchResults.length > 0) {
            const firstResult = searchResults[0];
            map.setView([firstResult.lat, firstResult.lng], 15);
        }
    } else {
        searchInfo.innerHTML = `No trucks found matching "${searchTerm}"`;
        searchInfo.style.display = 'block';
    }
    
    renderTrucksList();
    updateTruckMarkers();
}

// Update user location status (for user role)
function updateUserLocationStatus() {
    if (currentUser.role !== 'user') return;
    
    const statusContent = document.getElementById('location-status-content');
    const userLocation = {
        lat: KINGSTON_CENTER[0] + (Math.random() - 0.5) * 0.02,
        lng: KINGSTON_CENTER[1] + (Math.random() - 0.5) * 0.02
    };
    
    const nearbyTrucks = trucks.filter(truck => {
        const distance = calculateDistance(userLocation.lat, userLocation.lng, truck.lat, truck.lng);
        return distance < 2;
    });
    
    let statusHTML = '';
    
    if (nearbyTrucks.length > 0) {
        statusHTML = `
            <div class="status-item">
                <h4>🚛 Trucks Near You</h4>
                <p>There are ${nearbyTrucks.length} collection trucks operating in your area.</p>
            </div>
        `;
        
        nearbyTrucks.forEach(truck => {
            const distance = calculateDistance(userLocation.lat, userLocation.lng, truck.lat, truck.lng);
            statusHTML += `
                <div class="status-item">
                    <h4>Truck ${truck.id}</h4>
                    <p>Status: ${truck.status.replace('-', ' ')}</p>
                    <p>Distance: ${(distance * 1000).toFixed(0)} meters away</p>
                    <p>Load: ${Math.round((truck.load / truck.capacity) * 100)}% full</p>
                </div>
            `;
        });
    } else {
        statusHTML = `
            <div class="status-item">
                <h4>📭 No Active Collections</h4>
                <p>There are no garbage collection trucks currently operating in your immediate area.</p>
                <p>Next collection in your zone: Tomorrow 8:00 AM</p>
            </div>
        `;
    }
    
    statusContent.innerHTML = statusHTML;
}

// Initialize Leaflet map
function initMap() {
    if (map) {
        map.remove();
    }
    
    map = L.map('map').setView(KINGSTON_CENTER, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Draw Kingston roads
    KINGSTON_ROADS.forEach(road => {
        const roadLine = L.polyline(road.points, {
            color: '#666666',
            weight: 3,
            opacity: 0.4,
            dashArray: '5, 5'
        }).addTo(map);
        
        const midPoint = road.points[Math.floor(road.points.length / 2)];
        L.marker(midPoint, {
            icon: L.divIcon({
                className: 'road-label',
                html: `<div style="background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; white-space: nowrap;">${road.name}</div>`,
                iconSize: [100, 20],
                iconAnchor: [50, 10]
            })
        }).addTo(map);
        
        roadLines.push(roadLine);
    });

    // Draw collection zones
    COLLECTION_ZONES.forEach(zone => {
        const zoneCircle = L.circle(zone.center, {
            radius: zone.radius * 1000,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 1
        }).addTo(map);
        
        L.marker(zone.center, {
            icon: L.divIcon({
                className: 'zone-label',
                html: `<div style="background: rgba(59, 130, 246, 0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${zone.name}</div>`,
                iconSize: [120, 25],
                iconAnchor: [60, 12]
            })
        }).addTo(map);
    });

    // Add disposal sites to map
    disposalSites.forEach(site => {
        const siteIcon = createSiteIcon(site.output);
        const marker = L.marker([site.lat, site.lng], { icon: siteIcon })
            .addTo(map)
            .bindPopup(`
                <div style="min-width: 200px;">
                    <h3 style="margin: 0 0 10px 0; color: #dc2626;">⚡ ${site.name}</h3>
                    <p><strong>Current Output:</strong> ${site.output.toLocaleString()} kWh</p>
                    <p><strong>Capacity:</strong> ${site.capacity.toLocaleString()} kWh</p>
                    <p><strong>Access Road:</strong> ${site.accessRoad}</p>
                    <p><strong>Location:</strong> ${site.lat.toFixed(4)}, ${site.lng.toFixed(4)}</p>
                </div>
            `);
        siteMarkers.push(marker);
    });

    updateTruckMarkers();
}

// Create custom truck icon
function createTruckIcon(status, isSearchResult = false) {
    const colors = {
        'collecting': '#22c55e',
        'enroute-to-disposal': '#f59e0b',
        'disposing': '#dc2626',
        'returning': '#3b82f6'
    };

    const borderColor = isSearchResult ? '#ff00ff' : 'white';
    const borderWidth = isSearchResult ? '4px' : '3px';

    return L.divIcon({
        className: 'truck-marker',
        html: `
            <div style="
                background: ${colors[status]};
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: ${borderWidth} solid ${borderColor};
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            ">🚛</div>
        `,
        iconSize: [34, 34],
    });
}

// Create custom site icon
function createSiteIcon(output) {
    const intensity = Math.min(output / 50000, 1);
    const size = 20 + (intensity * 20);

    return L.divIcon({
        className: 'power-plant-marker',
        html: `
            <div style="
                background: radial-gradient(circle, #f97316, #dc2626);
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 12px;
            ">⚡</div>
        `,
        iconSize: [size + 6, size + 6],
    });
}

// Calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Find nearest disposal site
function findNearestDisposalSite(lat, lng) {
    let nearestSite = null;
    let minDistance = Infinity;

    disposalSites.forEach(site => {
        const distance = calculateDistance(lat, lng, site.lat, site.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearestSite = site;
        }
    });

    return nearestSite;
}

// Update truck loads in real-time
function updateTruckLoadsRealTime() {
    const currentTime = Date.now();
    const timeElapsed = (currentTime - lastUpdateTimestamp) / 1000;
    
    trucks.forEach(truck => {
        if (truck.status === 'collecting') {
            const loadIncrease = (truck.collectionRate / 60) * timeElapsed * truck.speed;
            truck.load = Math.min(truck.capacity, truck.load + loadIncrease);
            
            const loadPercentage = (truck.load / truck.capacity) * 100;
            if (loadPercentage >= 95 && truck.status === 'collecting') {
                const nearestSite = findNearestDisposalSite(truck.lat, truck.lng);
                truck.status = 'enroute-to-disposal';
                truck.targetSite = nearestSite.id;
                truck.route = 'to-disposal';
                
                truck.routePath = calculateRoute(truck.lat, truck.lng, nearestSite.lat, nearestSite.lng);
                truck.currentRouteIndex = 0;
            }
        }
    });
    
    lastUpdateTimestamp = currentTime;
    updateTruckMarkers();
    renderTrucksList();
    updateStats();
}

// Update truck markers and routes on map
function updateTruckMarkers() {
    truckMarkers.forEach(marker => map.removeLayer(marker));
    routeLines.forEach(line => map.removeLayer(line));
    
    truckMarkers = [];
    routeLines = [];

    trucks.forEach(truck => {
        const isSearchResult = searchResults.some(result => result.id === truck.id);
        const truckIcon = createTruckIcon(truck.status, isSearchResult);
        
        const loadPercentage = Math.round((truck.load / truck.capacity) * 100);
        
        let popupContent = `
            <div style="min-width: 280px;">
                <h3 style="margin: 0 0 12px 0;">🚛 Truck ${truck.id}</h3>
                <p><strong>Load:</strong> ${Math.round(truck.load).toLocaleString()} kg / ${truck.capacity.toLocaleString()} kg (${loadPercentage}%)</p>
                <p><strong>Status:</strong> 
                    <span style="color: ${
                        truck.status === 'disposing' ? '#ef4444' : 
                        truck.status === 'enroute-to-disposal' ? '#f59e0b' : 
                        truck.status === 'returning' ? '#3b82f6' : '#22c55e'
                    }; font-weight: bold;">
                        ${truck.status.toUpperCase().replace('-', ' ')}
                    </span>
                </p>
                <p><strong>Current Road:</strong> ${truck.currentRoad}</p>
                <p><strong>Collection Zone:</strong> ${truck.collectionZone}</p>
                <p><strong>Speed:</strong> ${truck.speed.toFixed(1)}x</p>
                <p><strong>Collection Rate:</strong> ${truck.collectionRate} kg/min</p>
                ${truck.targetSite ? `<p><strong>Destination:</strong> ${disposalSites.find(s => s.id === truck.targetSite)?.name}</p>` : ''}
                <p><strong>Location:</strong> ${truck.lat.toFixed(4)}, ${truck.lng.toFixed(4)}</p>
                <div class="real-time-indicator" style="margin-top: 8px; padding: 4px; background: #1e293b; border-radius: 4px; text-align: center; font-size: 10px; color: #22c55e;">
                    🔄 Real-time Updates Active
                </div>
        `;
        
        if (currentUser.role === 'admin') {
            popupContent += `
                <div style="margin-top: 10px; display: flex; gap: 5px;">
                    <button onclick="editTruckLocation(${trucks.indexOf(truck)})" style="padding: 5px 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        Edit Location
                    </button>
                    <button onclick="editTruckId(${trucks.indexOf(truck)})" style="padding: 5px 10px; background: #8b5cf6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        Edit ID
                    </button>
                </div>
            `;
        }
        
        popupContent += `</div>`;
        
        const marker = L.marker([truck.lat, truck.lng], { icon: truckIcon })
            .addTo(map)
            .bindPopup(popupContent);
        truckMarkers.push(marker);

        if (truck.routePath && truck.routePath.length > 1) {
            const routeColor = 
                truck.status === 'enroute-to-disposal' ? '#f59e0b' : 
                truck.status === 'returning' ? '#3b82f6' : '#22c55e';
                
            const routeLine = L.polyline(truck.routePath, {
                color: routeColor,
                weight: 4,
                opacity: 0.7,
                dashArray: truck.status === 'collecting' ? '10, 10' : null
            }).addTo(map);
            routeLines.push(routeLine);
        }
    });
}

// Move truck along its route
function moveTruckAlongRoute(truck) {
    if (!truck.routePath || truck.routePath.length === 0) {
        return true;
    }
    
    if (truck.currentRouteIndex >= truck.routePath.length) {
        return true;
    }
    
    const targetPoint = truck.routePath[truck.currentRouteIndex];
    const moveDistance = 0.0005 * truck.speed;
    
    const currentLat = truck.lat;
    const currentLng = truck.lng;
    const dx = targetPoint[1] - currentLng;
    const dy = targetPoint[0] - currentLat;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= moveDistance) {
        truck.lat = targetPoint[0];
        truck.lng = targetPoint[1];
        truck.currentRouteIndex++;
        truck.currentRoad = findNearestRoad(truck.lat, truck.lng);
        return truck.currentRouteIndex >= truck.routePath.length;
    } else {
        const ratio = moveDistance / distance;
        truck.lat = currentLat + dy * ratio;
        truck.lng = currentLng + dx * ratio;
        truck.currentRoad = findNearestRoad(truck.lat, truck.lng);
        return false;
    }
}

// Render truck controls (Admin only)
function renderTruckControls() {
    if (currentUser.role !== 'admin') return;
    
    const controlsGrid = document.getElementById('truck-controls');
    controlsGrid.innerHTML = '';

    trucks.forEach((truck, index) => {
        const controlGroup = document.createElement('div');
        controlGroup.className = 'control-group';
        controlGroup.innerHTML = `
            <div class="control-header">
                <div class="truck-name">🚛 ${truck.id}</div>
                <div class="control-buttons">
                    <button class="control-btn btn-edit" onclick="editTruckLocation(${index})">Edit Location</button>
                    <button class="control-btn btn-edit-id" onclick="editTruckId(${index})">Edit ID</button>
                    <button class="control-btn btn-remove" onclick="removeTruck(${index})">Remove</button>
                </div>
            </div>
            <div class="control-inputs">
                <div class="control-input">
                    <label for="speed-${index}">Speed</label>
                    <select id="speed-${index}" onchange="updateTruckSetting(${index}, 'speed', this.value)">
                        <option value="0.5" ${truck.speed === 0.5 ? 'selected' : ''}>Slow (0.5x)</option>
                        <option value="1.0" ${truck.speed === 1.0 ? 'selected' : ''}>Normal (1.0x)</option>
                        <option value="1.5" ${truck.speed === 1.5 ? 'selected' : ''}>Fast (1.5x)</option>
                        <option value="2.0" ${truck.speed === 2.0 ? 'selected' : ''}>Very Fast (2.0x)</option>
                    </select>
                </div>
                <div class="control-input">
                    <label for="rate-${index}">Collection Rate</label>
                    <select id="rate-${index}" onchange="updateTruckSetting(${index}, 'collectionRate', this.value)">
                        <option value="50" ${truck.collectionRate === 50 ? 'selected' : ''}>Slow (50 kg/min)</option>
                        <option value="100" ${truck.collectionRate === 100 ? 'selected' : ''}>Normal (100 kg/min)</option>
                        <option value="150" ${truck.collectionRate === 150 ? 'selected' : ''}>Fast (150 kg/min)</option>
                        <option value="200" ${truck.collectionRate === 200 ? 'selected' : ''}>Very Fast (200 kg/min)</option>
                    </select>
                </div>
                <div class="control-input">
                    <label for="capacity-${index}">Capacity</label>
                    <select id="capacity-${index}" onchange="updateTruckSetting(${index}, 'capacity', this.value)">
                        <option value="8000" ${truck.capacity === 8000 ? 'selected' : ''}>Small (8,000 kg)</option>
                        <option value="12000" ${truck.capacity === 12000 ? 'selected' : ''}>Medium (12,000 kg)</option>
                        <option value="15000" ${truck.capacity === 15000 ? 'selected' : ''}>Large (15,000 kg)</option>
                        <option value="20000" ${truck.capacity === 20000 ? 'selected' : ''}>Extra Large (20,000 kg)</option>
                    </select>
                </div>
                <div class="control-input">
                    <label for="load-${index}">Current Load</label>
                    <div class="load-input-container">
                        <input type="number" id="load-${index}" value="${Math.round(truck.load)}" 
                               min="0" max="${truck.capacity}" 
                               onchange="updateTruckSetting(${index}, 'load', this.value)">
                        <div class="real-time-badge">LIVE</div>
                    </div>
                </div>
            </div>
        `;
        controlsGrid.appendChild(controlGroup);
    });
}

// Update truck setting
function updateTruckSetting(index, setting, value) {
    if (currentUser.role !== 'admin') return;
    
    trucks[index][setting] = parseFloat(value);
    
    if (setting === 'load' || setting === 'capacity') {
        const loadPercentage = (trucks[index].load / trucks[index].capacity) * 100;
        if (loadPercentage >= 95 && trucks[index].status === 'collecting') {
            const nearestSite = findNearestDisposalSite(trucks[index].lat, trucks[index].lng);
            trucks[index].status = 'enroute-to-disposal';
            trucks[index].targetSite = nearestSite.id;
            trucks[index].route = 'to-disposal';
            
            trucks[index].routePath = calculateRoute(
                trucks[index].lat, 
                trucks[index].lng, 
                nearestSite.lat, 
                nearestSite.lng
            );
            trucks[index].currentRouteIndex = 0;
        }
    }
    
    updateTruckMarkers();
    renderTrucksList();
    updateStats();
}

// Edit truck location
function editTruckLocation(index) {
    if (currentUser.role !== 'admin') return;
    
    editingTruckIndex = index;
    const truck = trucks[index];
    
    document.getElementById('edit-truck-id').value = truck.id;
    document.getElementById('edit-latitude').value = truck.lat;
    document.getElementById('edit-longitude').value = truck.lng;
    
    document.getElementById('location-modal').style.display = 'block';
}

// Edit truck ID
function editTruckId(index) {
    if (currentUser.role !== 'admin') return;
    
    editingTruckIndex = index;
    const truck = trucks[index];
    
    document.getElementById('edit-old-truck-id').value = truck.id;
    document.getElementById('edit-new-truck-id').value = '';
    
    document.getElementById('truckid-modal').style.display = 'block';
}

// Close location modal
function closeLocationModal() {
    document.getElementById('location-modal').style.display = 'none';
    editingTruckIndex = null;
}

// Close truck ID modal
function closeTruckIdModal() {
    document.getElementById('truckid-modal').style.display = 'none';
    editingTruckIndex = null;
}

// Save truck location
function saveTruckLocation() {
    if (editingTruckIndex === null || currentUser.role !== 'admin') return;
    
    const lat = parseFloat(document.getElementById('edit-latitude').value);
    const lng = parseFloat(document.getElementById('edit-longitude').value);
    
    if (lat >= 17.8 && lat <= 18.2 && lng >= -77.0 && lng <= -76.6) {
        trucks[editingTruckIndex].lat = lat;
        trucks[editingTruckIndex].lng = lng;
        trucks[editingTruckIndex].currentRoad = findNearestRoad(lat, lng);
        
        updateTruckMarkers();
        renderTrucksList();
        closeLocationModal();
    } else {
        alert('Please enter valid coordinates for Kingston area:\\nLatitude: 17.8 - 18.2\\nLongitude: -77.0 - -76.6');
    }
}

// Save truck ID
function saveTruckId() {
    if (editingTruckIndex === null || currentUser.role !== 'admin') return;
    
    const newId = document.getElementById('edit-new-truck-id').value.trim().toUpperCase();
    
    if (newId && newId.length >= 3) {
        const existingTruck = trucks.find(truck => truck.id === newId && trucks.indexOf(truck) !== editingTruckIndex);
        if (!existingTruck) {
            trucks[editingTruckIndex].id = newId;
            
            updateTruckMarkers();
            renderTruckControls();
            renderTrucksList();
            closeTruckIdModal();
        } else {
            alert('Truck ID already exists. Please choose a different ID.');
        }
    } else {
        alert('Please enter a valid truck ID (minimum 3 characters).');
    }
}

// Remove truck
function removeTruck(index) {
    if (currentUser.role !== 'admin' || trucks.length <= 1) return;
    
    trucks.splice(index, 1);
    renderTruckControls();
    updateTruckMarkers();
    renderTrucksList();
    updateStats();
}

// Add new truck
function addNewTruck() {
    if (currentUser.role !== 'admin') return;
    
    truckCounter++;
    const zone = getRandomCollectionZone();
    const [lat, lng] = getPositionInZone(zone);
    
    const newTruck = {
        id: `KGN-${String(truckCounter).padStart(4, '0')}`,
        lat: lat,
        lng: lng,
        load: 0,
        capacity: 12000,
        status: 'collecting',
        speed: 1.0,
        collectionRate: 100,
        targetSite: null,
        route: null,
        currentRoad: findNearestRoad(lat, lng),
        collectionZone: zone.name,
        routePath: [],
        currentRouteIndex: 0,
        disposalTime: 0,
        lastUpdateTime: Date.now()
    };
    
    trucks.push(newTruck);
    renderTruckControls();
    updateTruckMarkers();
    renderTrucksList();
    updateStats();
}

// Render trucks list in sidebar
function renderTrucksList() {
    const trucksList = document.getElementById('trucks-list');
    trucksList.innerHTML = '';

    const displayTrucks = searchResults.length > 0 ? searchResults : trucks;

    displayTrucks.forEach(truck => {
        const loadPercentage = (truck.load / truck.capacity) * 100;
        const isSearchResult = searchResults.some(result => result.id === truck.id);
        const highlightClass = isSearchResult ? 'search-highlight' : '';
        
        const truckCard = document.createElement('div');
        truckCard.className = `truck-card ${truck.status} ${highlightClass}`;
        
        let destinationInfo = '';
        if (truck.targetSite) {
            const site = disposalSites.find(s => s.id === truck.targetSite);
            destinationInfo = `<div style="font-size: 10px; color: #94a3b8;">→ ${site?.name}</div>`;
        }
        
        truckCard.innerHTML = `
            <div class="truck-header">
                <div class="truck-id">🚛 ${truck.id}</div>
                <div class="truck-status status-${truck.status}">
                    ${truck.status.toUpperCase().replace('-', ' ')}
                </div>
            </div>
            <div class="load-bar-container">
                <div class="load-bar ${truck.status}" style="width: ${loadPercentage}%"></div>
            </div>
            <div class="load-info">
                <span>${Math.round(truck.load).toLocaleString()} kg</span>
                <span>${truck.capacity.toLocaleString()} kg (${Math.round(loadPercentage)}%)</span>
            </div>
            <div style="font-size: 10px; color: #94a3b8;">
                Road: ${truck.currentRoad} | Zone: ${truck.collectionZone}
            </div>
            ${destinationInfo}
            <div style="font-size: 10px; color: #94a3b8; margin-top: 5px;">
                Speed: ${truck.speed}x | Rate: ${truck.collectionRate} kg/min
            </div>
            <div class="real-time-indicator" style="margin-top: 5px; padding: 2px 6px; background: #1e293b; border-radius: 3px; text-align: center; font-size: 9px; color: #22c55e;">
                🔄 Real-time
            </div>
        `;
        trucksList.appendChild(truckCard);
    });
}

// Render plants list in sidebar
function renderPlantsList() {
    const plantsList = document.getElementById('plants-list');
    plantsList.innerHTML = '';

    disposalSites.forEach(site => {
        const plantCard = document.createElement('div');
        plantCard.className = 'plant-card';
        plantCard.innerHTML = `
            <div class="plant-header">
                <div class="plant-name">⚡ ${site.name}</div>
                <div class="plant-output">${site.output.toLocaleString()} kWh</div>
            </div>
            <div class="plant-location">
                📍 ${site.lat.toFixed(3)}, ${site.lng.toFixed(3)}
            </div>
        `;
        plantsList.appendChild(plantCard);
    });
}

// Update statistics
function updateStats() {
    const totalWaste = trucks.reduce((sum, truck) => sum + truck.load, 0);
    const steamEnergy = disposalSites.reduce((sum, site) => sum + site.output, 0);
    const carbonOffset = Math.round(steamEnergy * 0.4);
    const homesPowered = Math.round(steamEnergy / 30);

    document.getElementById('steam-energy').textContent = steamEnergy.toLocaleString() + ' kWh';
    document.getElementById('carbon-offset').textContent = carbonOffset.toLocaleString() + ' kg';
    document.getElementById('waste-processed').textContent = (totalWaste / 1000).toFixed(1) + ' tons';
    document.getElementById('homes-powered').textContent = homesPowered.toLocaleString();
}

// Simulation logic
function startSimulation() {
    setInterval(() => {
        updateTruckLoadsRealTime();
        updateUserLocationStatus();
    }, 1000);
    
    setInterval(() => {
        trucks.forEach(truck => {
            if (truck.status === 'collecting') {
                const zone = COLLECTION_ZONES.find(z => z.name === truck.collectionZone);
                if (zone) {
                    if (Math.random() < 0.3) {
                        const [newLat, newLng] = getPositionInZone(zone);
                        truck.routePath = calculateRoute(truck.lat, truck.lng, newLat, newLng);
                        truck.currentRouteIndex = 0;
                    }
                    
                    if (truck.routePath && truck.routePath.length > 0) {
                        const routeComplete = moveTruckAlongRoute(truck);
                        if (routeComplete) {
                            truck.routePath = [];
                        }
                    } else {
                        const moveDistance = 0.0001 * truck.speed;
                        truck.lat += (Math.random() - 0.5) * moveDistance;
                        truck.lng += (Math.random() - 0.5) * moveDistance;
                        truck.currentRoad = findNearestRoad(truck.lat, truck.lng);
                    }
                }

            } else if (truck.status === 'enroute-to-disposal') {
                const routeComplete = moveTruckAlongRoute(truck);
                
                if (routeComplete) {
                    truck.status = 'disposing';
                    truck.disposalTime = 0;
                }

            } else if (truck.status === 'disposing') {
                truck.disposalTime++;
                
                if (truck.disposalTime >= 3 + Math.floor(Math.random() * 3)) {
                    const targetSite = disposalSites.find(s => s.id === truck.targetSite);
                    if (targetSite) {
                        const energyGenerated = Math.round(truck.load * 5.2);
                        targetSite.output += energyGenerated;
                        
                        truck.load = 0;
                        truck.status = 'returning';
                        truck.route = 'returning';
                        
                        const returnZone = getRandomCollectionZone();
                        truck.collectionZone = returnZone.name;
                        const [returnLat, returnLng] = getPositionInZone(returnZone);
                        
                        truck.routePath = calculateRoute(truck.lat, truck.lng, returnLat, returnLng);
                        truck.currentRouteIndex = 0;
                    }
                }

            } else if (truck.status === 'returning') {
                const routeComplete = moveTruckAlongRoute(truck);
                
                if (routeComplete) {
                    truck.status = 'collecting';
                    truck.targetSite = null;
                    truck.route = null;
                    truck.routePath = [];
                }
            }
        });

        renderPlantsList();

    }, 2000);
}

// Start the application when page loads
document.addEventListener('DOMContentLoaded', init);