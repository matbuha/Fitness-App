// בדיקת token ב-localStorage – אם אין, מפנים לעמוד האימות
const token = localStorage.getItem("access_token");
if (!token) {
  alert("You are not authenticated. Redirecting to login page.");
  window.location.href = "auth.html";
}

// יצירת לקוח Supabase (החלף את המפתח במפתח המתאים)
const supabaseUrl = "https://kmwvlpganjabpcqsnrkx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd3ZscGdhbmphYnBjcXNucmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4NzU1MjgsImV4cCI6MjA1NTQ1MTUyOH0.MZhYAWfFI7YTDde44SIhZfSovqCT8DYAZbgtRw7nOEs";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

async function checkSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  console.log("Current session:", data.session);
  if (data.session && data.session.user) {
    console.log("auth.uid:", data.session.user.id);
  } else {
    console.warn("No authenticated user found in session.");
  }
}
checkSession();

// --- פונקציות CRUD ---

// שליפת כל האימונים מהטבלה workouts
async function fetchWorkouts() {
  const { data, error } = await supabaseClient
    .from("workouts")
    .select("*");
    
  if (error) {
    console.error("Error fetching workouts:", error);
    return [];
  }
  return data;
}

// הוספת אימון חדש
async function addWorkout(workoutData) {
  const { data, error } = await supabaseClient
    .from("workouts")
    .insert([workoutData]);
    
  if (error) {
    console.error("Error adding workout:", error);
    return null;
  }
  return data[0];
}

// מחיקת אימון לפי video_id
async function deleteWorkout(videoId) {
  const { data, error } = await supabaseClient
    .from("workouts")
    .delete()
    .eq("video_id", videoId);
    
  if (error) {
    console.error("Error deleting workout:", error);
    return null;
  }
  return data;
}

// עדכון אימון לפי video_id
async function updateWorkout(videoId, updatedData) {
  const { data, error } = await supabaseClient
    .from("workouts")
    .update(updatedData)
    .eq("video_id", videoId);

  if (error) {
    console.error("Error updating workout:", error);
    return null;
  }
  return data[0];
}

// --- פונקציות להצגת המידע בממשק ---

// הצגת כל האימונים עם עיצוב כרטיסים (Bootstrap)
async function showAllWorkouts() {
  const workouts = await fetchWorkouts();
  const content = document.getElementById("content-area");
  
  if (workouts.length === 0) {
    content.innerHTML = `<p>No workouts found.</p>`;
  } else {
    content.innerHTML = workouts.map(w => `
      <div class="card mb-3">
        <div class="card-body">
          <h5 class="card-title">${w.title}</h5>
          <p class="card-text">ערוץ: ${w.channel}</p>
          <p class="card-text">משך: ${w.duration}</p>
          <a href="https://youtu.be/${w.video_id}" target="_blank" class="btn btn-primary">Watch Video</a>
          <button class="btn btn-danger" onclick="handleDeleteWorkout('${w.video_id}')">Delete</button>
        </div>
      </div>
    `).join("");
  }
}

// טיפול באירוע מחיקה – מציג אישור לפני המחיקה
function handleDeleteWorkout(videoId) {
  if (confirm("האם אתה בטוח שברצונך למחוק את האימון?")) {
    deleteWorkout(videoId).then(() => {
      showAllWorkouts();
    });
  }
}

