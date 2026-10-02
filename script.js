console.log("ClassMark script loaded");

// ================================
// SUPABASE CONNECTION
// ================================

// ================================
// CLASSMARK - MAIN JAVASCRIPT
// ================================


// Show Login Modal
function showLogin() {
    const modal = document.getElementById("loginModal");

    if (modal) {
        modal.classList.add("active");
    }
}


// Close Login Modal
function closeLogin() {
    const modal = document.getElementById("loginModal");

    if (modal) {
        modal.classList.remove("active");
    }
}


// Close modal when clicking outside it
document.addEventListener("click", function (event) {

    const modal = document.getElementById("loginModal");

    if (
        modal &&
        event.target === modal
    ) {
        closeLogin();
    }

});


// Learn More button
function learnMore() {

    const featuresSection =
        document.querySelector(".features");

    if (featuresSection) {

        featuresSection.scrollIntoView({
            behavior: "smooth"
        });

    }

}


// Teacher Login with Supabase
async function login(event) {

    event.preventDefault();

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Please enter your username and password.");
        return;
    }

    alert(
        "Login connection is ready.\n\n" +
        "Supabase authentication will be connected after the API keys are added."
    );

    closeLogin();
}