import { useState, useRef, useEffect } from 'react'
import './App.css'
import * as d3 from 'd3'

const revenueFormat = d3.format('$,.2f');


function App() {
  const [data, setData] = useState(null);
  const [originalTotal, setOriginalTotal] = useState(0); // Add state for originalTotal
  const svgRef = useRef();
  const legendRef = useRef();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json');
        if (res.ok) {
          const data = await res.json();
          setData(data);

          // Calculate originalTotal when data is fetched
          const total = data.children.reduce((acc, category) => 
            acc + category.children.reduce((acc2, movie) => acc2 + movie.value, 0), 0
          );
          setOriginalTotal(total);
        }
      } catch (error) {
        console.error("There was an error: ", error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!data || !originalTotal) return;

    const width = 1100;
    const height = 600;
    const totalArea = width * height;
    const SCALE = 1000; // Scaling factor

    // Use scaled values for layout
    const root = d3.hierarchy(data)
      .sum(d => d.value ? Math.round(d.value * SCALE) : 0) // Scale to integers
      .sort((a, b) => b.value - a.value);

    const treemap = d3.treemap()
      .size([width, height])
      .padding(0)
      .round(false)
      (root);

    // Area verification (using original values)
    treemap.leaves().forEach(d => {
      const area = (d.x1 - d.x0) * (d.y1 - d.y0);
      const expectedArea = (d.data.value / originalTotal) * totalArea; // Use originalTotal
      console.log('Area ratio:', area / expectedArea);
    });

    const svg = d3.select(svgRef.current)
      .style('height', height)
      .style('width', width)
      .style('border', '1px solid black');

    // Append tiles with original data-value
    const leaf = svg.selectAll('g')
      .data(treemap.leaves())
      .join('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

      const colorScale = d3.scaleOrdinal()
      .domain(data.children.map(d => d.name))
      .range(d3.schemeCategory10);

    leaf.append('rect')
      .attr('class', 'tile')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('data-name', d => d.data.name)
      .attr('data-category', d => d.data.category)
      .attr('data-value', d => d.data.value) // Use original value
      .attr('fill', d => colorScale(d.data.category));

      leaf.append('text')
  .attr('text-anchor', 'middle')
  .attr('dominant-baseline', 'middle')
  .each(function(d) {
    const width = Math.abs(d.x1 - d.x0);
    const height = Math.abs(d.y1 - d.y0);
    const text = d.data.name;
    const epsilon = 1e-10;
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for(let i = 1; i < words.length; i++) {
      if (currentLine.length + words[i].length < 15) {
        currentLine += " " + words[i];
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
    
    const fontSize = Math.min(
      width / (Math.max(...lines.map(l => l.length)) * 0.5),
      height / (lines.length * 2)
    );

    d3.select(this)
      .selectAll('tspan')
      .data(lines)
      .join('tspan')
      .attr('x', width / 2)
      .attr('y', (_, i) => height / 2 + (i - (lines.length - 1) / 2) * fontSize)
      .text(d => d)
      .style('font-size', fontSize + 'px')
      .attr('fill', 'white');
  })
   
  }, [data])

  useEffect(() => {
    if (!data) return;
    
    d3.select(legendRef.current).selectAll('*').remove();
    
    const width = 1100;
    const legendHeight = 100;
    
    const legendSvg = d3.select(legendRef.current)
      .attr('width', width)
      .attr('height', legendHeight)
      .attr('id', 'legend');
      
    const categories = data.children.map(d => d.name);
    const itemWidth = 150;

    const colorScale = d3.scaleOrdinal()
    .domain(categories)
    .range(d3.schemeCategory10);
    
    const legendGroup = legendSvg
      .append('g')
      .attr('transform', 'translate(10, 20)');
    
    const items = legendGroup
      .selectAll('g')
      .data(categories)
      .join('g')
      .attr('transform', (d, i) => `translate(${i * itemWidth}, 0)`);
    
    items.append('rect')
      .attr('width', 15)
      .attr('class', 'legend-item')
      .attr('height', 15)
      .attr('fill', d => colorScale(d));

    items.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .text(d => d)
      .style('font-size', '12px');
      
  }, [data]);

  return (
    <> 
    <h1 id="title">Movie Sales</h1>
    <h2 id="description">Top 95 Highest Revenue Movies Grouped by Genre</h2>
    <svg ref={svgRef} className="treemap"></svg> 
    <svg className="legend" ref={legendRef}></svg>
    </>
  )
}

export default App
