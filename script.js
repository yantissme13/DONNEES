const API_BASE_URL = "https://donnees-production.up.railway.app"; // Remplace par ton URL Railway

document.addEventListener("DOMContentLoaded", fetchOdds);

async function fetchOdds() {
    const response = await fetch(`${API_BASE_URL}/odds`);
    const odds = await response.json();
    displayOdds(odds);
}

async function filterOdds() {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;
    if (!start || !end) return;
    
    const response = await fetch(`${API_BASE_URL}/odds/filter?start=${start}&end=${end}`);
    const odds = await response.json();
    displayOdds(odds);
}

function displayOdds(odds) {
    const tableBody = document.getElementById("odds-table");
    tableBody.innerHTML = "";
    odds.forEach(odd => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${odd.sport}</td>
            <td>${odd.event}</td>
            <td>${odd.bookmaker1}</td>
            <td>${odd.best_odds1}</td>
            <td>${odd.bookmaker2}</td>
            <td>${odd.best_odds2}</td>
            <td>${odd.profit}</td>
            <td>${new Date(odd.timestamp).toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
    });
}
