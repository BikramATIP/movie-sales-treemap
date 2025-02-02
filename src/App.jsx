import { useState, useRef, useEffect } from 'react'
import './App.css'
import * as d3 from 'd3'

const revenueFormat = d3.format('$,.2f');


function App() {
  const [data, setData] = useState(null);
  const [originalTotal, setOriginalTotal] = useState(0); 
  const svgRef = useRef();
  const legendRef = useRef();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json');
        if (res.ok) {
          const data = await res.json();
          setData(data);

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
    const SCALE = 1000; 


    const root = d3.hierarchy(data)
      .sum(d => d.value ? Math.round(d.value * SCALE) : 0) 
      .sort((a, b) => b.value - a.value);

    const treemap = d3.treemap()
      .size([width, height])
      .padding(0)
      .round(false)
      (root);

    treemap.leaves().forEach(d => {
      const area = (d.x1 - d.x0) * (d.y1 - d.y0);
      const expectedArea = (d.data.value / originalTotal) * totalArea; 
      console.log('Area ratio:', area / expectedArea);
    });

    const svg = d3.select(svgRef.current)
      .style('height', height)
      .style('width', width)
      .style('border', '1px solid black');

    const leaf = svg.selectAll('g')
      .data(treemap.leaves())
      .join('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

      const colorScale = d3.scaleOrdinal()
      .domain(data.children.map(d => d.name))
      .range(d3.schemeCategory10);

    const tooltip = d3.select('body').append('div')
      .attr('id', 'tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'white')
      .style('border', '1px solid black')
      .style('padding', '5px');

    leaf.append('rect')
      .attr('class', 'tile')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('data-name', d => d.data.name)
      .attr('data-category', d => d.data.category)
      .attr('data-value', d => d.data.value) 
      .attr('fill', d => colorScale(d.data.category))
      .on('mouseover', (event, d) => {
        tooltip.style('visibility', 'visible')
          .html(
            `Name: ${d.data.name}<br>Category: ${d.data.category}<br>Value: ${revenueFormat(d.data.value)}`
          )
          .attr('data-value', d.data.value)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', () => {
        tooltip.style('visibility', 'hidden');
      });

      leaf.append('text')
  .attr('text-anchor', 'middle')
  .attr('dominant-baseline', 'middle')
  .each(function(d) {
    const width = Math.abs(d.x1 - d.x0);
    const height = Math.abs(d.y1 - d.y0);
    const text = d.data.name;
    
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
