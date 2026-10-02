console.log("ClassMark script loaded");

// ================================
// SUPABASE CONNECTION
// ================================
const SUPABASE_URL = "https://wzqcjbuotsipshjgrboo.supabase.co";

const SUPABASE_PUBLIC_KEY =
    "sb_publishable_qwB02PL2sdF7gHDOjXgJpA_-d_W4o6m";

const supabaseClient = window.supabase.createClient(
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
document.addEventListener("click", function (event) {

    const modal =
        document.getElementById("loginModal");

    if (
        modal &&
        event.target === modal
    ) {

        closeLogin();

    }

});


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


    // Get username and password
    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value.trim();


    // Check empty fields
    if (!username || !password) {

        alert(
            "Please enter your username and password."
        );

        return;

    }


    try {

        // ================================
        // FIND TEACHER EMAIL
        // ================================
        const {
            data: teacher,
            error: teacherError
        } = await supabaseClient
            .from("Teacher")
            .select("email")
            .eq("username", username)
            .single();


        // Teacher not found
        if (teacherError || !teacher) {

            console.error(
                "Teacher lookup error:",
                teacherError
            );

            alert(
                "Invalid username or password."
            );

            return;

        }


        // ================================
        // SUPABASE AUTH LOGIN
        // ================================
        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({

            email: teacher.email,

            password: password

        });


        // Authentication failed
        if (error) {

            console.error(
                "Authentication error:",
                error
            );

            alert(
                "Invalid username or password."
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

    } catch (error) {

        console.error(
            "Unexpected login error:",
            error
        );

        alert(
            "Something went wrong while logging in. Please try again."
        );

    }

}