import { useState, useRef, useEffect } from 'react'
import './App.css'
import * as d3 from 'd3'


function App() {
  const [data, setData] = useState(null)
  const svgRef = useRef();
  const legendRef = useRef();
  
useEffect(() => {
async function fetchData() {
  try {
   const res = await fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json')
   if (res.ok) {
    const data = await res.json()
    setData(data)
    console.log(data)
   }
  } catch (error) {
    console.error("There was an error: ", error)
  }
}
fetchData();
}, [])

useEffect(() => {
  if (!data) return;
  const width = 1100;
  const height = 600;

  const svg = d3.select(svgRef.current)
   .style('height', height)
   .style('width', width)
   .style('border', '1px solid black')
   
   const root = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value)
   
   const treemap = d3.treemap()
    .size([width, height])
    .padding(1)
    (root)

    console.log("treemap leaves: ", treemap.leaves())
    console.log("root leaves: ", root.leaves())

    const colorScale = d3.scaleOrdinal()
    .domain(root.children.map(d => d.data.name))
    .range(d3.schemeCategory10l)

    const leaf = svg.selectAll('g')
     .data(treemap.leaves())
     .join('g')
     .attr('transform', d => `translate(${d.x0},${d.y0})`);

     leaf.append('rect')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => colorScale(d.data.category));

      leaf.append('text')
  .attr('text-anchor', 'middle')
  .attr('dominant-baseline', 'middle')
  .each(function(d) {
    const width = Math.abs(d.x1 - d.x0);
    const height = Math.abs(d.y1 - d.y0);
    const text = d.data.name;
    
    // Split into words and create lines
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
  });

  }, [data])

  useEffect(() => {
    if (!data) return;
    const width = 1100;
    const legendHeight = 100;

    const legendSvg = d3.select('.legend')
     .attr('width', width)
     .attr('height', legendHeight)
     .attr('id', 'legend')

     const categories = data.children.map(d => d.name);
     const itemWidth = width / categories.length;
     const color = d3.scaleOrdinal()
      .domain(categories)
      .range(d3.schemeCategory10)

     const legendItem = legendSvg.selectAll('.legend-item')
      .data(categories)
      .join('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(${i * itemWidth + 10}, 20)`);

    legendItem.append('rect')
     .attr('class', 'legend-item')
     .attr('width', 15)
     .attr('height', 15)
     .attr('fill', d => color(d));

     legendItem.append('text')
      .attr('x', 20)
      .attr('y', 10)
      .text(d => d)
      .style('font-size', '12px')

   }, [data])


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
