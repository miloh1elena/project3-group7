// Bubble chart beginning 
// Define the API URLs within plots.js for accessibility
const apiUrlSource = "http://localhost:8000/api/v1.0/source";
const apiUrlRating = "http://localhost:8000/api/v1.0/rating";
const apiUrlReviewDate = "http://localhost:8000/api/v1.0/review_date";

// Define the createBubbleChart function
function createBubbleChart() {
  // Load and process your data from the APIs
  Promise.all([
    d3.json(apiUrlSource),
    d3.json(apiUrlRating),
    d3.json(apiUrlReviewDate)
  ]).then(function (data) {
    const sourceData = data[0];
    const ratingData = data[1];
    const reviewDateData = data[2];

    // Extract unique months for the dropdown filter
    const uniqueMonths = Array.from(new Set(reviewDateData.map((date) => {
      const month = new Date(date).getUTCMonth() + 1;
      return month;
    })));

    // Populate the month dropdown
    const bubbleDropdown = d3.select("#platformDropdown");
    bubbleDropdown.append("option").attr("value", -1).text("Total");
    uniqueMonths.forEach((month) => {
      let monthName;
      switch (month) {
        case 7:
          monthName = "July";
          break;
        case 8:
          monthName = "August";
          break;
        default:
          monthName = `Month ${month}`;
      }
      bubbleDropdown.append("option").attr("value", month).text(monthName);
    });

    // Add event listener to the dropdown for filtering by month
    bubbleDropdown.on("change", function () {
      const selectedMonth = parseInt(d3.select(this).property("value"));
      updateBubbleChart(sourceData, selectedMonth, reviewDateData);
    });

    // Trigger the initial creation of the bubble chart
    updateBubbleChart(sourceData, -1, reviewDateData);
  });
}

// Update the bubble chart function
function updateBubbleChart(data, selectedMonth, reviewDateData) {
  let filteredData = data;

  if (selectedMonth !== -1) {
    filteredData = data.filter((source, index) => {
      const reviewMonth = new Date(reviewDateData[index]).getUTCMonth() + 1;
      return reviewMonth === selectedMonth;
    });
  }

  const googlePlayCount = filteredData.filter((d) => d === "Google Play").length;
  const appStoreCount = filteredData.filter((d) => d === "App Store").length;

  const bubbleData = [{
    x: [1],
    y: [1],
    text: [`Google Play: ${googlePlayCount}`],
    mode: 'markers',
    marker: {
      size: [googlePlayCount / 150],
      color: ['green']
    }
  }, {
    x: [2],
    y: [1],
    text: [`App Store: ${appStoreCount}`],
    mode: 'markers',
    marker: {
      size: [appStoreCount / 150],
      color: ['blue']
    }
  }];

  Plotly.newPlot('bubbleChart', bubbleData, {
    title: 'Reviews by Platforms',
    xaxis: {
      tickvals: [1, 2],
      ticktext: ['Google Play', 'App Store']
    },
    yaxis: {
      visible: false
    },
    showlegend: false  // Add this line to hide the legend
  });
}

// Trigger the initial creation of the bubble chart
createBubbleChart();

// line chart beginning  
// Function to parse ratings from the peculiar format
function parseRatings(data) {
  const regex = /\((\d),\)/g;
  let match;
  const numbers = [];
  while ((match = regex.exec(data)) !== null) {
    numbers.push(Number(match[1]));
  }
  return numbers;
}

// Fetch data from APIs
async function fetchData() {
  const dateResponse = await fetch("http://localhost:8000/api/v1.0/review_date");
  const ratingResponse = await fetch("http://localhost:8000/api/v1.0/rating");
  const sourceResponse = await fetch("http://localhost:8000/api/v1.0/source");
  
  const dateData = await dateResponse.json();
  const rawRatingData = await ratingResponse.text();
  const parsedRatingData = parseRatings(rawRatingData);
  const sourceData = await sourceResponse.json();

  const combinedData = dateData.map((d, i) => ({
    review_date: d,
    rating: parsedRatingData[i],
    source: sourceData[i]
  }));

  createLineChart(combinedData);
}

// Create the initial line chart
function createLineChart(data) {
  const uniquePlatforms = Array.from(new Set(data.map(d => d.source)));
  const lineDropdown = d3.select("#platformTrendDropdown");
  lineDropdown.append("option").attr("value", 'Total').text("Total");
  
  uniquePlatforms.forEach(platform => {
    lineDropdown.append("option").attr("value", platform).text(platform);
  });

  lineDropdown.on("change", function() {
    const selectedPlatform = d3.select(this).property("value");
    updateLineChart(data, selectedPlatform);
  });

  updateLineChart(data, 'Total');
}

