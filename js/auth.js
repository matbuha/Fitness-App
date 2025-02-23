const supabaseUrl = "https://kmwvlpganjabpcqsnrkx.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd3ZscGdhbmphYnBjcXNucmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4NzU1MjgsImV4cCI6MjA1NTQ1MTUyOH0.MZhYAWfFI7YTDde44SIhZfSovqCT8DYAZbgtRw7nOEs"

// יצירת לקוח Supabase
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);


// פונקציה שמטפלת בתגובה מגוגל לאחר האימות
async function handleSignInWithGoogle(response) {
  console.log("Google response:", response);
  
  try {
    const { data, error } = await supabaseClient.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential
    });
    
    if (error) {
      console.error("Error during sign in:", error);
      alert("Error signing in: " + error.message);
    } else {
      console.log("Sign in successful!", data);
      alert("Signed in successfully!");
      
      // שמור את הטוקן ב-localStorage – נניח שהטוקן נמצא ב-data.session.access_token
      if (data && data.session && data.session.access_token) {
        localStorage.setItem("access_token", data.session.access_token);
      } else {
        console.warn("No token found in the response data.");
      }
      
      // הפנה את המשתמש לדף הבית
      window.location.href = "index.html";
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    alert("Unexpected error during sign in.");
  }
}


// הפוך את הפונקציה לזמינה גלובלית כך ש-Google Identity Services תוכל לגשת אליה
window.handleSignInWithGoogle = handleSignInWithGoogle;

