// Измерения для отчёта: запустить после npm start.
const baseUrl = process.env.API_URL ?? "http://127.0.0.1:5505/api";
const endpoint = `${baseUrl}/debug/delay?ms=150`;
async function oneRequest() {
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  await response.json();
}

const results = { sequential: [], parallel: [] };
for (let attempt = 1; attempt <= 3; attempt++) {
  const startSequential = performance.now();
  await oneRequest();
  await oneRequest();
  results.sequential.push(Number((performance.now() - startSequential).toFixed(1)));

  const startParallel = performance.now();
  await Promise.all([oneRequest(), oneRequest()]);
  results.parallel.push(Number((performance.now() - startParallel).toFixed(1)));
}
console.table([
  { method: "Последовательно", ...Object.fromEntries(results.sequential.map((v, i) => [`run${i + 1}`, v])) },
  { method: "Promise.all", ...Object.fromEntries(results.parallel.map((v, i) => [`run${i + 1}`, v])) },
]);
