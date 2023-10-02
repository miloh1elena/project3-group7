// Define the createBubbleChart function
function createBubbleChart(data) {
  // Initialize the bubble chart with default data (Total)
  updateBubbleChart(data, -1); // -1 to indicate the total combined count
}

// Load and process your CSV data
d3.csv("http://localhost:8000/updated_project_data.csv").then(function (data) {
  // Process and analyze the data here

  // Extract unique months for the dropdown filter
  const uniqueMonths = Array.from(new Set(data.map((d) => new Date(d.review_date).getMonth() + 1))); // Add 1 to get 1-based month numbers

  // Populate the month dropdown for the bubble chart
  const bubbleDropdown = d3.select("#platformDropdown"); // Dropdown for the bubble chart
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

  // Add event listener to the bubble chart dropdown for filtering by month
  bubbleDropdown.on("change", function () {
    const selectedMonth = parseInt(d3.select(this).property("value"));
    updateBubbleChart(data, selectedMonth);
  });

  // Trigger the initial creation of the bubble chart
  createBubbleChart(data);
});

// Define function to update the bubble chart based on the selected month
function updateBubbleChart(data, selectedMonth) {
  // Filter the data based on the selected month or show all data for "Total"
  const filteredData = selectedMonth === -1
    ? data // Show all data if "Total" selected
    : data.filter(function (d) {
        const reviewDate = new Date(d.review_date);
        const reviewMonth = reviewDate.getMonth() + 1; // Month is 0-indexed, so add 1
        return reviewMonth === selectedMonth;
      });

  // Calculate the counts for Google Play and App Store reviews in the filtered data
  const googlePlayCount = filteredData.filter(function (d) {
    return d.source === 'Google Play';
  }).length;
  const appStoreCount = filteredData.filter(function (d) {
    return d.source === 'App Store';
  }).length;

  // Calculate the total combined count for both platforms
  const totalCombinedCount = googlePlayCount + appStoreCount;

  // Define the bubble chart data with size divided by 150
  const bubbleData = [
    {
      platform: 'Google Play',
      count: googlePlayCount / 150, // Adjust the size by dividing by 150
      color: 'green',
      x: 1, // Set the x-coordinate for Google Play
    },
    {
      platform: 'App Store',
      count: appStoreCount / 150, // Adjust the size by dividing by 150
      color: 'blue',
      x: 2, // Set the x-coordinate for App Store
    },
  ];

  // Update the bubble chart with aligned centers
  Plotly.newPlot('bubbleChart', bubbleData.map((d) => ({
    x: [d.x],
    y: [1], // All bubbles will be aligned at y=1
    text: [`${d.platform}: ${Math.round(d.count * 150)} reviews`], // Multiply back by 150 for display text
    mode: 'markers',
    marker: {
      size: [d.count], // Adjusted size
      color: [d.color],
    },
  })), {
    title: 'Reviews by Platforms',
    xaxis: {
      title: 'Platform',
      tickvals: [1, 2], // Set the tick values to match the x-coordinates
      ticktext: ['Google Play', 'App Store'], // Set the tick labels
    },
    showlegend: false, // Hide the legend
    margin: { t: 20 }, // Adjust the top margin for better display
  });
}

// Define the createLineChart function
function createLineChart(data) {
  // Initialize the line chart with default data (Total)
  updateLineChart(data, 'Total'); // 'Total' to indicate the total combined count
}

// Load and process your CSV data
d3.csv("http://localhost:8000/updated_project_data.csv").then(function (data) {
  // Process and analyze the data here

  // Extract unique platforms for the dropdown filter of the 'Trends of Reviews' chart
  const uniquePlatforms = Array.from(new Set(data.map((d) => d.source)));

  // Populate the platform dropdown for the 'Trends of Reviews' chart
  const lineDropdown = d3.select("#platformTrendDropdown"); // Dropdown for the line chart
  lineDropdown.append("option").attr("value", 'Total').text("Total");
  uniquePlatforms.forEach((platform) => {
    lineDropdown.append("option").attr("value", platform).text(platform);
  });

  // Add event listener to the 'Trends of Reviews' chart dropdown for filtering by platform
  lineDropdown.on("change", function () {
    const selectedPlatform = d3.select(this).property("value");
    updateLineChart(data, selectedPlatform);
  });

  // Trigger the initial creation of the line chart
  createLineChart(data);
});

