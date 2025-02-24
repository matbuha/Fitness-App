// בדיקת token ב-localStorage – אם אין, מפנים לעמוד האימות
const token = localStorage.getItem("access_token");
if (!token) {
  alert("You are not authenticated. Redirecting to login page.");
  window.location.href = "auth.html";
}

// יצירת לקוח Supabase
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

// הוספת אימון חדש (משתמשים ב-upsert כדי למנוע כפילויות, על פי video_id)
async function addWorkout(workoutData) {
  const { data, error } = await supabaseClient
    .from("workouts")
    .upsert([workoutData], { onConflict: 'video_id', returning: 'representation' });
  if (error) {
    console.error("Error adding workout:", error);
    return null;
  }
  return data ? data[0] : null;
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

// הצגת כל האימונים (עם כרטיסי Bootstrap) – התוכן מיושר לימין (text-end)
async function showAllWorkouts() {
  const workouts = await fetchWorkouts();
  const content = document.getElementById("content-area");
  if (workouts.length === 0) {
    content.innerHTML = `<p>No workouts found.</p>`;
  } else {
    content.innerHTML = workouts.map(w => `
      <div class="card mb-3">
        <div class="card-body text-end">
          <h5 class="card-title">${w.title}</h5>
          <p class="card-text">ערוץ: ${w.channel}</p>
          <p class="card-text">משך: ${w.duration}</p>
          <p class="card-text">צפיות: ${w.view_count || ''}</p>
          <p class="card-text">לייקים: ${w.like_count || ''}</p>
          <img src="https://img.youtube.com/vi/${w.video_id}/hqdefault.jpg" alt="Thumbnail" class="img-fluid mb-2">
          <a href="https://youtu.be/${w.video_id}" target="_blank" class="btn btn-primary">Watch Video</a>
          <button class="btn btn-danger delete-workout-btn" data-video-id="${w.video_id}">Delete</button>
        </div>
      </div>
    `).join("");
  }
  // הוספת מאזיני אירועים לכל כפתורי מחיקה
  const deleteButtons = document.querySelectorAll(".delete-workout-btn");
  deleteButtons.forEach(button => {
    button.addEventListener("click", function() {
      const videoId = this.getAttribute("data-video-id");
      if (confirm("האם אתה בטוח שברצונך למחוק את האימון?")) {
        deleteWorkout(videoId).then(() => {
          showAllWorkouts();
        });
      }
    });
  });
}

// הצגת אימון יומי – בוחרים אימון אקראי ומציגים כרטיס עם המידע
async function showTodaysWorkout() {
  const workouts = await fetchWorkouts();
  const content = document.getElementById("content-area");
  if (workouts.length === 0) {
    content.innerHTML = `<p>No workouts available for today.</p>`;
  } else {
    const randomWorkout = workouts[Math.floor(Math.random() * workouts.length)];
    content.innerHTML = `
      <div class="card mb-3">
        <div class="card-body text-end">
          <h5 class="card-title">${randomWorkout.title}</h5>
          <p class="card-text">ערוץ: ${randomWorkout.channel}</p>
          <p class="card-text">משך: ${randomWorkout.duration}</p>
          <p class="card-text">צפיות: ${randomWorkout.view_count || ''}</p>
          <p class="card-text">לייקים: ${randomWorkout.like_count || ''}</p>
          <img src="https://img.youtube.com/vi/${randomWorkout.video_id}/hqdefault.jpg" alt="Thumbnail" class="img-fluid mb-2">
          <a href="https://youtu.be/${randomWorkout.video_id}" target="_blank" class="btn btn-primary">Watch Video</a>
        </div>
      </div>
    `;
  }
}

// הצגת טופס להוספת אימון: המשתמש מזין רק YouTube URL
function showAddWorkoutForm() {
  const content = document.getElementById("content-area");
  content.innerHTML = `
    <form id="add-workout-form">
      <div class="mb-3">
        <label for="video_url" class="form-label">YouTube Video URL</label>
        <input type="text" class="form-control" id="video_url" placeholder="https://www.youtube.com/watch?v=..." required>
      </div>
      <button type="submit" class="btn btn-success">Add Workout</button>
    </form>
    <div id="video-info" class="mt-3"></div>
  `;

  document.getElementById("add-workout-form").addEventListener("submit", async function(e) {
    e.preventDefault();
    const url = document.getElementById("video_url").value;
    const videoInfoDiv = document.getElementById("video-info");
    videoInfoDiv.innerHTML = "<p>Fetching video info...</p>";
    
    const workoutData = await getVideoInfo(url);
    if (!workoutData) {
      videoInfoDiv.innerHTML = "<p>Could not retrieve video info. Please check the URL.</p>";
      return;
    }
    
    // הצגת המידע שהתקבל לצורך אישור המשתמש
    videoInfoDiv.innerHTML = `
      <p><strong>Title:</strong> ${workoutData.title}</p>
      <p><strong>Channel:</strong> ${workoutData.channel}</p>
      <p><strong>Duration (sec):</strong> ${workoutData.duration}</p>
    `;
    
    if (confirm("Add this workout?")) {
      addWorkout(workoutData).then(() => {
        alert("Workout added!");
        showAllWorkouts();
      });
    }
  });
}

function showUpdateWorkoutForm(videoId, workoutData) {
  const content = document.getElementById("content-area");
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
      <button type="button" class="btn btn-secondary" id="cancel-update">Cancel</button>
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
  
  document.getElementById("cancel-update").addEventListener("click", () => {
    showAllWorkouts();
  });
}

// פונקציה להמרת ISO8601 Duration לשניות
function isoDurationToSeconds(isoDuration) {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = isoDuration.match(regex);
  if (!matches) return 0;
  const hours = parseInt(matches[1] || 0);
  const minutes = parseInt(matches[2] || 0);
  const seconds = parseInt(matches[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

// פונקציה לשליפת מידע מ-YouTube באמצעות Data API
async function getVideoInfo(url) {
  const regex = /(?:youtube\.com\/.*(?:\?|\&)v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regex);
  if (!match || match.length < 2) {
    alert("Invalid YouTube URL");
    return null;
  }
  const videoId = match[1];
  const apiKey = 'AIzaSyAL_pDebENP8_IF4AI0_6YWY3xCjHklfH0';
  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error('YouTube API error:', response.statusText);
      return null;
    }
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      const snippet = item.snippet;
      const details = item.contentDetails;
      const stats = item.statistics;
      const durationSeconds = isoDurationToSeconds(details.duration);
      return {
        video_id: videoId,
        title: snippet.title,
        channel: snippet.channelTitle,
        channel_id: snippet.channelId,
        duration: durationSeconds,
        view_count: stats.viewCount,
        like_count: stats.likeCount,
        tags: snippet.tags,
        category_id: snippet.categoryId
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching video info:', error);
    return null;
  }
}

// אתחול סרגל הצד - אנו עושים זאת באמצעות מאזיני אירועים למחלקות משותפות, כפי שהוגדר למעלה.
document.addEventListener("DOMContentLoaded", function() {
  // כאן לא צריך לעדכן את ה-layout של main-content, כי זה נעשה ב-index.html
  // אנו רק נוודא שהמאזינים עבור הניווט (מובייל ודסקטופ) נרשמים

  // מאזין לכל כפתורי "Today's Workout"
  const navTodaysButtons = document.querySelectorAll(".nav-todays");
  navTodaysButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      showTodaysWorkout();
      // סגירת Offcanvas אם קיים
      const offcanvasEl = document.getElementById("offcanvasSidebar");
      if (offcanvasEl) {
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (bsOffcanvas) {
          bsOffcanvas.hide();
        }
      }
    });
  });

  // מאזין לכל כפתורי "All Workouts"
  const navAllButtons = document.querySelectorAll(".nav-all");
  navAllButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      showAllWorkouts();
      const offcanvasEl = document.getElementById("offcanvasSidebar");
      if (offcanvasEl) {
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (bsOffcanvas) {
          bsOffcanvas.hide();
        }
      }
    });
  });

  // מאזין לכל כפתורי "Add Workout"
  const navAddButtons = document.querySelectorAll(".nav-add");
  navAddButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      showAddWorkoutForm();
      const offcanvasEl = document.getElementById("offcanvasSidebar");
      if (offcanvasEl) {
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (bsOffcanvas) {
          bsOffcanvas.hide();
        }
      }
    });
  });

  // מאזין לכל כפתורי "Logout"
  const navLogoutButtons = document.querySelectorAll(".nav-logout");
  navLogoutButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      localStorage.removeItem("access_token");
      window.location.href = "auth.html";
    });
  });
});
