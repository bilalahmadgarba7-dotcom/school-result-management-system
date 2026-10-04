// ==========================================
// CLASSMARK
// School Result Management System
// ==========================================

// ------------------------------------------
// SUPABASE CONFIGURATION
// ------------------------------------------

const SUPABASE_URL =
    "https://wzqcjbuotsipshjgrboo.supabase.co";

const SUPABASE_PUBLIC_KEY =
    "sb_publishable_qwB02PL2sdF7gHDOjXgJpA_-d_W4o6m";


// ------------------------------------------
// SUPABASE CLIENT
// ------------------------------------------

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLIC_KEY
    );


// ------------------------------------------
// APPLICATION STATE
// ------------------------------------------

let currentUser = null;
let teacherProfile = null;


// ------------------------------------------
// APP START
// ------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "ClassMark application started."
        );

        await checkAuthentication();

    }
);


// ------------------------------------------
// CHECK AUTHENTICATION
// ------------------------------------------

async function checkAuthentication() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {

            console.error(
                "Authentication check failed:",
                error
            );

            return;
        }


        if (data.session) {

            currentUser =
                data.session.user;

            console.log(
                "User is authenticated:",
                currentUser.email
            );

        } else {

            console.log(
                "No authenticated user."
            );

        }

    } catch (error) {

        console.error(
            "Unexpected authentication error:",
            error
        );

    }

}


// ------------------------------------------
// AUTH STATE LISTENER
// ------------------------------------------

supabaseClient
    .auth
    .onAuthStateChange(
        function (event, session) {

            console.log(
                "Auth event:",
                event
            );


            if (session) {

                currentUser =
                    session.user;

            } else {

                currentUser = null;
                teacherProfile = null;

            }

        }
    );
    // ==========================================
// TEACHER LOGIN
// ==========================================

async function login(event) {

    event.preventDefault();


    const email =
        document
            .getElementById("username")
            .value
            .trim();

    const password =
        document
            .getElementById("password")
            .value;


    if (!email || !password) {

        alert(
            "Please enter your email and password."
        );

        return;
    }


    const submitButton =
        document.querySelector(
            "#loginForm button[type='submit']"
        );


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
            "Signing in...";

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({
                    email: email,
                    password: password
                });


        if (error) {

            console.error(
                "Login error:",
                error
            );

            alert(
                "Login failed. Please check your email and password."
            );

            return;
        }


        currentUser =
            data.user;


        console.log(
            "Login successful:",
            currentUser.email
        );


        closeLogin();


        alert(
            "Welcome to ClassMark!"
        );


    } catch (error) {

        console.error(
            "Unexpected login error:",
            error
        );

        alert(
            "Something went wrong. Please try again."
        );


    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                "Sign In to ClassMark";

        }

    }

}
// ==========================================
// LOAD TEACHER PROFILE
// ==========================================

async function loadTeacherProfile() {

    if (!currentUser) {

        console.warn(
            "Cannot load teacher profile: no authenticated user."
        );

        return null;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("Teacher")
                .select(`
                    id,
                    full_name,
                    phone,
                    username,
                    email,
                    school_name,
                    class_name,
                    session,
                    term
                `)
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Teacher profile error:",
                error
            );

            alert(
                "Unable to load your teacher profile."
            );

            return null;
        }


        if (!data) {

            console.warn(
                "No teacher profile found."
            );

            alert(
                "Your teacher profile was not found."
            );

            return null;
        }


        teacherProfile = data;


        console.log(
            "Teacher profile loaded:",
            teacherProfile
        );


        return teacherProfile;


    } catch (error) {

        console.error(
            "Unexpected teacher profile error:",
            error
        );

        alert(
            "Something went wrong while loading your profile."
        );

        return null;
    }

}
    