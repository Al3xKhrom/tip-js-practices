const log = (label) => console.log(label);

log("A: синхронный код");

setTimeout(() => {
  log("F: задача таймера");
}, 0);

Promise.resolve().then(() => {
  log("D: обработчик Promise");
});

async function demonstrateAwait() {
  log("B: начало async-функции");
  await null;
  log("E: продолжение после await");
}

demonstrateAwait();

// Собственный эксперимент: ещё одно продолжение Promise (метка G).
Promise.resolve().then(() => {
  log("G: дополнительная микрозадача");
});

log("C: конец синхронного кода");

// До запуска записать прогноз порядка A–F в отчёт, затем объяснить результат.
