const API_BASE_URL = "https://donnees-production.up.railway.app";

document.addEventListener("DOMContentLoaded", fetchOdds);

async function fetchOdds() {
    try {
        const response = await fetch(`${API_BASE_URL}/odds`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const odds = await response.json();
        displayOdds(odds);
        updateBookmakers(odds);
    } catch (error) {
        console.error("Erreur lors de la récupération des cotes :", error);
    }
}

async function filterOdds() {
    try {
        const start = document.getElementById("start").value;
        const startTime = document.getElementById("start-time").value;
        const end = document.getElementById("end").value;
        const endTime = document.getElementById("end-time").value;
        if (!start || !end) return;
        
        const response = await fetch(`${API_BASE_URL}/odds/filter?start=${start}T${startTime}&end=${end}T${endTime}`);
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
    let totalROI = 0;
    odds.forEach(odd => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${odd.sport}</td>
            <td>${odd.event}</td>
            <td>${odd.bookmaker1}</td>
            <td>${odd.best_odds1}</td>
            <td>${odd.bookmaker2}</td>
            <td>${odd.best_odds2}</td>
            <td class="profit">${odd.profit}%</td>
            <td>${new Date(odd.timestamp).toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
        totalROI += parseFloat(odd.profit || 0);
    });
    document.getElementById("total-bets").textContent = odds.length;
    document.getElementById("total-roi").textContent = (totalROI / odds.length).toFixed(2) + "%";
}

function updateBookmakers(odds) {
    let bookmakers = {};
    odds.forEach(odd => {
        [odd.bookmaker1, odd.bookmaker2].forEach(bookmaker => {
            if (bookmaker) {
                if (!bookmakers[bookmaker]) bookmakers[bookmaker] = { count: 0, bets: [], totalROI: 0 };
                bookmakers[bookmaker].count++;
                bookmakers[bookmaker].bets.push(odd);
                bookmakers[bookmaker].totalROI += parseFloat(odd.profit || 0);
            }
        });
    });

    let bookmakerList = document.getElementById("bookmaker-list");
    let bookmaker1Select = document.getElementById("bookmaker1");
    let bookmaker2Select = document.getElementById("bookmaker2");

    bookmakerList.innerHTML = "";
    bookmaker1Select.innerHTML = '<option value="">Sélectionner un bookmaker</option>';
    bookmaker2Select.innerHTML = '<option value="">Sélectionner un bookmaker</option>';

    Object.keys(bookmakers).forEach(bookmaker => {
        let li = document.createElement("li");
        li.innerHTML = `<strong>${bookmaker}</strong> - ${bookmakers[bookmaker].count} paris <br>
                        <strong>ROI moyen :</strong> ${(bookmakers[bookmaker].totalROI / bookmakers[bookmaker].count).toFixed(2)}%`;
        bookmakerList.appendChild(li);

        let option1 = document.createElement("option");
        option1.value = bookmaker;
        option1.textContent = bookmaker;
        bookmaker1Select.appendChild(option1);

        let option2 = document.createElement("option");
        option2.value = bookmaker;
        option2.textContent = bookmaker;
        bookmaker2Select.appendChild(option2);
    });
}

function filterByBookmakers() {
    let selectedBookmaker1 = document.getElementById("bookmaker1").value;
    let selectedBookmaker2 = document.getElementById("bookmaker2").value;
    if (!selectedBookmaker1 || !selectedBookmaker2) return;

    let filteredBets = allBets.filter(event =>
        (event.bookmaker1 === selectedBookmaker1 && event.bookmaker2 === selectedBookmaker2) ||
        (event.bookmaker1 === selectedBookmaker2 && event.bookmaker2 === selectedBookmaker1)
    );

    let filteredBetsTable = document.getElementById("filtered-bets");
    filteredBetsTable.innerHTML = "";

    let totalROI = 0;
    filteredBets.forEach(event => {
        let row = document.createElement("tr");
        row.innerHTML = `<td>${event.event}</td>
                         <td>${event.bookmaker1}</td>
                         <td>${event.best_odds1}</td>
                         <td>${event.bookmaker2}</td>
                         <td>${event.best_odds2}</td>
                         <td class="profit">${event.profit}%</td>`;
        filteredBetsTable.appendChild(row);
        totalROI += parseFloat(event.profit || 0);
    });

    document.getElementById("filtered-roi").textContent = (totalROI / filteredBets.length).toFixed(2) + "%";
}
