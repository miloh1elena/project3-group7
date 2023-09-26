// Define the createBubbleChart function
function createBubbleChart(data) {
    // Initialize the bubble chart with "Total" data
    updateBubbleChart(data, -1); // -1 to indicate the total combined count
  }
  
  // Load and process your CSV data
  d3.csv("http://localhost:8000/updated_project_data.csv").then(function(data) {
    // Process and analyze the data here
  
    // Extract unique months for the dropdown filter
    const uniqueMonths = Array.from(new Set(data.map((d) => new Date(d.review_date).getMonth() + 1))); // Add 1 to get 1-based month numbers
  
    // Populate the month dropdown with "Total," "July," and "August"
    const platformDropdown = d3.select("#platformDropdown"); // Use the correct dropdown
    platformDropdown.append("option").attr("value", -1).text("Total");
    uniqueMonths.forEach((month) => {
      const monthName = new Date(2000, month - 1, 1).toLocaleString('en-US', { month: 'long' }); // Convert month number to name
      platformDropdown.append("option").attr("value", month).text(monthName);
    });
  
    // Set the default selection to "Total"
    platformDropdown.property("value", -1);
  
    // Add event listener to the dropdown menu for filtering by month
    platformDropdown.on("change", function() { // Use the correct dropdown
      const selectedMonth = parseInt(d3.select(this).property("value")); // Convert to integer
      updateBubbleChart(data, selectedMonth);
    });
  
    // Trigger the initial creation of the chart
    createBubbleChart(data);
    
    // Define function to update the bubble chart based on the selected month
    function updateBubbleChart(data, selectedMonth) {
      // Filter the data based on the selected month or show all data for "Total"
      const filteredData = selectedMonth === -1
        ? data // Show all data if "Total" selected
        : data.filter(function(d) {
            const reviewDate = new Date(d.review_date);
            const reviewMonth = reviewDate.getMonth() + 1; // Month is 0-indexed, so add 1
            return reviewMonth === selectedMonth;
          });
  
      // Calculate the counts for Google Play and App Store reviews in the filtered data
      const googlePlayCount = filteredData.filter(function(d) {
        return d.source === 'Google Play';
      }).length;
      const appStoreCount = filteredData.filter(function(d) {
        return d.source === 'App Store';
      }).length;
  
      // Calculate the total combined count for both platforms
      const totalCombinedCount = googlePlayCount + appStoreCount;
  
      // Define the bubble chart data with size divided by 100
      const bubbleData = [
        {
          platform: 'Google Play',
          count: googlePlayCount / 150, // Adjust the size by dividing by 100
          color: 'green',
          x: 1, // Set the x-coordinate for Google Play
        },
        {
          platform: 'App Store',
          count: appStoreCount / 150, // Adjust the size by dividing by 100
          color: 'blue',
          x: 2, // Set the x-coordinate for App Store
        },
      ];
  
      // Update the bubble chart with aligned centers
      Plotly.newPlot('bubbleChart', bubbleData.map((d) => ({
        x: [d.x],
        y: [1], // All bubbles will be aligned at y=1
        text: [`${d.platform}: ${d.count * 150} reviews`], // Multiply back by 100 for display text
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
          range: [0, 3], // Adjust the x-axis range to make bubbles smaller horizontally
        },
        showlegend: false, // Hide the legend
        margin: { t: 20 }, // Adjust the top margin for better display
      });
    }
  });