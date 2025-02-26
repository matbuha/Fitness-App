// auth.js

// יצירת לקוח Supabase
const supabaseUrl = "https://kmwvlpganjabpcqsnrkx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd3ZscGdhbmphYnBjcXNucmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4NzU1MjgsImV4cCI6MjA1NTQ1MTUyOH0.MZhYAWfFI7YTDde44SIhZfSovqCT8DYAZbgtRw7nOEs";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

/* 
  Google Sign In - מופעל על ידי Google Identity Services
*/
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

/*
  מאזין לטופס ההתחברות באמצעות אימייל וסיסמה (Sign In)
*/
document.addEventListener("DOMContentLoaded", function() {
  const emailLoginForm = document.getElementById("email-login-form");
  if (emailLoginForm) {
    emailLoginForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
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

  /* משתנה גלובלי לאחסון נתוני ההרשמה עד לקבלת טוקן hCaptcha */
  let pendingSignUpData = null;

  /* מאזין לטופס ההרשמה (Sign Up) */
  const emailSignupForm = document.getElementById("email-signup-form");
  if (emailSignupForm) {
    emailSignupForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;
      const confirmPassword = document.getElementById("signup-confirm-password").value;
      
      if (password !== confirmPassword) {
        alert("Passwords do not match. Please try again.");
        return;
      }
      
      // שמירת נתוני ההרשמה למשתנה גלובלי
      pendingSignUpData = { email, password };
      
      // הפעלת hCaptcha Invisible
      if (window.hcaptcha) {
        window.hcaptcha.execute(); // פעולה זו תגרום לקריאה לפונקציה onHCaptchaSuccess כאשר hCaptcha תצליח
      } else {
        alert("hCaptcha not loaded. Please try again later.");
      }
    });
  }
});

/*
  פונקציה זו תקרא כאשר hCaptcha Invisible מסיים בהצלחה ומחזירה טוקן.
  אנו משתמשים בטוקן זה כדי לבצע את ההרשמה עם Supabase.
*/
async function onHCaptchaSuccess(captchaToken) {
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
      window.location.href = "auth.html"; // הפנייה לדף ההתחברות, או כפי שמתאים
    }
  } catch (err) {
    console.error("Unexpected error during sign up:", err);
    alert("Unexpected error during sign up.");
  }
}

// הפיכת onHCaptchaSuccess לזמינה גלובלי כך ש-hCaptcha תוכל לגשת אליה
window.onHCaptchaSuccess = onHCaptchaSuccess;
