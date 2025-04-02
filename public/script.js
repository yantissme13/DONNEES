
const API_BASE_URL = "https://donnees-production.up.railway.app";

document.addEventListener("DOMContentLoaded", fetchOdds);

let allBets = [];
let allBetsFiltered = [];

async function fetchOdds() {
    try {
        const response = await fetch(`${API_BASE_URL}/odds`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        let odds = await response.json();

        // ✅ Ajout d'une heure aux timestamps des paris
        odds = odds.map(odd => {
            let correctedTimestamp = new Date(odd.timestamp);
            correctedTimestamp.setHours(correctedTimestamp.getHours() + 1); // Ajoute 1h
            return { ...odd, timestamp: correctedTimestamp.toISOString() }; // Stocke la version corrigée
        });

        allBets = odds;
        displayOdds(odds);
        updateBookmakers(odds);
        updateStats(odds);
    } catch (error) {
        console.error("Erreur lors de la récupération des cotes :", error);
    }
}


function setPresetFilter(type) {
    let now = new Date();
    let startDate = new Date();

    if (type === 'year') {
        startDate.setFullYear(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0);
    } else if (type === 'month') {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0);
    } else if (type === 'week') {
        let dayOfWeek = now.getDay();
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0);
    } else if (type === '24h') {
        startDate.setHours(now.getHours() - 24);
    }

    // ✅ Correction : Ajuster l’heure UTC sans conversion forcée
    startDate = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000));
    now = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));

    // Appliquer les dates aux inputs en UTC
    document.getElementById("start").value = startDate.toISOString().split("T")[0];
    document.getElementById("start-time").value = startDate.toISOString().split("T")[1].slice(0, 5);
    document.getElementById("end").value = now.toISOString().split("T")[0];
    document.getElementById("end-time").value = now.toISOString().split("T")[1].slice(0, 5);

    filterOdds();
}


async function filterOdds() {
    try {
        let start = document.getElementById("start").value;
        let startTime = document.getElementById("start-time").value || "00:00";
        let end = document.getElementById("end").value;
        let endTime = document.getElementById("end-time").value || "23:59";

        // ✅ Corriger le décalage horaire en ajustant les dates aux fuseaux horaires
        let startDateTime = new Date(`${start}T${startTime}`);
        let endDateTime = new Date(`${end}T${endTime}`);

        // Appliquer le fuseau horaire de "Europe/Paris"
        startDateTime = new Date(startDateTime.getTime() - (startDateTime.getTimezoneOffset() * 60000));
	endDateTime = new Date(endDateTime.getTime() - (endDateTime.getTimezoneOffset() * 60000));

        // Convertir les nouvelles valeurs corrigées
        start = startDateTime.toISOString().split("T")[0];
        startTime = startDateTime.toTimeString().split(" ")[0].slice(0, 5);
        end = endDateTime.toISOString().split("T")[0];
        endTime = endDateTime.toTimeString().split(" ")[0].slice(0, 5);

        const minProfit = parseFloat(document.getElementById("min-profit").value) || 0; // ✅ Ajout du critère de profit
        if (!start || !end) return;

        // Filtrer les paris localement en lisant la colonne timestamp
	let odds = allBets.filter(odd => {
	    let betTime = new Date(odd.timestamp); // Convertit le timestamp du pari
	    return betTime >= startDateTime && betTime <= endDateTime;
	});


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
	let roiTotal = totalROI.toFixed(2);


    console.log("✅ Mise à jour des stats - Nombre de paris :", totalBets, "Total ROI:", avgROI);

    document.getElementById("total-bets").textContent = totalBets;
    document.getElementById("total-roi").textContent = avgROI + "%";
	document.getElementById("total-roi-total").textContent = roiTotal + "%";
}


function displayOdds(odds) {
    const tableBody = document.getElementById("odds-table");
    tableBody.innerHTML = "";
    let totalROI = 0;
    let countBets = 0;

    odds.forEach(odd => {
        const row = document.createElement("tr");

	const parisTimestamp = new Date(odd.timestamp);

	// ✅ Correction : S'assurer que l'heure locale est affichée sans décalage
	const formattedTimestamp = parisTimestamp.toLocaleString("fr-FR", {
	    timeZone: "UTC" // Affichage direct en UTC pour éviter tout décalage
	});


	console.log("📌 Timestamps API :", odds.map(o => o.timestamp));
	console.log("📌 Timestamps affichés :", odds.map(o => {
	    let betTime = new Date(o.timestamp);
	    return betTime.getFullYear() + "-" +
	           String(betTime.getMonth() + 1).padStart(2, "0") + "-" +
	           String(betTime.getDate()).padStart(2, "0") + " " +
	           String(betTime.getHours()).padStart(2, "0") + ":" +
	           String(betTime.getMinutes()).padStart(2, "0");
	}));

        row.innerHTML = `
            <td>${odd.sport}</td>
            <td>${odd.event}</td>
            <td>${odd.bookmaker1}</td>
            <td>${odd.best_odds1}</td>
            <td>${odd.bookmaker2}</td>
            <td>${odd.best_odds2}</td>
            <td class="profit">${odd.profit}%</td>
            <td>${formattedTimestamp}</td> <!-- Affichage avec fuseau horaire "Europe/Paris" -->
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

document.addEventListener("DOMContentLoaded", async () => {
    await fetchOdds(); // Appelle d'abord les données

    const loader = document.getElementById("loader");
    const mainContent = document.getElementById("main-content");

    const checkDataLoaded = () => {
        const rows = document.querySelectorAll("#odds-table tr");
        if (rows.length > 0) {
            loader.style.display = "none";
            mainContent.style.display = "block";
        } else {
            setTimeout(checkDataLoaded, 300);
        }
    };

    checkDataLoaded();
});

