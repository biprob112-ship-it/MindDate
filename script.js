const moods = {
      great: { emoji: "😄", label: "Great" },
      good:  { emoji: "🙂", label: "Good" },
      okay:  { emoji: "😐", label: "Okay" },
      low:   { emoji: "😔", label: "Low" },
      rough: { emoji: "😣", label: "Rough" }
    };
    const prompts = [
      "✦ Gentle prompt: What is one small thing that helped you today?",
      "✦ Gentle prompt: What would make tomorrow a little easier?",
      "✦ Gentle prompt: What is something you did today that you can give yourself credit for?",
      "✦ Gentle prompt: Is there anything you need to let go of for tonight?",
      "✦ Gentle prompt: What is one thing you are looking forward to?"
    ];
    const storageKey = "mindDatesEntriesV1";
    let entries = loadEntries();
    let visibleMonth = new Date();
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    let selectedDate = dateKey(new Date());
    let selectedMood = null;

    const grid = document.getElementById("calendarGrid");
    const note = document.getElementById("note");

    function loadEntries() {
      try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); }
      catch { return {}; }
    }
    function dateKey(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    function parseKey(key) {
      const [y, m, d] = key.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    function prettyDate(key) {
      return parseKey(key).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }
    function saveToStorage() {
      localStorage.setItem(storageKey, JSON.stringify(entries));
    }
    function renderCalendar() {
      const year = visibleMonth.getFullYear();
      const month = visibleMonth.getMonth();
      document.getElementById("monthLabel").textContent =
        visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      grid.innerHTML = "";
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement("div");
        blank.className = "day empty";
        grid.appendChild(blank);
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const key = dateKey(date);
        const entry = entries[key];
        const button = document.createElement("button");
        button.className = "day";
        const todayKey = dateKey(new Date());
        const isFuture = key > todayKey;
        if (key < todayKey) button.classList.add("past");
        if (isFuture) button.classList.add("future");
        if (key === selectedDate) button.classList.add("selected");
        if (key === todayKey) button.classList.add("today");
        button.disabled = isFuture;
        button.setAttribute("aria-label", `${prettyDate(key)}${isFuture ? ", future date, unavailable" : entry ? ", mood " + moods[entry.mood].label : ""}`);
        button.innerHTML = `<span class="number">${day}</span><span class="emoji">${entry ? moods[entry.mood].emoji : ""}</span>`;
        if (!isFuture) {
          button.addEventListener("click", () => {
            selectedDate = key;
            loadSelectedEntry();
            renderCalendar();
          });
        }
        grid.appendChild(button);
      }
    }
    function loadSelectedEntry() {
      document.getElementById("chosenDate").textContent = prettyDate(selectedDate);
      const entry = entries[selectedDate];
      selectedMood = entry ? entry.mood : null;
      document.querySelectorAll(".mood").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.mood === selectedMood);
      });
      note.value = entry ? entry.note : "";
      document.getElementById("prompt").textContent = "";      const isFuture = selectedDate > dateKey(new Date());
      document.getElementById("saveEntry").textContent = entry ? "Update check-in" : "Save check-in";
      document.getElementById("saveEntry").disabled = isFuture;
      document.getElementById("clearEntry").disabled = isFuture;
      note.disabled = isFuture;
      document.querySelectorAll(".mood").forEach(btn => btn.disabled = isFuture);
      if (isFuture) document.getElementById("prompt").textContent = "Future dates are locked. You can check in when the day arrives.";
    }
    function renderStats() {
      const prefix = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}-`;
      const monthEntries = Object.entries(entries)
        .filter(([key]) => key.startsWith(prefix))
        .sort(([a], [b]) => b.localeCompare(a));
      document.getElementById("loggedCount").textContent = monthEntries.length;
      const counts = {};
      monthEntries.forEach(([, entry]) => counts[entry.mood] = (counts[entry.mood] || 0) + 1);
      const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      document.getElementById("topMood").textContent = top ? `${moods[top].emoji} ${moods[top].label}` : "—";
      const insight = document.getElementById("insight");
      if (!monthEntries.length) {
        insight.textContent = "Your mood history will appear here as you check in. Every entry helps you learn about yourself.";
      } else if (monthEntries.length < 3) {
        insight.textContent = "You're building a habit of checking in. Keep it gentle—there's no need to write every day.";
      } else {
        const positive = (counts.great || 0) + (counts.good || 0);
        const difficult = (counts.low || 0) + (counts.rough || 0);
        if (positive > difficult) insight.textContent = "You've logged more good-feeling days than difficult ones this month. Notice what seems to support you.";
        else if (difficult > positive) insight.textContent = "You've logged some difficult-feeling days. Consider reaching out to someone you trust or making space for a small act of care.";
        else insight.textContent = "Your month has included a mix of feelings. All of them are valid, and patterns take time to notice.";
      }
      const history = document.getElementById("recentHistory");
      history.innerHTML = "";
      if (!monthEntries.length) {
        history.innerHTML = '<div class="empty-state">Your saved check-ins will show up here. Start with today, or choose any date on the calendar.</div>';
        return;
      }
      monthEntries.slice(0, 3).forEach(([key, entry]) => {
        const row = document.createElement("div");
        row.className = "history-row";
        const emoji = document.createElement("div");
        emoji.className = "history-emoji";
        emoji.textContent = moods[entry.mood].emoji;
        const copy = document.createElement("div");
        copy.className = "history-copy";
        const strong = document.createElement("strong");
        strong.textContent = parseKey(key).toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " · " + moods[entry.mood].label;
        const span = document.createElement("span");
        span.textContent = entry.note || "No note added";
        copy.append(strong, span);
        row.append(emoji, copy);
        row.addEventListener("click", () => {
          selectedDate = key;
          loadSelectedEntry();
          renderCalendar();
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
        row.style.cursor = "pointer";
        history.appendChild(row);
      });
    }
    document.querySelectorAll(".mood").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedMood = btn.dataset.mood;
        document.querySelectorAll(".mood").forEach(item => item.classList.toggle("active", item === btn));
      });
    });
    document.getElementById("saveEntry").addEventListener("click", () => {
      if (selectedDate > dateKey(new Date())) return;
      if (!selectedMood) {
        alert("Choose a mood first, then save your check-in.");
        return;
      }
      entries[selectedDate] = { mood: selectedMood, note: note.value.trim() };
      saveToStorage();
      renderCalendar();
      renderStats();
      loadSelectedEntry();
    });
    document.getElementById("clearEntry").addEventListener("click", () => {
      if (selectedDate > dateKey(new Date())) return;
      selectedMood = null;
      document.querySelectorAll(".mood").forEach(btn => btn.classList.remove("active"));
      note.value = "";
      if (entries[selectedDate]) {
        delete entries[selectedDate];
        saveToStorage();
      }
      renderCalendar();
      renderStats();
      loadSelectedEntry();
    });
    document.getElementById("prevMonth").addEventListener("click", () => {
      visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
      renderCalendar();
      renderStats();
    });
    document.getElementById("nextMonth").addEventListener("click", () => {
      visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
      renderCalendar();
      renderStats();
    });

    loadSelectedEntry();
    renderCalendar();
    renderStats();