// Define function to update the line chart based on the selected platform
function updateLineChart(data, selectedPlatform) {
  // Filter the data based on the selected platform or show all data for "Total"
  const filteredData = selectedPlatform === 'Total'
    ? data
    : data.filter(function (d) {
        return d.source === selectedPlatform;
      });

  // Extract dates and count ratings for each day
  const dateCounts = {};
  const positiveDateCounts = {}; // Separate counts for positive ratings
  const negativeDateCounts = {}; // Separate counts for negative ratings

  filteredData.forEach((d) => {
    const reviewDate = new Date(d.review_date).toLocaleDateString();
    if (!dateCounts[reviewDate]) {
      dateCounts[reviewDate] = 0;
      positiveDateCounts[reviewDate] = 0; // Initialize counts for positive ratings
      negativeDateCounts[reviewDate] = 0; // Initialize counts for negative ratings
    }
    dateCounts[reviewDate]++;
    // Check if the rating is positive (4 or 5)
    if (d.rating === '4' || d.rating === '5') {
      positiveDateCounts[reviewDate]++;
    }
    // Check if the rating is negative (1, 2, or 3)
    if (d.rating === '1' || d.rating === '2' || d.rating === '3') {
      negativeDateCounts[reviewDate]++;
    }
  });

  // Convert dateCounts objects to arrays of objects
  const dateCountArray = Object.entries(dateCounts).map(([date, count]) => ({ date, count }));
  const positiveDateCountArray = Object.entries(positiveDateCounts).map(([date, count]) => ({ date, count }));
  const negativeDateCountArray = Object.entries(negativeDateCounts).map(([date, count]) => ({ date, count }));

  // Sort the arrays by date
  dateCountArray.sort((a, b) => new Date(a.date) - new Date(b.date));
  positiveDateCountArray.sort((a, b) => new Date(a.date) - new Date(b.date));
  negativeDateCountArray.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Extract dates and counts for the chart
  const dates = dateCountArray.map((entry) => entry.date);
  const totalCounts = dateCountArray.map((entry) => entry.count);
  const positiveCounts = positiveDateCountArray.map((entry) => entry.count);
  const negativeCounts = negativeDateCountArray.map((entry) => entry.count);

  // Create the line chart data
  const lineData = [
    {
      x: dates,
      y: totalCounts,
      mode: 'lines',
      name: 'Total Ratings',
      line: { color: 'black' },
    },
    {
      x: dates,
      y: positiveCounts,
      mode: 'lines',
      name: 'Positive Ratings',
      line: { color: 'green' },
    },
    {
      x: dates,
      y: negativeCounts,
      mode: 'lines',
      name: 'Negative Ratings',
      line: { color: 'red' },
    },
  ];

  // Layout for the line chart
  const lineLayout = {
    title: 'Trends of Reviews',
    xaxis: {
      title: 'Date',
      tickvals: dates, // Set tick values to match the dates
      ticktext: dates, // Set tick labels as the dates
    },
    yaxis: {
      title: 'Number of Reviews',
    },
  };

  // Update the line chart
  Plotly.newPlot('lineChart', lineData, lineLayout);
}

// Define the createBarChart function
function createBarChart(data) {
  // Initialize the bar chart with default data (Total)
  updateBarChart(data, -1); // -1 to indicate the total combined count
}

// Load and process your CSV data
d3.csv("http://localhost:8000/updated_project_data.csv").then(function (data) {
  // Process and analyze the data here

  // Extract unique months for the dropdown filter
  const uniqueMonths = Array.from(new Set(data.map((d) => new Date(d.review_date).getMonth() + 1))); // Add 1 to get 1-based month numbers

  // Populate the month dropdown for the bar chart
  const barDropdown = d3.select("#monthDropdown"); // Dropdown for the bar chart
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

  // Add event listener to the month dropdown for filtering the bar chart by month
  barDropdown.on("change", function () {
    const selectedMonth = parseInt(d3.select(this).property("value"));
    updateBarChart(data, selectedMonth);
  });

  // Trigger the initial creation of the bar chart
  createBarChart(data);
});

// Define function to update the bar chart based on the selected month
function updateBarChart(data, selectedMonth) {
  // Filter the data based on the selected month or show all data for "Total"
  const filteredData = selectedMonth === -1
    ? data // Show all data if "Total" selected
    : data.filter(function (d) {
        const reviewDate = new Date(d.review_date);
        const reviewMonth = reviewDate.getMonth() + 1; // Month is 0-indexed, so add 1
        return reviewMonth === selectedMonth;
      });

  // Group data by platform and calculate counts for Total, Positive, and Negative ratings
  const groupedData = d3.rollup(
    filteredData,
    (v) => {
      const total = v.length;
      const positive = v.filter((d) => d.rating === '4' || d.rating === '5').length;
      const negative = v.filter((d) => d.rating === '1' || d.rating === '2' || d.rating === '3').length;
      return { total, positive, negative };
    },
    (d) => d.source
  );

  // Extract unique platforms for the X-axis
  const platforms = Array.from(groupedData.keys());

  // Extract data for the three groups (Total, Positive, Negative)
  const totalCounts = platforms.map((platform) => groupedData.get(platform).total);
  const positiveCounts = platforms.map((platform) => groupedData.get(platform).positive);
  const negativeCounts = platforms.map((platform) => groupedData.get(platform).negative);

  // Create the vertical bar chart data
  const barChartData = [
    {
      x: platforms,
      y: totalCounts,
      type: 'bar',
      name: 'Total Ratings',
    },
    {
      x: platforms,
      y: positiveCounts,
      type: 'bar',
      name: 'Positive Ratings',
    },
    {
      x: platforms,
      y: negativeCounts,
      type: 'bar',
      name: 'Negative Ratings',
    },
  ];

  // Layout for the vertical bar chart
  const barChartLayout = {
    title: 'Number of Comments',
    xaxis: {
      title: 'Platform',
    },
    yaxis: {
      title: 'Number of Ratings',
    },
    barmode: 'group', // Group bars for each platform
  };

  // Update the vertical bar chart
  Plotly.newPlot('barChart', barChartData, barChartLayout);
}