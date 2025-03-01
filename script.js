const API_BASE_URL = "https://donnees-production.up.railway.app";

document.addEventListener("DOMContentLoaded", fetchOdds);

async function fetchOdds() {
    try {
        const response = await fetch(`${API_BASE_URL}/odds`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const odds = await response.json();
        displayOdds(odds);
    } catch (error) {
        console.error("Erreur lors de la récupération des cotes :", error);
    }
}

async function filterOdds() {
    try {
        const start = document.getElementById("start").value;
        const end = document.getElementById("end").value;
        if (!start || !end) return;
        
        const response = await fetch(`${API_BASE_URL}/odds/filter?start=${start}&end=${end}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const odds = await response.json();
        displayOdds(odds);
    } catch (error) {
        console.error("Erreur lors du filtrage des cotes :", error);
    }
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
