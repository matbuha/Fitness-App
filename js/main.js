// בדיקת token ב-localStorage
const token = localStorage.getItem("access_token");

if (!token) {
  alert("You are not authenticated. Redirecting to login page.");
  window.location.href = "auth.html";
} else {
  // אם יש token, נציג את תוכן הדף הראשי
  document.getElementById("main-content").innerHTML = `
    <h2>Welcome to Fitness App!</h2>
    <p>This is the protected content of your app.</p>
    <button id="logout-btn">Logout</button>
    <div id="workouts-container"></div>
  `;

  // אירוע ליציאה מהחשבון
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("access_token");
    window.location.href = "auth.html";
  });

  // קריאה לטעינת נתונים מהדאטהבייס (Supabase)
  async function fetchWorkouts() {
    const { data, error } = await supabaseClient
      .from('workouts')
      .select('*');
    
    if (error) {
      console.error("Error fetching workouts:", error);
      return [];
    }
    return data;
  }

  async function displayWorkouts() {
    const workouts = await fetchWorkouts();
    const container = document.getElementById("workouts-container");
    if (workouts.length === 0) {
      container.innerHTML = "<p>No workouts found.</p>";
    } else {
      container.innerHTML = workouts.map(w => `
        <div class="workout">
          <h3>${w.title}</h3>
          <p>Channel: ${w.channel}</p>
          <p>Duration: ${w.duration}</p>
          <a href="https://youtu.be/${w.video_id}" target="_blank">Watch Video</a>
        </div>
      `).join("");
    }
  }

  // טען את הנתונים והצג אותם
  displayWorkouts();
}
