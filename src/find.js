fetch('https://api.github.com/repos/pmndrs/market-assets/git/trees/main?recursive=1').then(r=>r.json()).then(d => { 
  if (!d.tree) { console.log(d); return; }
  const guns = d.tree.filter(t => t.path.toLowerCase().includes('weapon') || t.path.toLowerCase().includes('pistol') || t.path.toLowerCase().includes('blaster') || t.path.toLowerCase().includes('gun') || t.path.toLowerCase().includes('sword')).map(t=>t.path); 
  console.log(guns);
});
