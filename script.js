// Configuration
const API_URL = 'http://localhost:5000';

// DOM Elements
const textInput = document.getElementById('textInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const resultsContainer = document.getElementById('resultsContainer');
const sentimentChartCanvas = document.getElementById('sentimentChart');
const historyList = document.getElementById('historyList');

// Initialize charts and data
let sentimentChart;
let barChart;
let timeSeriesChart;
let analysisHistory = [];
let chartMode = 'doughnut'; // doughnut, bar, or timeseries

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

analyzeBtn.addEventListener('click', analyzeText);
clearBtn.addEventListener('click', clearInput);

// Example button click handlers
document.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const exampleText = this.getAttribute('data-text');
        textInput.value = exampleText;
    });
});

function initializeApp() {
    console.log('Sentiment Analysis Dashboard initialized');
    
    // Load any saved history from localStorage
    loadHistoryFromStorage();
    
    // Initialize charts
    initializeDoughnutChart();
    
    // Add chart controls if they don't exist
    addChartControls();
}

function addChartControls() {
    const chartSection = document.querySelector('.chart-section');
    
    // Check if controls already exist
    if (!document.getElementById('chartControls')) {
        const controlsHTML = `
            <div class="chart-controls" id="chartControls">
                <button class="chart-btn active" onclick="switchChart('doughnut')">🍩 Doughnut</button>
                <button class="chart-btn" onclick="switchChart('bar')">📊 Bar Chart</button>
                <button class="chart-btn" onclick="switchChart('timeseries')">📈 Time Series</button>
                <button class="chart-btn" onclick="exportChartData()">💾 Export Data</button>
            </div>
        `;
        
        const chartContainer = chartSection.querySelector('.chart-container');
        const controlsElement = document.createElement('div');
        controlsElement.innerHTML = controlsHTML;
        chartSection.insertBefore(controlsElement.firstChild, chartContainer);
        
        // Add styles for chart controls
        addChartControlStyles();
    }
}

function addChartControlStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .chart-controls {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        
        .chart-btn {
            padding: 8px 15px;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }
        
        .chart-btn:hover {
            background: #e9ecef;
            transform: translateY(-2px);
        }
        
        .chart-btn.active {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }
        
        .chart-tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 100;
            display: none;
        }
    `;
    document.head.appendChild(style);
}

function switchChart(mode) {
    chartMode = mode;
    
    // Update active button
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(mode === 'doughnut' ? 'Doughnut' : mode === 'bar' ? 'Bar Chart' : 'Time Series')) {
            btn.classList.add('active');
        }
    });
    
    // Destroy existing charts
    if (sentimentChart) sentimentChart.destroy();
    if (barChart) barChart.destroy();
    if (timeSeriesChart) timeSeriesChart.destroy();
    
    // Create new chart based on mode
    switch(mode) {
        case 'doughnut':
            initializeDoughnutChart();
            break;
        case 'bar':
            createBarChart();
            break;
        case 'timeseries':
            createTimeSeriesChart();
            break;
    }
}

function initializeDoughnutChart() {
    const ctx = sentimentChartCanvas.getContext('2d');
    
    sentimentChart = new Chart(ctx, {
        type: 'doughnut',
        data: getChartData(),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%',
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
    
    updateChart();
}

function createBarChart() {
    const ctx = sentimentChartCanvas.getContext('2d');
    
    const data = getChartData();
    
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Sentiment Count',
                data: data.datasets[0].data,
                backgroundColor: data.datasets[0].backgroundColor,
                borderColor: data.datasets[0].backgroundColor.map(color => color.replace('0.8', '1')),
                borderWidth: 1,
                borderRadius: 5,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            if (Number.isInteger(value)) {
                                return value;
                            }
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
    
    // Add data labels on top of bars
    Chart.register({
        id: 'datalabels',
        afterDatasetsDraw(chart) {
            const { ctx, data, chartArea: { top, bottom, left, right, width, height } } = chart;
            
            ctx.save();
            
            data.datasets.forEach((dataset, i) => {
                const meta = chart.getDatasetMeta(i);
                
                meta.data.forEach((bar, index) => {
                    const value = dataset.data[index];
                    if (value > 0) {
                        ctx.fillStyle = '#2d3436';
                        ctx.font = 'bold 12px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        
                        const x = bar.x;
                        const y = bar.y - 5;
                        
                        ctx.fillText(value, x, y);
                    }
                });
            });
            
            ctx.restore();
        }
    });
    
    updateChart();
}

function createTimeSeriesChart() {
    const ctx = sentimentChartCanvas.getContext('2d');
    
    // Prepare time series data
    const timeData = prepareTimeSeriesData();
    
    timeSeriesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeData.labels,
            datasets: [
                {
                    label: 'Positive',
                    data: timeData.positive,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 8
                },
                {
                    label: 'Negative',
                    data: timeData.negative,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 8
                },
                {
                    label: 'Neutral',
                    data: timeData.neutral,
                    borderColor: '#6c757d',
                    backgroundColor: 'rgba(108, 117, 125, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(tooltipItems) {
                            return `Time: ${tooltipItems[0].label}`;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y} sentiment${context.parsed.y === 1 ? '' : 's'}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Analyses'
                    },
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time Period'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
    
    updateChart();
}

function prepareTimeSeriesData() {
    if (analysisHistory.length === 0) {
        return {
            labels: ['No Data'],
            positive: [0],
            negative: [0],
            neutral: [0]
        };
    }
    
    // Group by hour for the last 24 hours
    const now = new Date();
    const hours = 24;
    const labels = [];
    const positiveData = new Array(hours).fill(0);
    const negativeData = new Array(hours).fill(0);
    const neutralData = new Array(hours).fill(0);
    
    // Create labels for last 24 hours
    for (let i = hours - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
        labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    
    // Count sentiments per hour
    analysisHistory.forEach(item => {
        const itemTime = new Date(item.timestamp);
        const hourDiff = Math.floor((now - itemTime) / (60 * 60 * 1000));
        
        if (hourDiff >= 0 && hourDiff < hours) {
            const index = hours - 1 - hourDiff;
            
            switch(item.sentiment) {
                case 'positive':
                    positiveData[index]++;
                    break;
                case 'negative':
                    negativeData[index]++;
                    break;
                case 'neutral':
                    neutralData[index]++;
                    break;
            }
        }
    });
    
    return {
        labels: labels,
        positive: positiveData,
        negative: negativeData,
        neutral: neutralData
    };
}

function getChartData() {
    // Count sentiment occurrences
    const counts = {
        positive: 0,
        neutral: 0,
        negative: 0
    };
    
    analysisHistory.forEach(item => {
        if (counts.hasOwnProperty(item.sentiment)) {
            counts[item.sentiment]++;
        }
    });
    
    return {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [{
            data: [counts.positive, counts.neutral, counts.negative],
            backgroundColor: [
                'rgba(40, 167, 69, 0.8)',    // Green
                'rgba(108, 117, 125, 0.8)',  // Gray
                'rgba(220, 53, 69, 0.8)'     // Red
            ],
            borderColor: [
                'rgb(40, 167, 69)',          // Green
                'rgb(108, 117, 125)',        // Gray
                'rgb(220, 53, 69)'           // Red
            ],
            borderWidth: 2,
            hoverOffset: 15
        }]
    };
}

function updateChart() {
    const data = getChartData();
    
    switch(chartMode) {
        case 'doughnut':
            if (sentimentChart) {
                sentimentChart.data = data;
                sentimentChart.update('none');
            }
            break;
        case 'bar':
            if (barChart) {
                barChart.data.datasets[0].data = data.datasets[0].data;
                barChart.update('none');
            }
            break;
        case 'timeseries':
            if (timeSeriesChart) {
                const timeData = prepareTimeSeriesData();
                timeSeriesChart.data.labels = timeData.labels;
                timeSeriesChart.data.datasets[0].data = timeData.positive;
                timeSeriesChart.data.datasets[1].data = timeData.negative;
                timeSeriesChart.data.datasets[2].data = timeData.neutral;
                timeSeriesChart.update('none');
            }
            break;
    }
}

function exportChartData() {
    const data = {
        history: analysisHistory,
        summary: getChartSummary(),
        exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sentiment-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    // Show notification
    showNotification('Chart data exported successfully!', 'success');
}

function getChartSummary() {
    const counts = {
        positive: 0,
        neutral: 0,
        negative: 0,
        total: analysisHistory.length
    };
    
    analysisHistory.forEach(item => {
        if (counts.hasOwnProperty(item.sentiment)) {
            counts[item.sentiment]++;
        }
    });
    
    // Calculate percentages
    counts.positivePercentage = counts.total > 0 ? ((counts.positive / counts.total) * 100).toFixed(1) : 0;
    counts.neutralPercentage = counts.total > 0 ? ((counts.neutral / counts.total) * 100).toFixed(1) : 0;
    counts.negativePercentage = counts.total > 0 ? ((counts.negative / counts.total) * 100).toFixed(1) : 0;
    
    return counts;
}

function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 400px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                animation: slideIn 0.3s ease;
            }
            
            .notification-success {
                background: linear-gradient(135deg, #00b09b 0%, #96c93d 100%);
            }
            
            .notification-info {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            
            .notification-warning {
                background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%);
            }
            
            .notification-error {
                background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
            }
            
            .notification button {
                background: transparent;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                margin-left: 15px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

async function analyzeText() {
    const text = textInput.value.trim();
    
    if (!text) {
        showNotification('Please enter some text to analyze', 'warning');
        return;
    }
    
    // Show loading state
    analyzeBtn.disabled = true;
    const originalText = analyzeBtn.innerHTML;
    analyzeBtn.innerHTML = '<span class="loading"></span> Analyzing...';
    
    try {
        const response = await fetch(`${API_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        
        // Display results
        displayResults(result);
        
        // Add to history
        addToHistory(result);
        
        // Update all charts
        updateChart();
        
        // Show success notification
        showNotification(`Sentiment: ${result.sentiment.toUpperCase()} detected!`, 'success');
        
    } catch (error) {
        console.error('Error analyzing text:', error);
        showNotification('Failed to analyze text. Please check backend connection.', 'error');
    } finally {
        // Reset button state
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = originalText;
    }
}

