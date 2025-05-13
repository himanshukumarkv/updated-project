document.getElementById("themeColor").addEventListener("input", (e) => {
  const color = e.target.value;
  document.documentElement.style.setProperty('--theme-color', color);
  localStorage.setItem("themeColor", color); // ✅ Save color
  document.getElementById("colorPreview").style.backgroundColor = color;
});


document.getElementById("financeForm").addEventListener("submit", function (e) {
  e.preventDefault();
  calculateFinancialHealth();
});

function calculateFinancialHealth() {
  const income = +document.getElementById("income").value;
  const education = +document.getElementById("education").value;
  const houseRent = +document.getElementById("houseRent").value;
  const transportCost = +document.getElementById("transportCost").value;
  const foodCost = +document.getElementById("foodCost").value;
  const extraCashflow = +document.getElementById("extraCashflow").value || 0;

  const debt = extraCashflow < 0 ? -extraCashflow : 0;
  const gain = extraCashflow > 0 ? extraCashflow : 0;
  const totalExpenses = education + houseRent + transportCost + foodCost + debt;
  const netCashflow = income - totalExpenses + gain;
  const savingsRate = ((netCashflow / income) * 100).toFixed(2);

  document.getElementById("savingsBar").value = savingsRate;
  document.getElementById("savingsLabel").textContent = `${savingsRate}%`;

  let category = "Poor";
  if (netCashflow > 0.3 * income) category = "Excellent";
  else if (netCashflow > 0.1 * income) category = "Good";
  else if (netCashflow > 0) category = "Average";

  const entryDate = document.getElementById("entryDate").value || new Date().toLocaleDateString();
  const resultEl = document.getElementById("result");
  resultEl.textContent = `📅 Entry Date: ${entryDate} | 💸 Net Cashflow: ₹${netCashflow.toFixed(2)} | Status: ${category}`;
  resultEl.classList.add("visible");

  showSuggestions(netCashflow);
  showAdvice(income, education, houseRent, transportCost, foodCost, netCashflow);
  drawCharts(income, education, houseRent, transportCost, foodCost, debt, netCashflow);
}
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const entryDate = document.getElementById("entryDate").value || new Date().toLocaleDateString();
  const result = document.getElementById("result").textContent;
  const suggestions = document.getElementById("investmentSuggestions").innerText;
  const advice = document.getElementById("financialAdvice").innerText;

  const cleanResult = result.replace(/[^\x00-\x7F]/g, "");
  const cleanSuggestions = suggestions.replace(/[^\x00-\x7F]/g, "");
  const cleanAdvice = advice.replace(/[^\x00-\x7F]/g, "");

  doc.setFont("courier", "normal");
  doc.setFontSize(12);
  doc.text("CashFlow Compass Report", 20, 20);
  doc.text("Entry Date: " + entryDate, 20, 30);
  doc.text(cleanResult, 20, 40);
  doc.text("Investment Suggestions:", 20, 55);
  doc.setFontSize(10);
  doc.text(cleanSuggestions, 20, 63);

  const yStart = 63 + cleanSuggestions.split('\n').length * 5 + 5;
  doc.setFontSize(12);
  doc.text("Financial Advice:", 20, yStart);
  doc.setFontSize(10);
  doc.text(cleanAdvice, 20, yStart + 8);

  html2canvas(document.querySelector(".charts")).then(canvas => {
    const imgData = canvas.toDataURL("image/png");
    doc.addPage();
    doc.addImage(imgData, "PNG", 15, 15, 180, 130);
    doc.save("CashFlow_Report.pdf");
  });
}

function copyResult() {
  const resultText = document.getElementById("result").textContent;
  navigator.clipboard.writeText(resultText)
    .then(() => alert("✅ Result copied to clipboard!"))
    .catch(() => alert("❌ Copy failed."));
}

function shareByEmail() {
  const subject = encodeURIComponent("My CashFlow Report");
  const body = encodeURIComponent(document.getElementById("result").textContent);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function resetForm() {
  if (confirm("Reset all inputs and start fresh?")) {
    document.getElementById("financeForm").reset();
    document.getElementById("result").textContent = "";
    document.getElementById("savingsBar").value = 0;
    document.getElementById("investmentSuggestions").innerHTML = "";
    document.getElementById("financialAdvice").innerHTML = "";
    if (window.expChart) window.expChart.destroy();
    if (window.nChart) window.nChart.destroy();
    localStorage.removeItem("financeData");
    document.querySelector(".input-section").scrollIntoView({ behavior: "smooth" });
  }
}

function exportData() {
  const data = localStorage.getItem("financeData");
  if (!data) return alert("No data to export.");

  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "cashflow_data.json";
  a.click();
}
function importData(event) {
  const file = event.target.files[0];
  if (!file) return alert("No file selected");

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      for (let key in data) {
        if (document.getElementById(key)) {
          document.getElementById(key).value = data[key];
        }
      }
      localStorage.setItem("financeData", JSON.stringify(data));
      calculateFinancialHealth(); // update chart and suggestions
    } catch (err) {
      alert("❌ Invalid JSON format");
    }
  };
  reader.readAsText(file);
}