// הצגת אימון יומי – במקרה זה, בוחרים אימון אקראי
async function showTodaysWorkout() {
  const workouts = await fetchWorkouts();
  const content = document.getElementById("content-area");
  
  if (workouts.length === 0) {
    content.innerHTML = `<p>No workouts available for today.</p>`;
  } else {
    const randomWorkout = workouts[Math.floor(Math.random() * workouts.length)];
    content.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">${randomWorkout.title}</h5>
          <p class="card-text">ערוץ: ${randomWorkout.channel}</p>
          <p class="card-text">משך: ${randomWorkout.duration}</p>
          <a href="https://youtu.be/${randomWorkout.video_id}" target="_blank" class="btn btn-primary">Watch Video</a>
        </div>
      </div>
    `;
  }
}

// הצגת טופס להוספת אימון חדש
function showAddWorkoutForm() {
  const content = document.getElementById("content-area");
  content.innerHTML = `
    <form id="add-workout-form">
      <div class="mb-3">
        <label for="video_id" class="form-label">Video ID</label>
        <input type="text" class="form-control" id="video_id" required>
      </div>
      <div class="mb-3">
        <label for="title" class="form-label">Title</label>
        <input type="text" class="form-control" id="title" required>
      </div>
      <div class="mb-3">
        <label for="channel" class="form-label">Channel</label>
        <input type="text" class="form-control" id="channel" required>
      </div>
      <div class="mb-3">
        <label for="duration" class="form-label">Duration</label>
        <input type="text" class="form-control" id="duration" required>
      </div>
      <button type="submit" class="btn btn-success">Add Workout</button>
    </form>
  `;
  document.getElementById("add-workout-form").addEventListener("submit", function(e) {
    e.preventDefault();
    const workoutData = {
      video_id: document.getElementById("video_id").value,
      title: document.getElementById("title").value,
      channel: document.getElementById("channel").value,
      duration: document.getElementById("duration").value
    };
    addWorkout(workoutData).then(() => {
      alert("Workout added!");
      showAllWorkouts();
    });
  });
}

function showUpdateWorkoutForm(videoId, workoutData) {
  const content = document.getElementById("content-area");
  
  // יצירת טופס עם ערכים קיימים
  content.innerHTML = `
    <h3>Update Workout</h3>
    <form id="update-workout-form">
      <div class="mb-3">
        <label for="update_video_id" class="form-label">Video ID</label>
        <input type="text" class="form-control" id="update_video_id" value="${workoutData.video_id}" disabled>
      </div>
      <div class="mb-3">
        <label for="update_title" class="form-label">Title</label>
        <input type="text" class="form-control" id="update_title" value="${workoutData.title}" required>
      </div>
      <div class="mb-3">
        <label for="update_channel" class="form-label">Channel</label>
        <input type="text" class="form-control" id="update_channel" value="${workoutData.channel}" required>
      </div>
      <div class="mb-3">
        <label for="update_duration" class="form-label">Duration</label>
        <input type="text" class="form-control" id="update_duration" value="${workoutData.duration}" required>
      </div>
      <button type="submit" class="btn btn-primary">Update Workout</button>
      <button type="button" class="btn btn-secondary" onclick="showAllWorkouts()">Cancel</button>
    </form>
  `;
  
  document.getElementById("update-workout-form").addEventListener("submit", function(e) {
    e.preventDefault();
    const updatedData = {
      title: document.getElementById("update_title").value,
      channel: document.getElementById("update_channel").value,
      duration: document.getElementById("update_duration").value
    };
    updateWorkout(videoId, updatedData).then(() => {
      alert("Workout updated successfully!");
      showAllWorkouts();
    });
  });
}

// --- אתחול סרגל הצד והאזנה לאירועים ---
function initSidebar() {
  document.getElementById("btn-todays").addEventListener("click", showTodaysWorkout);
  document.getElementById("btn-all").addEventListener("click", showAllWorkouts);
  document.getElementById("btn-add").addEventListener("click", showAddWorkoutForm);
  document.getElementById("btn-logout").addEventListener("click", function() {
    localStorage.removeItem("access_token");
    window.location.href = "auth.html";
  });
}

// --- בניית מבנה הדף הראשי עם Sidebar בעזרת Bootstrap ---
document.getElementById("main-content").innerHTML = `
  <div class="container-fluid">
    <div class="row">
      <nav class="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
        <div class="position-sticky pt-3">
          <ul class="nav flex-column">
            <li class="nav-item">
              <button class="nav-link btn btn-link" id="btn-todays">Today's Workout</button>
            </li>
            <li class="nav-item">
              <button class="nav-link btn btn-link" id="btn-all">All Workouts</button>
            </li>
            <li class="nav-item">
              <button class="nav-link btn btn-link" id="btn-add">Add Workout</button>
            </li>
            <li class="nav-item">
              <button class="nav-link btn btn-link text-danger" id="btn-logout">Logout</button>
            </li>
          </ul>
        </div>
      </nav>
      <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4" id="content-area">
        <h2>ברוכים הבאים ל-Fitness App!</h2>
        <p>בחר אופציה מהסרגל הצד.</p>
      </main>
    </div>
  </div>
`;

initSidebar();