function displayResults(result) {
    console.log('🔍 Displaying result:', result); // Debug line
    
    // FIX: Use word_count instead of words
    const { sentiment, polarity, subjectivity, word_count } = result;
    
    // Determine sentiment color and icon - ADD SUPPORT FOR "slightly positive/negative"
    let sentimentColor, sentimentIcon, sentimentText;
    switch(sentiment) {
        case 'positive':
            sentimentColor = 'sentiment-positive';
            sentimentIcon = '😊';
            sentimentText = 'Positive';
            break;
        case 'negative':
            sentimentColor = 'sentiment-negative';
            sentimentIcon = '😠';
            sentimentText = 'Negative';
            break;
        case 'slightly positive':
            sentimentColor = 'sentiment-slightly-positive';
            sentimentIcon = '🙂';
            sentimentText = 'Slightly Positive';
            break;
        case 'slightly negative':
            sentimentColor = 'sentiment-slightly-negative';
            sentimentIcon = '🙁';
            sentimentText = 'Slightly Negative';
            break;
        default:
            sentimentColor = 'sentiment-neutral';
            sentimentIcon = '😐';
            sentimentText = 'Neutral';
    }
    
    // Create result card HTML - FIXED: use word_count not words
    const resultHTML = `
        <div class="result-card">
            <div class="sentiment-header">
                <span class="sentiment-icon">${sentimentIcon}</span>
                <h3 class="sentiment-label ${sentimentColor}">${sentimentText}</h3>
            </div>
            
            <div class="metrics">
                <div class="metric">
                    <div class="metric-label">Polarity</div>
                    <div class="metric-value">${polarity}</div>
                    <div class="polarity-bar">
                        <div class="polarity-fill" style="
                            width: ${((polarity + 1) / 2) * 100}%;
                            background: linear-gradient(90deg, 
                                ${polarity < -0.1 ? '#dc3545' : polarity > 0.1 ? '#28a745' : '#6c757d'} 
                                0%, 
                                ${polarity < -0.1 ? '#ff8a80' : polarity > 0.1 ? '#80e27e' : '#bdbdbd'} 
                                100%);
                        "></div>
                    </div>
                </div>
                
                <div class="metric">
                    <div class="metric-label">Subjectivity</div>
                    <div class="metric-value">${subjectivity}</div>
                    <div class="polarity-bar">
                        <div class="polarity-fill" style="
                            width: ${subjectivity * 100}%;
                            background: linear-gradient(90deg, #4a6fa5 0%, #6d9dc5 100%);
                        "></div>
                    </div>
                </div>
                
                <div class="metric">
                    <div class="metric-label">Word Count</div>
                    <div class="metric-value">${word_count}</div>
                </div>
            </div>
            
            <div class="text-preview">
                <strong>Analyzed Text:</strong>
                <p>"${result.text.length > 100 ? result.text.substring(0, 100) + '...' : result.text}"</p>
            </div>
        </div>
    `;
    
    // Update results container
    resultsContainer.innerHTML = resultHTML;
}

