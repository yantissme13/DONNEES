const API_BASE_URL = "https://donnees-production.up.railway.app";

document.addEventListener("DOMContentLoaded", fetchOdds);

let allBets = [];
let allBetsFiltered = [];

async function fetchOdds() {
    try {
        const response = await fetch(`${API_BASE_URL}/odds`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const odds = await response.json();
		allBets = odds;
        displayOdds(odds);
        updateBookmakers(odds);
        updateStats(odds); // ✅ Mise à jour des stats après affichage
    } catch (error) {
        console.error("Erreur lors de la récupération des cotes :", error);
    }
}

async function filterOdds() {
    try {
        const start = document.getElementById("start").value;
        const startTime = document.getElementById("start-time").value || "00:00";
        const end = document.getElementById("end").value;
        const endTime = document.getElementById("end-time").value || "23:59";
        const minProfit = parseFloat(document.getElementById("min-profit").value) || 0; // ✅ Ajout du critère de profit
        if (!start || !end) return;

        const response = await fetch(`${API_BASE_URL}/odds/filter?start=${start}T${startTime}&end=${end}T${endTime}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        let odds = await response.json();

        // ✅ Appliquer le filtre sur le profit
        odds = odds.filter(odd => parseFloat(odd.profit) >= minProfit);

        allBetsFiltered = odds; // ✅ Stocke les paris filtrés
        displayOdds(odds);
        updateBookmakers(odds); // ✅ Applique le filtrage aux bookmakers
    } catch (error) {
        console.error("Erreur lors du filtrage des cotes :", error);
    }
}


function updateStats(odds) {
    if (!Array.isArray(odds)) {
        console.error("❌ ERREUR : 'odds' n'est pas un tableau", odds);
        return;
    }

    let totalBets = odds.length;
    let totalROI = odds.reduce((sum, odd) => sum + (parseFloat(odd.profit) || 0), 0);
    let avgROI = totalBets > 0 ? (totalROI / totalBets).toFixed(2) : "0.00";

    console.log("✅ Mise à jour des stats - Nombre de paris :", totalBets, "Total ROI:", avgROI);

    document.getElementById("total-bets").textContent = totalBets;
    document.getElementById("total-roi").textContent = avgROI + "%";
}


function displayOdds(odds) {
    const tableBody = document.getElementById("odds-table");
    tableBody.innerHTML = "";
    let totalROI = 0;
    let countBets = 0;
    
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
        countBets++;
    });
    
    updateStats(odds);
}

// ✅ Fonction pour gérer le changement d'onglet
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active-tab'));
    document.getElementById(tabId).classList.add('active-tab');
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
        li.classList.add("bookmaker-item"); // ✅ Améliore la lisibilité
        li.innerHTML = `<strong>${bookmaker}</strong> - ${bookmakers[bookmaker].count} paris <br>
                        <strong>ROI moyen :</strong> ${(bookmakers[bookmaker].totalROI / bookmakers[bookmaker].count).toFixed(2)}%`;

        let toggleIndicator = document.createElement("span");
        toggleIndicator.textContent = " [+]";
        li.appendChild(toggleIndicator);

        let betList = document.createElement("ul");
        betList.classList.add("bookmaker-bet-list");
        betList.style.display = "none"; // Cache la liste par défaut

        bookmakers[bookmaker].bets.forEach(bet => {
            let betItem = document.createElement("li");
            betItem.innerHTML = `${bet.event} - ${new Date(bet.timestamp).toLocaleString()}<br>
                                 <strong>${bet.bookmaker1} (${bet.best_odds1})</strong> vs 
                                 <strong>${bet.bookmaker2} (${bet.best_odds2})</strong> - Profit: <span class="profit">${bet.profit}%</span>`;
            betList.appendChild(betItem);
        });

        li.appendChild(betList);

        li.addEventListener("click", () => {
            if (betList.style.display === "none") {
                betList.style.display = "block";
                toggleIndicator.textContent = " [-]";
            } else {
                betList.style.display = "none";
                toggleIndicator.textContent = " [+]";
            }
        });

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

    let filteredBets = allBetsFiltered.filter(event =>
        (event.bookmaker1 === selectedBookmaker1 && event.bookmaker2 === selectedBookmaker2) ||
        (event.bookmaker1 === selectedBookmaker2 && event.bookmaker2 === selectedBookmaker1)
    );

    let filteredBetsTable = document.getElementById("filtered-bets");
    filteredBetsTable.innerHTML = "";

    let totalROI = 0;
    let totalOpportunities = filteredBets.length;

    if (filteredBets.length === 0) {
        filteredBetsTable.innerHTML = "<tr><td colspan='6'>Aucun pari trouvé</td></tr>";
        document.getElementById("filtered-roi").textContent = "0%";
        document.getElementById("filtered-opportunities").textContent = "0";
        return;
    }

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
    document.getElementById("filtered-opportunities").textContent = totalOpportunities;
}