function showSuggestions(netCashflow) {
  const el = document.getElementById("investmentSuggestions");
  let html = "<h3>📌 Investment Suggestions</h3><ul>";

  if (netCashflow <= 0) {
    html += "<li>❗ Cut unnecessary costs and focus on building an emergency fund first.</li>";
    html += "<li>💳 Avoid using credit cards for non-essential expenses.</li>";
  } 
  else if (netCashflow < 3000) {
    html += "<li>🏦 Start a <b>Recurring Deposit (RD)</b> with your bank.</li>";
    html += "<li>📲 Try small SIPs (₹100–500/month) on <a href='https://groww.in' target='_blank'>Groww</a> or <a href='https://paytmmoney.com' target='_blank'>Paytm Money</a>.</li>";
    html += "<li>💡 Use UPI apps like <a href='https://www.phonepe.com' target='_blank'>PhonePe</a> to auto-save change on each transaction.</li>";
  } 
  else if (netCashflow < 10000) {
    html += "<li>📈 Begin monthly SIPs (₹1000–₹5000) in <b>large-cap mutual funds</b>.</li>";
    html += "<li>🩺 Buy affordable <b>health insurance</b> via <a href='https://policybazaar.com' target='_blank'>PolicyBazaar</a>.</li>";
    html += "<li>💰 Start a <b>Public Provident Fund (PPF)</b> account via India Post or SBI.</li>";
  } 
  else {
    html += "<li>💹 Invest in <a href='https://zerodha.com' target='_blank'>Zerodha</a> or <a href='https://smallcase.com' target='_blank'>Smallcase</a> for direct equities or curated portfolios.</li>";
    html += "<li>🧾 Use <b>ELSS mutual funds</b> for tax saving under 80C (e.g., Axis Long Term Equity).</li>";
    html += "<li>🪙 Consider <b>NPS Tier-I</b> for retirement savings: <a href='https://npscra.nsdl.co.in' target='_blank'>NSDL NPS</a>.</li>";
  }

  html += "</ul>";
  el.innerHTML = html;
}



function showAdvice(income, edu, rent, trans, food, cash) {
  const el = document.getElementById("financialAdvice");
  let html = "<h3>💬 Tips to Improve</h3><ul>";

  if (edu / income > 0.2) html += "<li>🎓 Reduce education costs using <a href='https://swayam.gov.in' target='_blank'>SWAYAM</a> or free online courses.</li>";
  if (rent / income > 0.3) html += "<li>🏠 Flat-share or move to a suburban area to reduce rent burden.</li>";
  if (trans / income > 0.15) html += "<li>🚌 Use public transport or bike to cut monthly travel expenses.</li>";
  if (food / income > 0.2) html += "<li>🍱 Reduce online food orders; switch to meal prep or tiffin services.</li>";

  if (cash < 0) {
    html += "<li>🔴 You're overspending. Use a budgeting app like <a href='https://walnutapp.com' target='_blank'>Walnut</a> or Google Sheets.</li>";
    html += "<li>🚫 Stop using BNPL (Buy Now Pay Later) unless it's a need, not a want.</li>";
  } 
  else {
    html += "<li>✅ Great job! Invest at least 20% of your net cashflow monthly.</li>";
    html += "<li>📊 Track your investments regularly using <a href='https://kuvera.in' target='_blank'>Kuvera</a> or <a href='https://groww.in' target='_blank'>Groww</a>.</li>";
  }

  // ✅ Extra tip to save more money
  html += "<li>🧠 <b>Tip to Save More:</b> Automate savings on salary day by setting up auto-debit to your savings/investment account. This enforces discipline.</li>";

  html += "</ul>";
  el.innerHTML = html;
}


function drawCharts(income, education, houseRent, transportCost, foodCost, debt, netCashflow) {
  const expCtx = document.getElementById("expenseChart").getContext("2d");
  const netCtx = document.getElementById("netChart").getContext("2d");

  if (window.expChart) window.expChart.destroy();
  if (window.nChart) window.nChart.destroy();

  window.expChart = new Chart(expCtx, {
    type: "pie",
    data: {
      labels: ["Education", "Rent", "Transport", "Food", "Debt"],
      datasets: [{
        data: [education, houseRent, transportCost, foodCost, debt],
        backgroundColor: ["#007bff", "#ffc107", "#28a745", "#dc3545", "#6c757d"]
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: "📊 Expense Breakdown" }
      }
    }
  });

  window.nChart = new Chart(netCtx, {
    type: "bar",
    data: {
      labels: ["Income", "Net Cashflow"],
      datasets: [{
        label: "₹ Amount",
        data: [income, netCashflow],
        backgroundColor: ["#17a2b8", "#6610f2"]
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: "📈 Income vs Savings" }
      }
    }
  });
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  document.getElementById("themeToggle").textContent = isDark ? "☀️" : "🌙";
}
function showPinModal(title = "🔐 Enter 4-Digit PIN") {
  document.getElementById("pinModal").style.display = "flex";
  document.getElementById("pinTitle").textContent = title;
}

function hidePinModal() {
  document.getElementById("pinModal").style.display = "none";
}