function displayError(message) {
    resultsContainer.innerHTML = `
        <div class="result-card" style="border-left: 4px solid #dc3545;">
            <h3 style="color: #dc3545;">Error</h3>
            <p>${message}</p>
        </div>
    `;
}

function clearInput() {
    textInput.value = '';
    resultsContainer.innerHTML = `
        <div class="no-results">
            <p>Enter text above to see sentiment analysis results</p>
        </div>
    `;
    showNotification('Input cleared', 'info');
}

function addToHistory(result) {
    const historyItem = {
        ...result,
        timestamp: new Date().toISOString(),
        id: Date.now()
    };
    
    analysisHistory.unshift(historyItem); // Add to beginning
    
    // Keep only last 100 items
    if (analysisHistory.length > 100) {
        analysisHistory = analysisHistory.slice(0, 100);
    }
    
    // Save to localStorage
    saveHistoryToStorage();
    
    // Update history display
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    if (analysisHistory.length === 0) {
        historyList.innerHTML = '<p class="no-history">No analysis history yet</p>';
        return;
    }
    
    let historyHTML = '';
    
    analysisHistory.slice(0, 10).forEach(item => { // Show only last 10
        let sentimentClass, sentimentIcon;
        
        switch(item.sentiment) {
            case 'positive':
                sentimentClass = 'positive';
                sentimentIcon = '😊';
                break;
            case 'negative':
                sentimentClass = 'negative';
                sentimentIcon = '😠';
                break;
            default:
                sentimentClass = 'neutral';
                sentimentIcon = '😐';
        }
        
        historyHTML += `
            <div class="history-item ${sentimentClass}">
                <div class="history-text">
                    ${sentimentIcon} ${item.text.substring(0, 80)}${item.text.length > 80 ? '...' : ''}
                </div>
                <div class="history-meta">
                    <span>${item.sentiment.toUpperCase()}</span>
                    <span>${new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            </div>
        `;
    });
    
    historyList.innerHTML = historyHTML;
}

function saveHistoryToStorage() {
    try {
        localStorage.setItem('sentimentHistory', JSON.stringify(analysisHistory));
    } catch (error) {
        console.warn('Could not save history to localStorage:', error);
    }
}

function loadHistoryFromStorage() {
    try {
        const savedHistory = localStorage.getItem('sentimentHistory');
        if (savedHistory) {
            analysisHistory = JSON.parse(savedHistory);
            updateHistoryDisplay();
            updateChart();
        }
    } catch (error) {
        console.warn('Could not load history from localStorage:', error);
    }
}

// File upload functionality
async function analyzeFile(file) {
    const text = await file.text();
    textInput.value = text;
    await analyzeText();
}

// Add file upload button to the input section
const fileInputHTML = `
    <div class="file-upload">
        <input type="file" id="fileInput" accept=".txt,.csv,.json" style="display: none;">
        <button onclick="document.getElementById('fileInput').click()" class="btn secondary">
            📁 Upload File
        </button>
    </div>
`;

// Add file upload to the input controls
const inputControls = document.querySelector('.input-controls');
if (inputControls && !document.getElementById('fileInput')) {
    const fileUploadDiv = document.createElement('div');
    fileUploadDiv.innerHTML = fileInputHTML;
    inputControls.appendChild(fileUploadDiv.firstChild);
    
    // Add event listener for file input
    document.getElementById('fileInput').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            analyzeFile(e.target.files[0]);
        }
    });
}

// Real-time analysis as user types
let typingTimer;
const doneTypingInterval = 1000; // 1 second

textInput.addEventListener('input', function() {
    clearTimeout(typingTimer);
    
    if (textInput.value.trim().length > 10) {
        typingTimer = setTimeout(analyzeText, doneTypingInterval);
    }
});

// Export history function
function exportHistory() {
    const dataStr = JSON.stringify(analysisHistory, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sentiment-analysis-history.json';
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('History exported successfully!', 'success');
}