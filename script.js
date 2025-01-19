document.addEventListener("DOMContentLoaded", () => {
    let chartInstance = null; // Store the chart instance for updating

    async function fetchStockStats() {
        try {
            const response = await fetch("https://stocksapi-uhe1.onrender.com/api/stocks/getstockstatsdata");
            const data = await response.json();

            const statsObject = data.stocksStatsData[0];
            const stocksList = document.getElementById('stocks-list');

            if (!stocksList) {
                console.error("Element with id 'stocks-list' not found in the DOM.");
                return;
            }

            stocksList.innerHTML = '';

            Object.keys(statsObject).forEach(symbol => {
                if (symbol === '_id') return;

                const stock = statsObject[symbol];
                const stockItem = document.createElement('div');
                stockItem.className = 'stock-item';
                stockItem.innerHTML = `
                    <h3>${symbol}</h3>
                    <p>Book Value: $${stock.bookValue.toFixed(2)}</p>
                    <p>Profit: ${stock.profit.toFixed(2)}%</p>
                `;

                stockItem.addEventListener('click', () => {
                    displayStockDetails(symbol, stock);
                    mystocksdata(symbol);
                });

                stocksList.appendChild(stockItem);
            });
        } catch (error) {
            console.error("Error fetching stock stats:", error);
        }
    }

    async function displayStockDetails(symbol, stock) {
        try {
            const response = await fetch("https://stocksapi-uhe1.onrender.com/api/stocks/getstocksprofiledata");
            const data = await response.json();
            const stocksProfileData = data.stocksProfileData;
            let stockSummary = '';

            if (stocksProfileData && stocksProfileData[0][symbol]) {
                stockSummary = stocksProfileData[0][symbol].summary;
            } else {
                console.log(`Summary for ${symbol} is not available.`);
            }

            const detailsSection = document.getElementById('details-section');
            detailsSection.innerHTML = `
                <h2>Stock Details</h2>
                <p><strong>Stock:</strong> ${symbol}</p>
                <p><strong>Book Value:</strong> $${stock.bookValue.toFixed(2)}</p>
                <p><strong>Profit:</strong> ${stock.profit.toFixed(2)}%</p>
                <p><strong>Summary:</strong> ${stockSummary}</p>
            `;
        } catch (error) {
            console.error("Error in displayStockDetails function:", error);
        }
    }

    function plotChart(chartData) {
        const ctx = document.getElementById('stockChart').getContext('2d');
        
        // If chart already exists, destroy it before creating a new one
        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(tooltipItem) {
                                return `Price: $${tooltipItem.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Stock Price (USD)'
                        },
                    }
                }
            }
        });
    }

    function processStockData(data, timeRange='5y', stockType='AAPL') {
        const stock = data.stocksData[0][stockType];
        const stockValues = stock[timeRange].value;
        const stockTimeStamps = stock[timeRange].timeStamp;        

        const dates = stockTimeStamps.map(timestamp => {
            const date = new Date(timestamp * 1000);
            return date.toLocaleDateString();
        });

        const chartData = {
            labels: dates,
            datasets: [{
                label: `${stockType} Stock Price (${timeRange})`,
                data: stockValues,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        };

        plotChart(chartData);
    }

    // Fetch stock data and plot chart for default time range (5Y)
    function mystocksdata(stockType='AAPL'){
        fetch("https://stocksapi-uhe1.onrender.com/api/stocks/getstocksdata")
        .then(response => response.json())
        .then(data => {
            processStockData(data,'5y',stockType);
        })
        .catch(error => console.error("Error fetching stock data:", error));
    

        // Event listeners for time range buttons
        document.querySelectorAll('#chart-btn button').forEach(button => {
            button.addEventListener('click', (e) => {
                const timeRange = e.target.dataset.time;  // 1M, 3M, 1Y, 5Y
                fetch("https://stocksapi-uhe1.onrender.com/api/stocks/getstocksdata")
                    .then(response => response.json())
                    .then(data => {
                        processStockData(data, timeRange.toLowerCase(),stockType);
                    })
                    .catch(error => console.error("Error fetching stock data:", error));
            });
        });
    }

    mystocksdata();
    fetchStockStats();
});
