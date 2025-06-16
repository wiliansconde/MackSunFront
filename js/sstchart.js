const API_URL = 'search/chart-data-sst';

async function fetchData() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}${API_URL}`, {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        const normalizedResponse = await response.json();
        console.log(normalizedResponse);
        return normalizedResponse.data;
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        return null;
    }
}

    function parseTime(timeString) {
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes;
    }

    function processTelescopeData(data) {
      const points = data.points;
      const lastHourData = points.slice(-60);

      return lastHourData.map(point => ({
        time: point.time,
        timeMinutes: parseTime(point.time),
        channel1: point.sfuChannel1, // 212 GHz
        channel2: point.sfuChannel2  // 405 GHz
      }));
    }

     async function createChart() {
      const telescopeData = await fetchData();

      const data = processTelescopeData(telescopeData);

    
      const margin = { top: 20, right: 30, bottom: 40, left: 60 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.bottom - margin.top;

     
      const svg = d3.select("#sst")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    
      const xExtent = d3.extent(data, d => d.timeMinutes);
      const x = d3.scaleLinear()
        .domain(xExtent)
        .range([0, width]);

      const yMax = Math.max(
        d3.max(data, d => d.channel1),
        d3.max(data, d => d.channel2)
      );
      const yMin = Math.min(
        d3.min(data, d => d.channel1),
        d3.min(data, d => d.channel2)
      );

      const y = d3.scaleLinear()
        .domain([yMin - 5, yMax + 5])
        .range([height, 0]);

      
      function formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      }

      
      svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
          .tickSize(-height)
          .tickFormat("")
          .ticks(6)
        );

      svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
          .tickSize(-width)
          .tickFormat("")
        );

      
      const xAxis = d3.axisBottom(x)
        .ticks(6)
        .tickFormat(d => formatTime(d));

      svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

      svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y));

     
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#666")
        .text("Intensity (AU)");

      svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + margin.bottom})`)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#666")
        .text("Time");

      
      const line1 = d3.line()
        .x(d => x(d.timeMinutes))
        .y(d => y(d.channel1))
        .curve(d3.curveMonotoneX);

      const line2 = d3.line()
        .x(d => x(d.timeMinutes))
        .y(d => y(d.channel2))
        .curve(d3.curveMonotoneX);

   
      svg.append("path")
        .datum(data)
        .attr("class", "line-212ghz")
        .attr("d", line1);

      svg.append("path")
        .datum(data)
        .attr("class", "line-405ghz")
        .attr("d", line2);

      
      setupTooltip(svg, data, x, y, width, height);
    }

   
    function setupTooltip(svg, data, x, y, width, height) {
      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip");

      const bisect = d3.bisector(d => d.timeMinutes).left;

    
      const hoverLine = svg.append("line")
        .attr("class", "hover-line")
        .attr("y1", 0)
        .attr("y2", height);

   
      const hoverDot1 = svg.append("circle")
        .attr("class", "hover-dot")
        .attr("r", 5)
        .attr("fill", "#ff6b6b");

      const hoverDot2 = svg.append("circle")
        .attr("class", "hover-dot")
        .attr("r", 5)
        .attr("fill", "#4ecdc4");

     
      svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function () {
          hoverLine.style("opacity", 1);
          hoverDot1.style("opacity", 1);
          hoverDot2.style("opacity", 1);
          tooltip.style("opacity", 1);
        })
        .on("mouseout", function () {
          hoverLine.style("opacity", 0);
          hoverDot1.style("opacity", 0);
          hoverDot2.style("opacity", 0);
          tooltip.style("opacity", 0);
        })
        .on("mousemove", function (event) {
          const [mouseX] = d3.pointer(event);
          const x0 = x.invert(mouseX);
          const i = bisect(data, x0, 1);
          const d0 = data[i - 1];
          const d1 = data[i];

          if (d0 && d1) {
            const d = x0 - d0.timeMinutes > d1.timeMinutes - x0 ? d1 : d0;

           
            const xPos = x(d.timeMinutes);
            hoverLine.attr("x1", xPos).attr("x2", xPos);
            hoverDot1.attr("cx", xPos).attr("cy", y(d.channel1));
            hoverDot2.attr("cx", xPos).attr("cy", y(d.channel2));

           
            tooltip.html(`
                            <div class="tooltip-time">${d.time}</div>
                            <div class="tooltip-value">45 GHz: ${d.channel1.toFixed(2)} AU</div>
                            <div class="tooltip-value">90 GHz: ${d.channel2.toFixed(2)} AU</div>
                        `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 10) + "px");
          }
        });
    }

   
    document.addEventListener('DOMContentLoaded', function () {
       function updateDateTime() {
            const now = new Date();
            
         
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            
            const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}`;
            
            
            document.getElementById('updateTime2').textContent = `Updated on: ${formattedDateTime}`;
        }

        
        updateDateTime();
        
        
        setInterval(updateDateTime, 60000);
        
       
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                updateDateTime();
            }
        });
      createChart();
    });
  