function handlePinSubmit() {
  const pin = document.getElementById("pinInput").value;
  const savedPin = localStorage.getItem("userPIN");

  if (savedPin) {
    if (pin === savedPin) {
      hidePinModal();
    } else {
      alert("❌ Incorrect PIN. Try again.");
    }
  } else {
    if (/^\d{4}$/.test(pin)) {
      localStorage.setItem("userPIN", pin);
      alert("✅ PIN set successfully!");
      hidePinModal();
    } else {
      alert("Please enter a valid 4-digit PIN.");
    }
  }
}

window.onload = () => {
  const savedPin = localStorage.getItem("userPIN");
  const modal = document.getElementById("pinModal");
  if (modal && savedPin) {
    showPinModal("🔐 Enter 4-Digit PIN");
    return; // stop loading app until correct PIN entered
  }
  if (modal && !savedPin) {
    showPinModal("🔐 Set a 4-Digit PIN");
    return;
  }
  const saved = JSON.parse(localStorage.getItem("financeData"));
  const theme = localStorage.getItem("theme");
  const savedThemeColor = localStorage.getItem("themeColor");

  // ✅ Restore previous inputs
  if (saved) {
    for (let key in saved) {
      if (document.getElementById(key)) {
        document.getElementById(key).value = saved[key];
      }
    }
    calculateFinancialHealth(); // Recalculate with old data
  }

  // ✅ Restore dark/light mode
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
    document.getElementById("themeToggle").textContent = "☀️";
  } else {
    document.getElementById("themeToggle").textContent = "🌙";
  }

  // ✅ Restore theme color
  if (savedThemeColor) {
    document.documentElement.style.setProperty('--theme-color', savedThemeColor);
    document.getElementById("themeColor").value = savedThemeColor;
    document.getElementById("colorPreview").style.backgroundColor = savedThemeColor;
  }
  const savedMentor = localStorage.getItem("selectedMentor");
if (savedMentor) {
  document.getElementById("mentorMode").value = savedMentor;
  generateMentorAdvice(); // 🪄 auto-generate mentor advice
}

};
function generateMentorAdvice() {
  const mode = document.getElementById("mentorMode").value;
  const adviceBox = document.getElementById("mentorAdvice");

  const income = +document.getElementById("income").value || 0;
  const education = +document.getElementById("education").value || 0;
  const houseRent = +document.getElementById("houseRent").value || 0;
  const transportCost = +document.getElementById("transportCost").value || 0;
  const foodCost = +document.getElementById("foodCost").value || 0;
  const extra = +document.getElementById("extraCashflow").value || 0;

  const debt = extra < 0 ? -extra : 0;
  const gain = extra > 0 ? extra : 0;
  const totalExpenses = education + houseRent + transportCost + foodCost + debt;
  const netCashflow = income - totalExpenses + gain;

  let message = "";

  switch (mode) {
    case "ca":
      message = `
        🧾 <b>CA Advisor:</b><br>
        "Let’s keep it formal. With a net cashflow of ₹${netCashflow.toFixed(2)}, you should be investing in ELSS for tax savings,
        maintaining at least 6 months of emergency funds, and tracking your Section 80C limits. No financial shortcuts, please."
      `;
      break;

    case "frugal":
      message = `
        💡 <b>Frugal Guru:</b><br>
        "Ah, frugality — the forgotten art. You've saved ₹${netCashflow.toFixed(2)}. Cut the fluff: no OTT binging, no food delivery. 
        Grow a money plant (literally and financially), cook dal at home, and track every rupee like it's a sacred mantra."
      `;
      break;

    case "hacker":
      message = `
        🚀 <b>Wealth Hacker:</b><br>
        "With ₹${netCashflow.toFixed(2)} net cashflow, you’re on track. Set up auto-SIPs, use UPI cashback loops, 
        dump expenses into Airtable, and go full FIRE (Financial Independence, Retire Early). 
        Your money should work harder than you do."
      `;
      break;

    default:
      message = "";
  }

  adviceBox.innerHTML = message;
  localStorage.setItem("selectedMentor", mode); // 💾 Save mentor selection
}
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // Prevent default mini-infobar
  deferredPrompt = e;

  const installBtn = document.createElement("button");
  installBtn.textContent = "📲 Install CashFlow App";
  installBtn.className = "btn-install";
  document.body.appendChild(installBtn);

  installBtn.addEventListener("click", () => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("✅ User accepted install");
      } else {
        console.log("❌ User dismissed install");
      }
      installBtn.remove();
    });
  });
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log("✅ Service Worker Registered"))
    .catch(err => console.error("❌ Service Worker Error", err));
}
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById("splashScreen").style.display = "none";
    document.getElementById("appContent").style.display = "block";
  }, 2000); // ⏱️ 2 seconds splash screen
});
const installBtn = document.getElementById("manualInstallBtn");
if (installBtn) {
  installBtn.addEventListener("click", () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("✅ User accepted install");
        } else {
          console.log("❌ User dismissed install");
        }
      });
    } else {
      alert("❗ Install not available yet. Try refreshing the page or check browser support.");
    }
  });
}
