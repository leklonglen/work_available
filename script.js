const { addDays, subDays, format, isWeekend } = dateFns;

const NUM_DAYS = 60;
let startDate = new Date();
let workerData = {};

function generateDates(start) {
  return Array.from({ length: NUM_DAYS }, (_, i) => addDays(start, i));
}

function getKey(date) {
  return format(date, "yyyy-MM-dd");
}

function initWorkerData(dates) {
  dates.forEach(date => {
    const key = getKey(date);
    if (!workerData[key]) {
      workerData[key] = { a: 0, b: 0 };
    }
  });
}

function render() {
  const chart = document.getElementById("chart");
  chart.innerHTML = "";

  const dates = generateDates(startDate);
  initWorkerData(dates);

  dates.forEach(date => {
    const key = getKey(date);
    const data = workerData[key];
    const total = (data.a || 0) + (data.b || 0);
    const isWknd = isWeekend(date);

    let bgClass = "bg-green";
    if (isWknd) bgClass = "bg-yellow";
    else if (total === 0) bgClass = "bg-gray";

    const dateCell = document.createElement("div");
    dateCell.className = `cell ${bgClass}`;
    dateCell.textContent = format(date, "dd MMM yyyy");

    const inputCell = document.createElement("div");
    inputCell.className = `cell ${bgClass}`;
    inputCell.innerHTML = `
      ช่าง A: <input type="number" min="0" value="${data.a}" data-date="${key}" data-type="a">
      ช่าง B: <input type="number" min="0" value="${data.b}" data-date="${key}" data-type="b">
    `;

    chart.appendChild(dateCell);
    chart.appendChild(inputCell);
  });

  document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", (e) => {
      const { date, type } = e.target.dataset;
      workerData[date][type] = parseInt(e.target.value) || 0;
      render(); // re-render for background color update
    });
  });
}

document.getElementById("next").addEventListener("click", () => {
  startDate = addDays(startDate, NUM_DAYS);
  render();
});

document.getElementById("prev").addEventListener("click", () => {
  startDate = subDays(startDate, NUM_DAYS);
  render();
});

render();