// Update the line chart based on the selected platform
function updateLineChart(data, selectedPlatform) {
  const filteredData = selectedPlatform === 'Total' ? data : data.filter(d => d.source === selectedPlatform);
  
  const dateCounts = {};
  const positiveDateCounts = {};
  const negativeDateCounts = {};

  filteredData.forEach(d => {
    const reviewDate = new Date(d.review_date).toLocaleDateString();
    dateCounts[reviewDate] = (dateCounts[reviewDate] || 0) + 1;
    positiveDateCounts[reviewDate] = (positiveDateCounts[reviewDate] || 0) + (d.rating === 4 || d.rating === 5 ? 1 : 0);
    negativeDateCounts[reviewDate] = (negativeDateCounts[reviewDate] || 0) + (d.rating === 1 || d.rating === 2 || d.rating === 3 ? 1 : 0);
  });

  const dateCountArray = Object.entries(dateCounts).map(([date, count]) => ({ date, count }));
  const positiveDateCountArray = Object.entries(positiveDateCounts).map(([date, count]) => ({ date, count }));
  const negativeDateCountArray = Object.entries(negativeDateCounts).map(([date, count]) => ({ date, count }));

  // Sort by date in ascending order
  dateCountArray.sort((a, b) => new Date(a.date) - new Date(b.date));
  positiveDateCountArray.sort((a, b) => new Date(a.date) - new Date(b.date));
  negativeDateCountArray.sort((a, b) => new Date(a.date) - new Date(b.date));

  const lineData = [
    { x: dateCountArray.map(d => d.date), y: dateCountArray.map(d => d.count), mode: 'lines', name: 'Total Ratings', line: { color: 'black' }},
    { x: positiveDateCountArray.map(d => d.date), y: positiveDateCountArray.map(d => d.count), mode: 'lines', name: 'Positive Ratings', line: { color: 'green' }},
    { x: negativeDateCountArray.map(d => d.date), y: negativeDateCountArray.map(d => d.count), mode: 'lines', name: 'Negative Ratings', line: { color: 'red' }}
  ];

  const lineLayout = {
    title: 'Trends of Reviews',
    xaxis: {
      title: 'Date'
    },
    yaxis: {
      title: 'Number of Reviews'
    }
  };

  Plotly.newPlot('lineChart', lineData, lineLayout);
}

// Fetch data and create chart
fetchData();

// Bar chart beginning 
// Function to parse ratings from the peculiar format
function parseRatings(data) {
  const regex = /\((\d),\)/g;
  let match;
  const numbers = [];
  while ((match = regex.exec(data)) !== null) {
    numbers.push(Number(match[1]));
  }
  return numbers;
}

async function fetchDataForBarChart() {
  const [sourceData, ratingData, reviewDateData] = await Promise.all([
    fetch('http://localhost:8000/api/v1.0/source').then((res) => res.json()),
    fetch('http://localhost:8000/api/v1.0/rating').then((res) => res.text()),
    fetch('http://localhost:8000/api/v1.0/review_date').then((res) => res.json())
  ]);

  const parsedRatingData = parseRatings(ratingData);

  return sourceData.map((d, i) => ({
    source: d,
    rating: parsedRatingData[i],
    review_date: reviewDateData[i],
  }));
}

fetchDataForBarChart().then(function (data) {
  createBarChart(data);

  const uniqueMonths = Array.from(new Set(data.map((d) => new Date(d.review_date).getMonth() + 1)));
  const barDropdown = d3.select("#monthDropdown");

  barDropdown.append("option").attr("value", -1).text("Total");
  uniqueMonths.forEach((month) => {
    let monthName;
    switch (month) {
      case 7:
        monthName = "July";
        break;
      case 8:
        monthName = "August";
        break;
      default:
        monthName = `Month ${month}`;
    }
    barDropdown.append("option").attr("value", month).text(monthName);
  });

  barDropdown.on("change", function () {
    const selectedMonth = parseInt(d3.select(this).property("value"));
    updateBarChart(data, selectedMonth);
  });
});

function createBarChart(data) {
  updateBarChart(data, -1);
}

function updateBarChart(data, selectedMonth) {
  const filteredData = selectedMonth === -1
    ? data
    : data.filter(d => {
        const reviewDate = new Date(d.review_date);
        const reviewMonth = reviewDate.getMonth() + 1;
        return reviewMonth === selectedMonth;
      });

  const groupedData = d3.rollup(
    filteredData,
    (v) => {
      const total = v.length;
      const positive = v.filter((d) => d.rating === 4 || d.rating === 5).length;
      const negative = v.filter((d) => d.rating === 1 || d.rating === 2 || d.rating === 3).length;
      return { total, positive, negative };
    },
    (d) => d.source
  );

  const platforms = Array.from(groupedData.keys());
  const totalCounts = platforms.map((platform) => groupedData.get(platform).total);
  const positiveCounts = platforms.map((platform) => groupedData.get(platform).positive);
  const negativeCounts = platforms.map((platform) => groupedData.get(platform).negative);

  const barChartData = [
    {
      x: platforms,
      y: totalCounts,
      type: 'bar',
      name: 'Total Ratings',
      marker: { color: 'grey' }
    },
    {
      x: platforms,
      y: positiveCounts,
      type: 'bar',
      name: 'Positive Ratings',
      marker: { color: 'green' }
    },
    {
      x: platforms,
      y: negativeCounts,
      type: 'bar',
      name: 'Negative Ratings',
      marker: { color: 'red' }
    },
  ];

  const barChartLayout = {
    title: 'Number of Comments',
    xaxis: { title: 'Platform' },
    yaxis: { title: 'Number of Ratings' },
    barmode: 'group',
  };

  Plotly.newPlot('barChart', barChartData, barChartLayout);
}