// auth.js

// pendingSignUpData מוגדר במרחב גלובלי
let pendingSignUpData = null;

// יצירת לקוח Supabase
const supabaseUrl = "https://kmwvlpganjabpcqsnrkx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd3ZscGdhbmphYnBjcXNucmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4NzU1MjgsImV4cCI6MjA1NTQ1MTUyOH0.MZhYAWfFI7YTDde44SIhZfSovqCT8DYAZbgtRw7nOEs";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

console.log("auth.js loaded");

// Google Sign In
window.handleSignInWithGoogle = async function(response) {
  console.log("Google response:", response);
  try {
    const { data, error } = await supabaseClient.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential
    });
    if (error) {
      console.error("Error during sign in with Google:", error);
      alert("Error signing in with Google: " + error.message);
    } else {
      console.log("Sign in successful!", data);
      alert("Signed in successfully!");
      if (data && data.session && data.session.access_token) {
        localStorage.setItem("access_token", data.session.access_token);
      }
      window.location.href = "index.html";
    }
  } catch (err) {
    console.error("Unexpected error during sign in with Google:", err);
    alert("Unexpected error during sign in with Google.");
  }
};

document.addEventListener("DOMContentLoaded", function() {
  // Email Sign In
  const emailLoginForm = document.getElementById("email-login-form");
  if (emailLoginForm) {
    emailLoginForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      console.log("Email login form submitted");
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      console.log("Email:", email, "Password:", password);
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });
        if (error) {
          console.error("Error signing in with email:", error);
          alert("Error signing in: " + error.message);
        } else {
          console.log("Email sign in successful!", data);
          alert("Signed in successfully!");
          if (data && data.session && data.session.access_token) {
            localStorage.setItem("access_token", data.session.access_token);
          }
          window.location.href = "index.html";
        }
      } catch (err) {
        console.error("Unexpected error signing in with email:", err);
        alert("Unexpected error during email sign in.");
      }
    });
  }

  // Email Sign Up with hCaptcha Invisible
  const emailSignupForm = document.getElementById("email-signup-form");
  if (emailSignupForm) {
    emailSignupForm.addEventListener("submit", function(e) {
      e.preventDefault();
      console.log("Sign up form submitted");
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;
      const confirmPassword = document.getElementById("signup-confirm-password").value;
      
      console.log("Sign up details:", { email, password, confirmPassword });
      
      if (password !== confirmPassword) {
        alert("Passwords do not match. Please try again.");
        return;
      }
      
      pendingSignUpData = { email, password };
      console.log("Pending sign up data stored:", pendingSignUpData);
      
      waitForHCaptcha().then(() => {
        console.log("hCaptcha loaded, executing challenge");
        window.hcaptcha.execute();
      }).catch((err) => {
        console.error("hCaptcha failed to load:", err);
        alert("hCaptcha not loaded: " + err.message);
      });
    });
  }
});

/*
  פונקציה לחכות שה-hCaptcha נטען (עד 5 שניות)
*/
function waitForHCaptcha(timeout = 5000) {
  console.log("Waiting for hCaptcha to load...");
  return new Promise((resolve, reject) => {
    const interval = 100;
    let elapsed = 0;
    const timer = setInterval(() => {
      if (window.hcaptcha) {
        console.log("hCaptcha is available");
        clearInterval(timer);
        resolve();
      }
      elapsed += interval;
      if (elapsed >= timeout) {
        clearInterval(timer);
        reject(new Error("hCaptcha did not load within timeout"));
      }
    }, interval);
  });
}

/*
  onHCaptchaSuccess - תופעל כאשר hCaptcha Invisible מצליחה ומחזירה טוקן.
*/
async function onHCaptchaSuccess(captchaToken) {
  console.log("onHCaptchaSuccess called with token:", captchaToken);
  if (!pendingSignUpData) {
    console.error("No sign up data pending.");
    return;
  }
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: pendingSignUpData.email,
      password: pendingSignUpData.password,
      captcha_token: captchaToken
    });
    if (error) {
      console.error("Error signing up:", error);
      alert("Error signing up: " + error.message);
    } else {
      console.log("Sign up successful!", data);
      alert("Sign up successful! Please check your email to confirm your account.");
      window.location.href = "auth.html";
    }
  } catch (err) {
    console.error("Unexpected error during sign up:", err);
    alert("Unexpected error during sign up.");
  }
}

// הפיכת onHCaptchaSuccess לזמינה גלובלי
window.onHCaptchaSuccess = onHCaptchaSuccess;

/*
  onHCaptchaError - תופעל כאשר hCaptcha נתקלת בשגיאה או שהמשתמש דוחה את האתגר.
*/
function onHCaptchaError() {
  console.error("hCaptcha challenge failed or was dismissed.");
  alert("Captcha challenge was not completed. Please try again.");
}
window.onHCaptchaError = onHCaptchaError;

/*
  onLoad - נקראת כאשר הסקריפט של hCaptcha נטען.
*/
function onLoad() {
  console.log("hCaptcha script loaded.");
}
window.onLoad = onLoad;
