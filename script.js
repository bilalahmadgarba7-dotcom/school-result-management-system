console.log("ClassMark script loaded");
alert("ClassMark JavaScript is working!");
// ================================
// SUPABASE CONNECTION
// ================================

const SUPABASE_URL =
“https://wzqcjbuotsipshjgrboo.supabase.co”;

const SUPABASE_PUBLIC_KEY =
“sb_publishable_qwB02PL2sdF7gHDOjXgJpA_-d_W4o6m”;

const supabaseClient =
window.supabase.createClient(
SUPABASE_URL,
SUPABASE_PUBLIC_KEY
);

// ================================
// SHOW LOGIN MODAL
// ================================

function showLogin() {

const modal =
    document.getElementById("loginModal");
if (modal) {
    modal.classList.add("active");
}

}

// ================================
// CLOSE LOGIN MODAL
// ================================

function closeLogin() {

const modal =
    document.getElementById("loginModal");
if (modal) {
    modal.classList.remove("active");
}

}

// ================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ================================

document.addEventListener(
“click”,
function (event) {

    const modal =
        document.getElementById("loginModal");
    if (
        modal &&
        event.target === modal
    ) {
        closeLogin();
    }
}

);

// ================================
// LEARN MORE BUTTON
// ================================

function learnMore() {

const featuresSection =
    document.querySelector(".features");
if (featuresSection) {
    featuresSection.scrollIntoView({
        behavior: "smooth"
    });
}

}

// ================================
// TEACHER LOGIN
// ================================

async function login(event) {

event.preventDefault();
// Get email and password
const email =
    document.getElementById("username")
        .value
        .trim();
const password =
    document.getElementById("password")
        .value
        .trim();
// Check empty fields
if (!email || !password) {
    alert(
        "Please enter your email and password."
    );
    return;
}
try {
    // ================================
    // SUPABASE AUTH LOGIN
    // ================================
    const {
        data,
        error
    } =
        await supabaseClient.auth
            .signInWithPassword({
                email: email,
                password: password
            });
    // ================================
    // AUTHENTICATION ERROR
    // ================================
    if (error) {
        console.error(
            "Authentication error:",
            error
        );
        alert(
            "Invalid email or password."
        );
        return;
    }
    // ================================
    // LOGIN SUCCESSFUL
    // ================================
    console.log(
        "Logged in user:",
        data.user
    );
    alert(
        "Login successful! Welcome to ClassMark."
    );
    closeLogin();
}
catch (error) {
    console.error(
        "Unexpected login error:",
        error
    );
    alert(
        "Something went wrong while logging in. Please try again."
    );
}

} 